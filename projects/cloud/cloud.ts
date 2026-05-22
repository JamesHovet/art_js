export {};

declare const axidraw: { AxiDraw: new () => any };

import { Matrix4, Vector3 } from 'threejs-math';
import { createSlider, createCheckbox } from '../../shared/controls';

// ============================================================
// CONFIG — all tuneable values live here
// ============================================================

const CANVAS_WIDTH  = 1056;
const CANVAS_HEIGHT = 1344;

const CAMERA = {
  pos: {
    x: { default:  0.8,  min: -5,  max: 5,  step: 0.05 },
    y: { default: -0.35,  min: -3,  max: 3,  step: 0.05 },
    z: { default:  0.0,  min: -5,  max: 5,  step: 0.05 },
  },
  lookAt: {
    x: { default:  0.25,  min: -2,  max: 2,  step: 0.05 },
    y: { default:  0.0,  min: -2,  max: 2,  step: 0.05 },
    z: { default:  0.0,  min: -2,  max: 2,  step: 0.05 },
  },
  up:             new Vector3(0, 1, 0),
  focalLengthMm:  25,
  sensorHeightMm: 36,
};

const SURFACE = {
  waistRadius: { default: 0.41, min: 0.01, max: 0.5,  step: 0.01 },
  flare:       { default: 3.1,  min: 0.0,  max: 10.0, step: 0.1  },
};

const WIREFRAME = {
  nU: 24,
  nV: 16,
};

const PARAMS = {
  showWireframe: { default: false },
  showPoints:    { default: true },
  pointCount:    { default: 25000,  min: 10, max: 25000, step: 10   },
  minDistance:   { default: 8,   min: 0,  max: 200,  step: 1    },
  strokeLengthMean:   { default: 0.03, min: 0, max: 0.5, step: 0.005 },
  strokeLengthStddev: { default: 0.02, min: 0, max: 0.2, step: 0.005 },
};

const PLOTTER = {
  penDownWaitMs:         { default: 1000, min: 0, max: 5000, step: 100 },
  beforeNextPointWaitMs: { default: 1000, min: 0, max: 5000, step: 100 },
  strokeTravelMm:        { default: 50.8, min: 0, max: 200,  step: 0.5 },
  testClipMode:          { default: true },
};

// ============================================================
// DERIVED — computed from config above, do not edit
// ============================================================

const SENSOR_WIDTH_MM = CAMERA.sensorHeightMm * (CANVAS_WIDTH / CANVAS_HEIGHT);
const F_X = (CAMERA.focalLengthMm / SENSOR_WIDTH_MM) * CANVAS_WIDTH;
const F_Y = (CAMERA.focalLengthMm / CAMERA.sensorHeightMm) * CANVAS_HEIGHT;

const PX_TO_MM      = 279.4 / 1056;         // 11 inches across 1056 canvas px
const PAGE_WIDTH_MM = 1056 * PX_TO_MM;       // ≈ 279.4 mm
const CLIP_REGION   = { x: CANVAS_WIDTH - 300, y: 0, w: 300, h: 300 };

function buildViewMatrix(): Matrix4 {
  const z = camPos.clone().sub(camLookAt).normalize();
  const x = new Vector3().crossVectors(CAMERA.up, z).normalize();
  const y = new Vector3().crossVectors(z, x);
  const view = new Matrix4();
  view.set(
    x.x, x.y, x.z, -x.dot(camPos),
    y.x, y.y, y.z, -y.dot(camPos),
    z.x, z.y, z.z, -z.dot(camPos),
    0,   0,   0,    1
  );
  return view;
}

// ============================================================
// DRAWING STATE — runtime values, initialized from PARAMS
// ============================================================

let camPos    = new Vector3(CAMERA.pos.x.default,    CAMERA.pos.y.default,    CAMERA.pos.z.default);
let camLookAt = new Vector3(CAMERA.lookAt.x.default, CAMERA.lookAt.y.default, CAMERA.lookAt.z.default);
let VIEW_MATRIX = buildViewMatrix();

let showWireframe = PARAMS.showWireframe.default;
let showPoints    = PARAMS.showPoints.default;
let pointCount    = PARAMS.pointCount.default;
let minDistance        = PARAMS.minDistance.default;
let strokeLengthMean   = PARAMS.strokeLengthMean.default;
let strokeLengthStddev = PARAMS.strokeLengthStddev.default;
let waistRadius   = SURFACE.waistRadius.default;
let flare         = SURFACE.flare.default;

interface Point { world: Vector3; u: number; v: number; strokeLen: number; }
let cachedPoints: Point[] = [];
let statsEl: HTMLElement | null = null;

let penDownWaitMs         = PLOTTER.penDownWaitMs.default;
let beforeNextPointWaitMs = PLOTTER.beforeNextPointWaitMs.default;
let strokeTravelMm        = PLOTTER.strokeTravelMm.default;
let testClipMode          = PLOTTER.testClipMode.default;

// ============================================================
// GEOMETRY
// ============================================================

function normalRandom(mean: number, stddev: number): number {
  const u1 = Math.random(), u2 = Math.random();
  return mean + stddev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function surfaceRadius(y: number): number {
  return waistRadius * Math.sqrt(1 + (y * flare) ** 2);
}

function surfacePoint(u: number, y: number): Vector3 {
  const r = surfaceRadius(y);
  return new Vector3(r * Math.cos(u), y, r * Math.sin(u));
}

function generatePoints(): Point[] {
  const pts: Point[] = [];
  const screenPts: { x: number; y: number }[] = [];
  const minDist2 = minDistance * minDistance;
  const maxAttempts = pointCount * 30;
  let attempts = 0;

  while (pts.length < pointCount && attempts < maxAttempts) {
    attempts++;
    const u = -Math.PI / 2 + Math.random() * Math.PI;
    const v = -0.5 + Math.random();
    const world = surfacePoint(u, v);
    const screen = projectPoint(world);
    if (!screen) continue;
    if (screen.x < 0 || screen.x > CANVAS_WIDTH || screen.y < 0 || screen.y > CANVAS_HEIGHT) continue;

    let tooClose = false;
    for (const s of screenPts) {
      const dx = screen.x - s.x, dy = screen.y - s.y;
      if (dx * dx + dy * dy < minDist2) { tooClose = true; break; }
    }
    if (tooClose) continue;

    screenPts.push(screen);
    const strokeLen = Math.max(0, normalRandom(strokeLengthMean, strokeLengthStddev));
    pts.push({ world, u, v, strokeLen });
  }
  return pts;
}

// ============================================================
// PROJECTION
// ============================================================

function projectPoint(world: Vector3): { x: number; y: number } | null {
  const p = world.clone().applyMatrix4(VIEW_MATRIX);
  const depth = -p.z;
  if (depth <= 0) return null;
  return {
    x: CANVAS_WIDTH  / 2 + F_X * (p.x / depth),
    y: CANVAS_HEIGHT / 2 - F_Y * (p.y / depth),
  };
}

// ============================================================
// SVG HELPERS
// ============================================================

let svgElement: SVGElement;
let uvSvgElement: SVGElement;

const UV_SIZE = CANVAS_WIDTH;

function svgLine(pa: { x: number; y: number }, pb: { x: number; y: number }, stroke = 'black', width = '1', target: Element = svgElement) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  el.setAttribute('x1', pa.x.toFixed(2)); el.setAttribute('y1', pa.y.toFixed(2));
  el.setAttribute('x2', pb.x.toFixed(2)); el.setAttribute('y2', pb.y.toFixed(2));
  el.setAttribute('stroke', stroke);
  el.setAttribute('stroke-width', width);
  target.appendChild(el);
}

function svgCircle(target: Element, cx: number, cy: number, r = 2) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  el.setAttribute('cx', cx.toFixed(2));
  el.setAttribute('cy', cy.toFixed(2));
  el.setAttribute('r', r.toString());
  el.setAttribute('fill', 'black');
  target.appendChild(el);
}

function uvToScreen(u: number, v: number): { x: number; y: number } {
  return {
    x: (u + Math.PI / 2) / Math.PI * UV_SIZE,
    y: (0.5 - v) * UV_SIZE,
  };
}

// ============================================================
// PLOTTER HELPERS
// ============================================================

function toPlotter(x_mm: number, y_mm: number): { x: number; y: number } {
  return { x: y_mm, y: PAGE_WIDTH_MM - x_mm };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clipRayToBox(
  px: number, py: number,
  dx: number, dy: number,
  maxT: number,
  box: { x: number; y: number; w: number; h: number }
): { x: number; y: number } {
  let t = maxT;
  if (dx > 0) t = Math.min(t, (box.x + box.w - px) / dx);
  else if (dx < 0) t = Math.min(t, (box.x - px) / dx);
  if (dy > 0) t = Math.min(t, (box.y + box.h - py) / dy);
  else if (dy < 0) t = Math.min(t, (box.y - py) / dy);
  t = Math.max(0, t);
  return { x: px + dx * t, y: py + dy * t };
}

// ============================================================
// DRAW
// ============================================================

function draw() {
  if (!svgElement) return;
  svgElement.innerHTML = '';
  uvSvgElement.innerHTML = '';

  let mainTarget: Element = svgElement;
  if (testClipMode) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'testClip');
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', CLIP_REGION.x.toString());
    clipRect.setAttribute('y', CLIP_REGION.y.toString());
    clipRect.setAttribute('width', CLIP_REGION.w.toString());
    clipRect.setAttribute('height', CLIP_REGION.h.toString());
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svgElement.appendChild(defs);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('clip-path', 'url(#testClip)');
    svgElement.appendChild(g);
    mainTarget = g;

    const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    border.setAttribute('x', CLIP_REGION.x.toString());
    border.setAttribute('y', CLIP_REGION.y.toString());
    border.setAttribute('width', CLIP_REGION.w.toString());
    border.setAttribute('height', CLIP_REGION.h.toString());
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', '#e53e3e');
    border.setAttribute('stroke-width', '2');
    svgElement.appendChild(border);
  }

  if (showWireframe) {
    const pts: Array<Array<{ x: number; y: number } | null>> = [];
    for (let vi = 0; vi <= WIREFRAME.nV; vi++) {
      const y = -0.5 + vi / WIREFRAME.nV;
      const row: Array<{ x: number; y: number } | null> = [];
      for (let ui = 0; ui <= WIREFRAME.nU; ui++) {
        const u = -Math.PI / 2 + (ui / WIREFRAME.nU) * Math.PI;
        row.push(projectPoint(surfacePoint(u, y)));
      }
      pts.push(row);
    }
    for (let vi = 0; vi <= WIREFRAME.nV; vi++)
      for (let ui = 0; ui < WIREFRAME.nU; ui++) {
        const pa = pts[vi][ui], pb = pts[vi][ui + 1];
        if (pa && pb) svgLine(pa, pb, 'black', '1', mainTarget);
      }
    for (let ui = 0; ui <= WIREFRAME.nU; ui++)
      for (let vi = 0; vi < WIREFRAME.nV; vi++) {
        const pa = pts[vi][ui], pb = pts[vi + 1][ui];
        if (pa && pb) svgLine(pa, pb, 'black', '1', mainTarget);
      }
  }

  if (showPoints) {
    for (const { world, u, v, strokeLen } of cachedPoints) {
      const p = projectPoint(world);
      const p2 = strokeLen > 0 ? projectPoint(surfacePoint(u, v + strokeLen)) : null;
      if (p) {
        svgCircle(mainTarget, p.x, p.y);
        if (p2) svgLine(p, p2, 'black', '1', mainTarget);
      }
      const uv = uvToScreen(u, v);
      svgCircle(uvSvgElement, uv.x, uv.y);
    }
  }

  // Debug axes: R=X, G=Y, B=Z, each 1m long
  const origin = projectPoint(new Vector3(0, 0, 0));
  if (origin) {
    for (const [tip, color] of [
      [new Vector3(1, 0, 0), 'red'],
      [new Vector3(0, 1, 0), 'green'],
      [new Vector3(0, 0, 1), 'blue'],
    ] as [Vector3, string][]) {
      const p = projectPoint(tip);
      if (p) svgLine(origin, p, color, '2', mainTarget);
    }
  }
}

// ============================================================
// CONTROLS
// ============================================================

function rebuildCamera() { VIEW_MATRIX = buildViewMatrix(); draw(); }
function regenerate() {
  cachedPoints = generatePoints();
  if (statsEl) statsEl.textContent = `Points placed: ${cachedPoints.length} / ${pointCount}`;
  draw();
}

function setupControls(container: HTMLElement) {
  createCheckbox(container, 'Show wireframe', showWireframe, (v) => { showWireframe = v; draw(); });
  createCheckbox(container, 'Show points', showPoints, (v) => {
    showPoints = v;
    if (v && cachedPoints.length === 0) regenerate(); else draw();
  });

  for (const [label, axis, target] of [
    ['Camera X', 'x', camPos],    ['Camera Y', 'y', camPos],    ['Camera Z', 'z', camPos],
    ['LookAt X', 'x', camLookAt], ['LookAt Y', 'y', camLookAt], ['LookAt Z', 'z', camLookAt],
  ] as [string, 'x'|'y'|'z', Vector3][]) {
    const cfg = target === camPos ? CAMERA.pos[axis] : CAMERA.lookAt[axis];
    createSlider(container, {
      label, min: cfg.min, max: cfg.max, step: cfg.step, value: cfg.default,
      onChange: (v) => { target[axis] = v; rebuildCamera(); },
    });
  }

  createSlider(container, {
    label: 'Waist radius',
    min: SURFACE.waistRadius.min, max: SURFACE.waistRadius.max, step: SURFACE.waistRadius.step,
    value: SURFACE.waistRadius.default,
    onChange: (v) => { waistRadius = v; regenerate(); },
  });

  createSlider(container, {
    label: 'Flare',
    min: SURFACE.flare.min, max: SURFACE.flare.max, step: SURFACE.flare.step,
    value: SURFACE.flare.default,
    onChange: (v) => { flare = v; regenerate(); },
  });

  createSlider(container, {
    label: 'Point count',
    min: PARAMS.pointCount.min, max: PARAMS.pointCount.max, step: PARAMS.pointCount.step,
    value: PARAMS.pointCount.default,
    format: (v) => Math.round(v).toString(),
    onChange: (v) => { pointCount = Math.round(v); regenerate(); },
  });

  createSlider(container, {
    label: 'Min distance (px)',
    min: PARAMS.minDistance.min, max: PARAMS.minDistance.max, step: PARAMS.minDistance.step,
    value: PARAMS.minDistance.default,
    onChange: (v) => { minDistance = v; },  // no auto-regenerate; use Replant
  });

  createSlider(container, {
    label: 'Stroke length mean',
    min: PARAMS.strokeLengthMean.min, max: PARAMS.strokeLengthMean.max, step: PARAMS.strokeLengthMean.step,
    value: PARAMS.strokeLengthMean.default,
    onChange: (v) => { strokeLengthMean = v; regenerate(); },
  });

  createSlider(container, {
    label: 'Stroke length std dev',
    min: PARAMS.strokeLengthStddev.min, max: PARAMS.strokeLengthStddev.max, step: PARAMS.strokeLengthStddev.step,
    value: PARAMS.strokeLengthStddev.default,
    onChange: (v) => { strokeLengthStddev = v; regenerate(); },
  });

  const replantButton = document.createElement('button');
  replantButton.textContent = 'Replant points';
  replantButton.style.cssText = 'margin-top:10px;width:100%;padding:8px;background:#28a745;color:white;font-weight:bold;border:none;border-radius:4px;cursor:pointer;font-size:14px';
  replantButton.addEventListener('click', regenerate);
  container.appendChild(replantButton);

  statsEl = document.createElement('div');
  statsEl.style.cssText = 'margin-top:8px;font-size:13px;color:#555;text-align:center';
  statsEl.textContent = `Points placed: ${cachedPoints.length} / ${pointCount}`;
  container.appendChild(statsEl);

  const saveSVGButton = document.createElement('button');
  saveSVGButton.id = 'saveSVG';
  saveSVGButton.textContent = 'Save SVG';
  saveSVGButton.style.cssText = 'margin-top:10px;width:100%;padding:8px;background:#007bff;color:white;font-weight:bold;border:none;border-radius:4px;cursor:pointer;font-size:14px';
  saveSVGButton.addEventListener('click', exportSVG);
  container.appendChild(saveSVGButton);
}

// ============================================================
// PLOTTER
// ============================================================

async function plotPoints(axi: any, statusEl: HTMLElement) {
  const clipBox = testClipMode
    ? CLIP_REGION
    : { x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT };
  const travelPx = strokeTravelMm / PX_TO_MM;

  const visiblePoints = cachedPoints.filter(({ world }) => {
    const p = projectPoint(world);
    return p !== null
      && p.x >= clipBox.x && p.x <= clipBox.x + clipBox.w
      && p.y >= clipBox.y && p.y <= clipBox.y + clipBox.h;
  });

  await axi.penUp();

  for (let i = 0; i < visiblePoints.length; i++) {
    const { world, u, v, strokeLen } = visiblePoints[i];
    const p = projectPoint(world);
    if (!p) continue;

    statusEl.textContent = `Plotting ${i + 1} / ${visiblePoints.length}…`;

    const pt = toPlotter(p.x * PX_TO_MM, p.y * PX_TO_MM);
    await axi.moveTo(pt.x, pt.y);
    await axi.penDown();
    await sleep(penDownWaitMs);
    await axi.penUp();

    const p2 = strokeLen > 0 ? projectPoint(surfacePoint(u, v + strokeLen)) : null;
    if (p2) {
      const dx = p2.x - p.x, dy = p2.y - p.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const end = clipRayToBox(p.x, p.y, dx / len, dy / len, travelPx, clipBox);
        const et = toPlotter(end.x * PX_TO_MM, end.y * PX_TO_MM);
        await axi.moveTo(et.x, et.y);
      }
    }

    await sleep(beforeNextPointWaitMs);
  }

  await axi.moveTo(0, 0);
  await axi.disable();
  statusEl.textContent = `Done. ${visiblePoints.length} points plotted.`;
}

function setupPlotterControls(container: HTMLElement) {
  const heading = document.createElement('h3');
  heading.textContent = 'Plotter';
  heading.style.cssText = 'margin: 20px 0 8px; border-top: 1px solid #ccc; padding-top: 16px;';
  container.appendChild(heading);

  createCheckbox(container, 'Test clip mode (top-right 300×300)', testClipMode, (v) => {
    testClipMode = v; draw();
  });

  createSlider(container, {
    label: 'Pen down wait (ms)',
    min: PLOTTER.penDownWaitMs.min, max: PLOTTER.penDownWaitMs.max, step: PLOTTER.penDownWaitMs.step,
    value: PLOTTER.penDownWaitMs.default,
    format: (v) => Math.round(v).toString(),
    onChange: (v) => { penDownWaitMs = Math.round(v); },
  });

  createSlider(container, {
    label: 'Before-next-point wait (ms)',
    min: PLOTTER.beforeNextPointWaitMs.min, max: PLOTTER.beforeNextPointWaitMs.max, step: PLOTTER.beforeNextPointWaitMs.step,
    value: PLOTTER.beforeNextPointWaitMs.default,
    format: (v) => Math.round(v).toString(),
    onChange: (v) => { beforeNextPointWaitMs = Math.round(v); },
  });

  createSlider(container, {
    label: 'Stroke travel (mm)',
    min: PLOTTER.strokeTravelMm.min, max: PLOTTER.strokeTravelMm.max, step: PLOTTER.strokeTravelMm.step,
    value: PLOTTER.strokeTravelMm.default,
    onChange: (v) => { strokeTravelMm = v; },
  });

  const connectBtn = document.createElement('button');
  connectBtn.textContent = 'Connect to AxiDraw';
  connectBtn.style.cssText = 'margin-top:10px;width:100%;padding:8px;background:#2563eb;color:white;font-weight:bold;border:none;border-radius:4px;cursor:pointer;font-size:14px';
  container.appendChild(connectBtn);

  const plotBtn = document.createElement('button');
  plotBtn.textContent = 'Plot';
  plotBtn.disabled = true;
  plotBtn.style.cssText = 'margin-top:8px;width:100%;padding:8px;background:#16a34a;color:white;font-weight:bold;border:none;border-radius:4px;cursor:pointer;font-size:14px';
  container.appendChild(plotBtn);

  const statusEl = document.createElement('div');
  statusEl.style.cssText = 'margin-top:8px;font-size:13px;color:#555;line-height:1.4;';
  statusEl.textContent = 'Not connected.';
  container.appendChild(statusEl);

  connectBtn.addEventListener('click', async () => {
    connectBtn.disabled = true;
    statusEl.textContent = 'Connecting…';
    try {
      const axi = new axidraw.AxiDraw();
      await axi.connect();
      statusEl.textContent = 'Connected. Click Plot to start.';
      plotBtn.disabled = false;

      plotBtn.addEventListener('click', async () => {
        plotBtn.disabled = true;
        try {
          await plotPoints(axi, statusEl);
        } catch (err: any) {
          statusEl.textContent = 'Error: ' + err.message;
          plotBtn.disabled = false;
        }
      }, { once: true });
    } catch (err: any) {
      statusEl.textContent = 'Connection failed: ' + err.message;
      connectBtn.disabled = false;
    }
  });
}

// ============================================================
// INIT
// ============================================================

function exportSVG() {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cloud.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function init() {
  const cloudContainer = document.getElementById('cloud-container');
  const controlsContainer = document.getElementById('controls-container');
  if (!cloudContainer || !controlsContainer) return;

  svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.setAttribute('width', CANVAS_WIDTH.toString());
  svgElement.setAttribute('height', CANVAS_HEIGHT.toString());
  svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgElement.style.cssText = 'position:absolute;top:0;left:0';
  cloudContainer.appendChild(svgElement);

  const uvContainer = document.getElementById('uv-container');
  if (uvContainer) {
    uvSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    uvSvgElement.setAttribute('width', UV_SIZE.toString());
    uvSvgElement.setAttribute('height', UV_SIZE.toString());
    uvSvgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    uvSvgElement.style.cssText = 'position:absolute;top:0;left:0';
    uvContainer.appendChild(uvSvgElement);
  }

  setupControls(controlsContainer);
  setupPlotterControls(controlsContainer);
  if (showPoints) regenerate(); else draw();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
