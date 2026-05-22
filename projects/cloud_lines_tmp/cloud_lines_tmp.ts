export {};

const PARAM_CONFIG = {
  lineCount:  { default: 80,  min: 5,   max: 5000, step: 1,   decimals: 0 },
  lineWidth:  { default: 1.0, min: 0.1, max: 10,  step: 0.1, decimals: 1 },
  lengthMean: { default: 100, min: 5,   max: 600, step: 1,   decimals: 0 },
  lengthStd:  { default: 40,  min: 0,   max: 300, step: 1,   decimals: 0 },
  seed:       { default: 42,  min: 1,   max: 999, step: 1,   decimals: 0 },
};

let lineCount  = PARAM_CONFIG.lineCount.default;
let lineWidth  = PARAM_CONFIG.lineWidth.default;
let lengthMean = PARAM_CONFIG.lengthMean.default;
let lengthStd  = PARAM_CONFIG.lengthStd.default;
let seed       = PARAM_CONFIG.seed.default;

const CANVAS_WIDTH  = 576;
const CANVAS_HEIGHT = 864;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let isInitialized = false;
let controlsInitialized = false;

function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianSample(mean: number, std: number, rng: () => number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

type Line = { x: number; cy: number; length: number };

function generateLines(): Line[] {
  const rng = mulberry32(seed);
  const lines: Line[] = [];

  for (let i = 0; i < lineCount; i++) {
    const x   = rng() * CANVAS_WIDTH;
    const cy  = rng() * CANVAS_HEIGHT;
    const len = Math.max(1, gaussianSample(lengthMean, lengthStd, rng));
    lines.push({ x, cy, length: len });
  }

  return lines;
}

function initializeCanvas() {
  if (isInitialized) return;

  const container = document.getElementById('cloud-lines-tmp-container');
  if (!container) return;

  container.innerHTML = '';

  canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width    = CANVAS_WIDTH  + 'px';
  canvas.style.height   = CANVAS_HEIGHT + 'px';
  canvas.style.position = 'absolute';
  canvas.style.top      = '0';
  canvas.style.left     = '0';
  canvas.width  = CANVAS_WIDTH  * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;

  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  container.appendChild(canvas);
  draw();

  isInitialized = true;
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = 'black';
  ctx.lineWidth   = lineWidth;
  ctx.lineCap     = 'round';

  for (const line of generateLines()) {
    ctx.beginPath();
    ctx.moveTo(line.x, line.cy - line.length / 2);
    ctx.lineTo(line.x, line.cy + line.length / 2);
    ctx.stroke();
  }
}

function exportSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width',  CANVAS_WIDTH.toString());
  svg.setAttribute('height', CANVAS_HEIGHT.toString());
  svg.setAttribute('xmlns',  'http://www.w3.org/2000/svg');

  for (const line of generateLines()) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('x1',             line.x.toFixed(2));
    el.setAttribute('y1',             (line.cy - line.length / 2).toFixed(2));
    el.setAttribute('x2',             line.x.toFixed(2));
    el.setAttribute('y2',             (line.cy + line.length / 2).toFixed(2));
    el.setAttribute('stroke',         'black');
    el.setAttribute('stroke-width',   lineWidth.toFixed(2));
    el.setAttribute('stroke-linecap', 'round');
    svg.appendChild(el);
  }

  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'cloud_lines_tmp.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function setupControls() {
  if (controlsInitialized) return;

  const container = document.getElementById('controls-container');
  if (!container) return;

  container.innerHTML = '';

  const createSlider = (
    label: string,
    config: { min: number; max: number; step: number; decimals: number },
    getValue: () => number,
    setValue: (v: number) => void
  ) => {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '10px';

    const lbl = document.createElement('div');
    lbl.textContent        = label;
    lbl.style.marginBottom = '5px';
    lbl.style.fontWeight   = 'bold';
    lbl.style.fontSize     = '14px';

    const slider    = document.createElement('input');
    slider.type     = 'range';
    slider.min      = config.min.toString();
    slider.max      = config.max.toString();
    slider.step     = config.step.toString();
    slider.value    = getValue().toString();
    slider.style.width = '100%';

    const display = document.createElement('div');
    display.textContent     = getValue().toFixed(config.decimals);
    display.style.textAlign = 'right';
    display.style.fontSize  = '14px';

    slider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      setValue(v);
      display.textContent = v.toFixed(config.decimals);
      draw();
    });

    wrap.appendChild(lbl);
    wrap.appendChild(slider);
    wrap.appendChild(display);
    container.appendChild(wrap);
  };

  createSlider('Line Count',       PARAM_CONFIG.lineCount,  () => lineCount,  (v) => { lineCount  = Math.round(v); });
  createSlider('Line Width (px)',   PARAM_CONFIG.lineWidth,  () => lineWidth,  (v) => { lineWidth  = v; });
  createSlider('Length Mean (px)',  PARAM_CONFIG.lengthMean, () => lengthMean, (v) => { lengthMean = Math.round(v); });
  createSlider('Length Std Dev',    PARAM_CONFIG.lengthStd,  () => lengthStd,  (v) => { lengthStd  = Math.round(v); });
  createSlider('Seed',              PARAM_CONFIG.seed,       () => seed,       (v) => { seed       = Math.round(v); });

  const btn = document.createElement('button');
  btn.textContent           = 'Save SVG';
  btn.style.marginTop       = '20px';
  btn.style.width           = '100%';
  btn.style.backgroundColor = '#007bff';
  btn.style.color           = 'white';
  btn.style.fontWeight      = 'bold';
  btn.addEventListener('click', exportSVG);
  container.appendChild(btn);

  controlsInitialized = true;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isInitialized) { initializeCanvas(); setupControls(); }
});

if (document.readyState !== 'loading' && !isInitialized) {
  initializeCanvas();
  setupControls();
}
