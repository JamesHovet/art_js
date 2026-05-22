export {};

import { getLetterOffset, getLetterSVGPath } from "../../shared/letterSvgPaths";

const CANVAS_WIDTH  = 1056;
const CANVAS_HEIGHT = 1344;

const BORDER_MARGIN = 24;
const BORDER_BOTTOM = 72;

const BORDER_X = BORDER_MARGIN;
const BORDER_Y = BORDER_MARGIN;
const BORDER_W = CANVAS_WIDTH  - 2 * BORDER_MARGIN;   // 1008
const BORDER_H = CANVAS_HEIGHT - BORDER_MARGIN - BORDER_BOTTOM; // 1248

const GRID_COLS       = 6;
const GRID_ROWS       = 7;
const GRID_PAD_TOP    = 10;
const GRID_PAD_BOTTOM = 10;
const CELL_W          = BORDER_W / GRID_COLS;
const CELL_H          = (BORDER_H - GRID_PAD_TOP - GRID_PAD_BOTTOM) / GRID_ROWS;

// const GRID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&#$%?!';
const GRID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&#$¶§†';

const FONT_NAME   = 'Times New Roman';
// const FONT_NAME   = 'Helvetica';
// const FONT_NAME   = 'Arial';
// const FONT_NAME   = 'Georgia';
// const FONT_NAME   = 'Garamond';
// const FONT_NAME   = 'Futura';
const LEFT_LABEL  = 'TYPE SPECIMEN';
const RIGHT_LABEL = FONT_NAME.toUpperCase();

// Bottom labels — stroke font, scale is fine here
const TEXT_SCALE   = 24 / 103.1;
const TEXT_TY      = (CANVAS_HEIGHT - 24) + 7.6 * TEXT_SCALE;
const TEXT_TX_LEFT = BORDER_MARGIN;
const LETTER_SPACING = 90;

// Right-align by treating each character slot as LETTER_SPACING units wide
function rightAlignTx(text: string): number {
  let lastNonSpaceIdx = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] !== ' ') { lastNonSpaceIdx = i; break; }
  }
  const localWidth = (lastNonSpaceIdx + 1) * LETTER_SPACING;
  return (CANVAS_WIDTH - BORDER_MARGIN) - localWidth * TEXT_SCALE;
}

const PARAM_CONFIG = {
  walkMagnitude:       { default: 4,     min: 0.5, max: 20,    step: 0.5  },
  iterations:          { default: 1500,  min: 100, max: 5000,  step: 100  },
  angleStdDev:         { default: 0.785, min: 0.1, max: 3.14,  step: 0.05 },
  attemptsBeforeBack:  { default: 20,    min: 1,   max: 200,   step: 1    },
  maxBacktracks:       { default: 50,    min: 0,   max: 500,   step: 5    },
  strokeWidth:         { default: 0.5,   min: 0.1, max: 5,     step: 0.01 },
  fontWeight:          { default: 700,   min: 100, max: 900,   step: 100  },
  fontItalic:          { default: 0,     min: 0,   max: 1,     step: 1,   format: (v: number) => v ? 'on' : 'off' },
};

let walkMagnitude      = PARAM_CONFIG.walkMagnitude.default;
let iterations         = PARAM_CONFIG.iterations.default;
let angleStdDev        = PARAM_CONFIG.angleStdDev.default;
let attemptsBeforeBack = PARAM_CONFIG.attemptsBeforeBack.default;
let maxBacktracks      = PARAM_CONFIG.maxBacktracks.default;
let strokeWidth        = PARAM_CONFIG.strokeWidth.default;
let fontWeight         = PARAM_CONFIG.fontWeight.default;
let fontItalic         = PARAM_CONFIG.fontItalic.default;

const STORAGE_KEY = 'letter_walk_params';

function loadParams() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const d = JSON.parse(stored);
    if (typeof d.walkMagnitude      === 'number') walkMagnitude      = d.walkMagnitude;
    if (typeof d.iterations         === 'number') iterations         = d.iterations;
    if (typeof d.angleStdDev        === 'number') angleStdDev        = d.angleStdDev;
    if (typeof d.attemptsBeforeBack === 'number') attemptsBeforeBack = d.attemptsBeforeBack;
    if (typeof d.maxBacktracks      === 'number') maxBacktracks      = d.maxBacktracks;
    if (typeof d.strokeWidth        === 'number') strokeWidth        = d.strokeWidth;
    if (typeof d.fontWeight         === 'number') fontWeight         = d.fontWeight;
    if (typeof d.fontItalic         === 'number') fontItalic         = d.fontItalic;
  } catch {}
}

function saveParams() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    walkMagnitude, iterations, angleStdDev, attemptsBeforeBack, maxBacktracks, strokeWidth, fontWeight, fontItalic,
  }));
}

loadParams();

interface LetterOverride {
  iterations:         number;
  attemptsBeforeBack: number;
  maxBacktracks:      number;
}
type OverrideKey = keyof LetterOverride;

const DEFAULT_OVERRIDE: LetterOverride = { iterations: 100, attemptsBeforeBack: 100, maxBacktracks: 100 };
const OVERRIDES_KEY = 'letter_walk_overrides';
let letterOverrides: Record<string, LetterOverride> = {};

function loadLetterOverrides() {
  try {
    const stored = localStorage.getItem(OVERRIDES_KEY);
    if (!stored) return;
    const d = JSON.parse(stored);
    if (typeof d === 'object' && d !== null) letterOverrides = d;
  } catch {}
}

function saveLetterOverrides() {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(letterOverrides));
}

loadLetterOverrides();

const SEEDS_KEY = 'letter_walk_seeds';
let letterSeeds: Record<string, number> = {};

function loadLetterSeeds() {
  try {
    const stored = localStorage.getItem(SEEDS_KEY);
    if (!stored) return;
    const d = JSON.parse(stored);
    if (typeof d === 'object' && d !== null) letterSeeds = d;
  } catch {}
}

function saveLetterSeeds() {
  localStorage.setItem(SEEDS_KEY, JSON.stringify(letterSeeds));
}

function generateSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

function ensureSeeds() {
  let changed = false;
  for (const ch of GRID_CHARS) {
    if (typeof letterSeeds[ch] !== 'number') { letterSeeds[ch] = generateSeed(); changed = true; }
  }
  if (changed) saveLetterSeeds();
}

function generateAllSeeds() {
  for (const ch of GRID_CHARS) letterSeeds[ch] = generateSeed();
  saveLetterSeeds();
}

loadLetterSeeds();

let canvas:     HTMLCanvasElement;
let ctx:        CanvasRenderingContext2D;
let svgElement: SVGElement;

type WalkPath = Array<{ x: number; y: number }>;
let allWalkPaths:  WalkPath[]   = [];
let allImageDatas: ImageData[]  = [];
let allRatios:     number[]     = [];
let allCompleted:  boolean[]    = [];
const letterCells: HTMLDivElement[] = [];

let isInitialized       = false;
let controlsInitialized = false;
let gridInitialized     = false;

function makeFontStr(size: number): string {
  return `${fontItalic ? 'italic ' : ''}${fontWeight} ${size}px ${FONT_NAME}`;
}

function measureFontSize(ch: string, targetW: number, targetH: number, padding: number): number {
  const testSize = 500;
  const tmp = document.createElement('canvas');
  tmp.width = testSize * 3; tmp.height = testSize * 3;
  const tmpCtx = tmp.getContext('2d')!;
  tmpCtx.font = makeFontStr(testSize);
  const m = tmpCtx.measureText(ch);
  const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  if (w <= 0 || h <= 0) return Math.round(targetH * 0.85);
  return Math.round(Math.min(targetW * padding / w, targetH * padding / h) * testSize);
}

let cellFontSize = 0;

function renderCellToImageData(ch: string, w: number, h: number): ImageData {
  const cw = Math.round(w);
  const ch_ = Math.round(h);
  const offscreen = document.createElement('canvas');
  offscreen.width  = cw;
  offscreen.height = ch_;
  const offCtx = offscreen.getContext('2d')!;
  offCtx.fillStyle = 'white';
  offCtx.fillRect(0, 0, cw, ch_);
  offCtx.fillStyle    = 'black';
  offCtx.font         = makeFontStr(cellFontSize);
  offCtx.textAlign    = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(ch, cw / 2, ch_ / 2);
  return offCtx.getImageData(0, 0, cw, ch_);
}

function countInsidePixels(imageData: ImageData): number {
  let count = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i] < 128) count++;
  }
  return count;
}

function mulberry32(seed: number): () => number {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function gauss(stdDev: number, rand: () => number): number {
  const u1 = rand();
  const u2 = rand();
  return stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function randomWalkInCell(
  imageData: ImageData,
  offsetX: number, offsetY: number,
  iterCount: number, triesToBack: number, maxBT: number,
  rand: () => number,
): { path: WalkPath; completed: boolean } {
  const w = imageData.width;
  const h = imageData.height;
  const points: WalkPath = [];
  const MAX_START = 1000;
  const MAX_STEP  = 1000;

  function isInside(x: number, y: number): boolean {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= w || iy < 0 || iy >= h) return false;
    return imageData.data[(iy * w + ix) * 4] < 128;
  }

  let x = w / 2;
  let y = h / 2;
  if (!isInside(x, y)) {
    let found = false;
    for (let i = 0; i < MAX_START; i++) {
      x = rand() * w;
      y = rand() * h;
      if (isInside(x, y)) { found = true; break; }
    }
    if (!found) return { path: points, completed: false };
  }

  points.push({ x: x + offsetX, y: y + offsetY });
  const directions: number[] = [rand() * 2 * Math.PI];

  let backtracks = 0;
  let i = 0;
  while (i < iterCount) {
    const currentDir = directions[directions.length - 1];
    let moved = false;
    for (let attempt = 0; attempt < triesToBack; attempt++) {
      const dir = currentDir + gauss(angleStdDev, rand);
      const nx  = x + walkMagnitude * Math.cos(dir);
      const ny  = y + walkMagnitude * Math.sin(dir);
      if (isInside(nx, ny)) {
        x = nx; y = ny;
        directions.push(dir);
        points.push({ x: x + offsetX, y: y + offsetY });
        moved = true;
        i++;
        break;
      }
    }
    if (!moved) {
      if (backtracks >= maxBT || points.length <= 1) break;
      backtracks++;
      points.pop();
      directions.pop();
      const prev = points[points.length - 1];
      x = prev.x - offsetX;
      y = prev.y - offsetY;
    }
  }

  return { path: points, completed: i >= iterCount };
}

function addBorderAndText(target: Element) {
  const borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  borderRect.setAttribute("x",            BORDER_X.toString());
  borderRect.setAttribute("y",            BORDER_Y.toString());
  borderRect.setAttribute("width",        BORDER_W.toString());
  borderRect.setAttribute("height",       BORDER_H.toString());
  borderRect.setAttribute("fill",         "none");
  borderRect.setAttribute("stroke",       "black");
  borderRect.setAttribute("stroke-width", "1");
  target.appendChild(borderRect);

  addStrokeText(target, LEFT_LABEL,  TEXT_TX_LEFT,               TEXT_TY, TEXT_SCALE);
  addStrokeText(target, RIGHT_LABEL, rightAlignTx(RIGHT_LABEL),  TEXT_TY, TEXT_SCALE);
}

function addStrokeText(target: Element, text: string, tx: number, ty: number, scale: number) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("transform", `translate(${tx.toFixed(2)}, ${ty.toFixed(2)}), scale(${scale.toFixed(4)})`);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ') continue;
    const offset   = getLetterOffset(ch);
    const xPos     = i * LETTER_SPACING - offset.x;
    const svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgGroup.setAttribute("transform",    `translate(${xPos}, -${offset.y})`);
    svgGroup.setAttribute("fill",         "none");
    svgGroup.setAttribute("stroke",       "black");
    svgGroup.setAttribute("stroke-width", "3");
    svgGroup.innerHTML = getLetterSVGPath(ch);
    group.appendChild(svgGroup);
  }

  target.appendChild(group);
}

function redrawCanvas() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle   = 'rgb(245, 245, 245)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = 'black';
  ctx.lineWidth   = strokeWidth;
  for (const walkPath of allWalkPaths) {
    if (walkPath.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(walkPath[0].x, walkPath[0].y);
      for (let j = 1; j < walkPath.length; j++) ctx.lineTo(walkPath[j].x, walkPath[j].y);
      ctx.stroke();
    }
  }
}

function updateCellBorders() {
  for (let i = 0; i < letterCells.length; i++) {
    letterCells[i].style.borderColor = allCompleted[i] === false ? '#cc0000' : '#ddd';
  }
}

function walkParamsForCell(i: number): { iterCount: number; triesToBack: number; maxBT: number } {
  const ov = letterOverrides[GRID_CHARS[i]] ?? DEFAULT_OVERRIDE;
  return {
    iterCount:   Math.max(1, Math.round(iterations         * allRatios[i] * ov.iterations         / 100)),
    triesToBack: Math.max(1, Math.round(attemptsBeforeBack *               ov.attemptsBeforeBack  / 100)),
    maxBT:       Math.max(0, Math.round(maxBacktracks      *               ov.maxBacktracks       / 100)),
  };
}

function recalculateLetter(idx: number) {
  if (!allImageDatas[idx]) return;
  const ch    = GRID_CHARS[idx];
  letterSeeds[ch] = generateSeed();
  saveLetterSeeds();
  const cellX = BORDER_X + (idx % GRID_COLS) * CELL_W;
  const cellY = BORDER_Y + GRID_PAD_TOP + Math.floor(idx / GRID_COLS) * CELL_H;
  const { iterCount, triesToBack, maxBT } = walkParamsForCell(idx);
  const result = randomWalkInCell(allImageDatas[idx], cellX, cellY, iterCount, triesToBack, maxBT, mulberry32(letterSeeds[ch]));
  allWalkPaths[idx] = result.path;
  allCompleted[idx] = result.completed;
  redrawCanvas();
  updateCellBorders();
}

function draw(generateNewSeeds = false) {
  if (generateNewSeeds) generateAllSeeds(); else ensureSeeds();

  cellFontSize = (() => {
    let minSize = Infinity;
    for (const ch of GRID_CHARS) minSize = Math.min(minSize, measureFontSize(ch, CELL_W, CELL_H, 1));
    return minSize;
  })();

  allImageDatas = [];
  allRatios     = [];
  allWalkPaths  = [];
  allCompleted  = [];

  for (let i = 0; i < GRID_CHARS.length; i++) {
    const imageData = renderCellToImageData(GRID_CHARS[i], CELL_W, CELL_H);
    allImageDatas.push(imageData);
    allRatios.push(countInsidePixels(imageData));
  }

  const baseline = allRatios[GRID_CHARS.indexOf('A')] || 1;
  allRatios      = allRatios.map(c => c / baseline);

  console.log('Pixel area ratios relative to A:');
  GRID_CHARS.split('').forEach((ch, i) => console.log(`  ${ch}: ${allRatios[i].toFixed(3)}`));

  for (let i = 0; i < GRID_CHARS.length; i++) {
    const cellX = BORDER_X + (i % GRID_COLS) * CELL_W;
    const cellY = BORDER_Y + GRID_PAD_TOP + Math.floor(i / GRID_COLS) * CELL_H;
    const { iterCount, triesToBack, maxBT } = walkParamsForCell(i);
    const result = randomWalkInCell(allImageDatas[i], cellX, cellY, iterCount, triesToBack, maxBT, mulberry32(letterSeeds[GRID_CHARS[i]]));
    allWalkPaths.push(result.path);
    allCompleted.push(result.completed);
  }

  redrawCanvas();
  updateCellBorders();
  svgElement.innerHTML = '';
  addBorderAndText(svgElement);
}

function exportSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width',  CANVAS_WIDTH.toString());
  svg.setAttribute('height', CANVAS_HEIGHT.toString());
  svg.setAttribute('xmlns',  'http://www.w3.org/2000/svg');

  const params = {
    walkMagnitude, iterations, angleStdDev, attemptsBeforeBack, maxBacktracks, strokeWidth,
    seeds:     letterSeeds,
    overrides: letterOverrides,
  };
  svg.appendChild(document.createComment('\n' + JSON.stringify(params, null, 2) + '\n'));

  const lettersLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  lettersLayer.setAttribute('id', 'layer-letters');
  for (const walkPath of allWalkPaths) {
    if (walkPath.length < 2) continue;
    let d = `M ${walkPath[0].x.toFixed(2)} ${walkPath[0].y.toFixed(2)}`;
    for (let i = 1; i < walkPath.length; i++) {
      d += ` L ${walkPath[i].x.toFixed(2)} ${walkPath[i].y.toFixed(2)}`;
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d',            d);
    path.setAttribute('fill',         'none');
    path.setAttribute('stroke',       'black');
    path.setAttribute('stroke-width', strokeWidth.toString());
    lettersLayer.appendChild(path);
  }
  svg.appendChild(lettersLayer);

  const borderLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  borderLayer.setAttribute('id', 'layer-border');
  addBorderAndText(borderLayer);
  svg.appendChild(borderLayer);

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob    = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = 'letter_walk.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function initializeCanvas() {
  if (isInitialized) return;

  const container = document.getElementById('letter-walk-container');
  if (!container) { console.error('letter-walk-container not found'); return; }

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

  svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as unknown as SVGElement;
  svgElement.setAttribute('width',  CANVAS_WIDTH.toString());
  svgElement.setAttribute('height', CANVAS_HEIGHT.toString());
  svgElement.style.position      = 'absolute';
  svgElement.style.top           = '0';
  svgElement.style.left          = '0';
  svgElement.style.pointerEvents = 'none';

  container.appendChild(canvas);
  container.appendChild(svgElement);

  draw();

  isInitialized = true;
}

function setupControls() {
  if (controlsInitialized) return;

  const controlsContainer = document.getElementById('controls-container');
  if (!controlsContainer) return;

  controlsContainer.innerHTML = '';

  const createSlider = (
    name: string,
    config: { min: number; max: number; step: number; format?: (v: number) => string },
    getValue: () => number,
    setValue: (v: number) => void
  ) => {
    const fmt = config.format ?? ((v: number) => config.step < 1 ? v.toFixed(2) : v.toFixed(0));
    const row = document.createElement('div');
    row.style.display       = 'flex';
    row.style.alignItems    = 'center';
    row.style.gap           = '8px';
    row.style.marginBottom  = '4px';

    const label = document.createElement('label');
    label.textContent    = name;
    label.style.fontSize = '13px';
    label.style.minWidth = '120px';

    const slider  = document.createElement('input');
    slider.type   = 'range';
    slider.min    = config.min.toString();
    slider.max    = config.max.toString();
    slider.step   = config.step.toString();
    slider.value  = getValue().toString();
    slider.style.flex = '1';

    const valueDisplay             = document.createElement('span');
    valueDisplay.textContent       = fmt(getValue());
    valueDisplay.style.fontSize    = '13px';
    valueDisplay.style.minWidth    = '36px';
    valueDisplay.style.textAlign   = 'right';
    valueDisplay.style.fontVariantNumeric = 'tabular-nums';

    slider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      setValue(v);
      valueDisplay.textContent = fmt(v);
      saveParams();
    });

    row.appendChild(label);
    row.appendChild(slider);
    row.appendChild(valueDisplay);
    controlsContainer.appendChild(row);
  };

  const buttonRow          = document.createElement('div');
  buttonRow.style.display  = 'flex';
  buttonRow.style.gap      = '10px';
  buttonRow.style.marginBottom = '15px';

  const recalcBtn          = document.createElement('button');
  recalcBtn.textContent    = 'Recalculate';
  recalcBtn.style.flex     = '1';
  recalcBtn.addEventListener('click', () => draw(true));
  buttonRow.appendChild(recalcBtn);

  const saveBtn       = document.createElement('button');
  saveBtn.id          = 'saveSVG';
  saveBtn.textContent = 'Save SVG';
  saveBtn.style.flex  = '1';
  saveBtn.addEventListener('click', exportSVG);
  buttonRow.appendChild(saveBtn);

  const clearBtn          = document.createElement('button');
  clearBtn.textContent    = 'Clear Storage';
  clearBtn.style.flex     = '1';
  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OVERRIDES_KEY);
    localStorage.removeItem(SEEDS_KEY);
    location.reload();
  });
  buttonRow.appendChild(clearBtn);

  controlsContainer.appendChild(buttonRow);

  createSlider('Walk Magnitude',    PARAM_CONFIG.walkMagnitude,      () => walkMagnitude,      (v) => { walkMagnitude      = v; });
  createSlider('Iterations',        PARAM_CONFIG.iterations,         () => iterations,         (v) => { iterations         = Math.floor(v); });
  createSlider('Angle Std Dev',     PARAM_CONFIG.angleStdDev,        () => angleStdDev,        (v) => { angleStdDev        = v; });
  createSlider('Tries Before Back', PARAM_CONFIG.attemptsBeforeBack, () => attemptsBeforeBack, (v) => { attemptsBeforeBack = Math.floor(v); });
  createSlider('Max Backtracks',    PARAM_CONFIG.maxBacktracks,      () => maxBacktracks,      (v) => { maxBacktracks      = Math.floor(v); });
  createSlider('Stroke Width',      PARAM_CONFIG.strokeWidth,        () => strokeWidth,        (v) => { strokeWidth        = v; });
  createSlider('Font Weight',       PARAM_CONFIG.fontWeight,         () => fontWeight,         (v) => { fontWeight         = Math.floor(v); });
  createSlider('Italic',            PARAM_CONFIG.fontItalic,         () => fontItalic,         (v) => { fontItalic         = Math.floor(v); });

  controlsInitialized = true;
}

const OVERRIDE_SLIDERS: Array<{ key: OverrideKey; label: string }> = [
  { key: 'iterations',         label: 'Iter'  },
  { key: 'attemptsBeforeBack', label: 'Tries' },
  { key: 'maxBacktracks',      label: 'BT'    },
];

function setupLetterGrid() {
  if (gridInitialized) return;
  const controlsContainer = document.getElementById('controls-container');
  if (!controlsContainer) return;

  const grid = document.createElement('div');
  grid.style.display             = 'grid';
  grid.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
  grid.style.gap                 = '4px';
  grid.style.marginTop           = '16px';
  grid.style.fontFamily          = 'Arial, sans-serif';

  for (let idx = 0; idx < GRID_CHARS.length; idx++) {
    const ch   = GRID_CHARS[idx];
    const cell = document.createElement('div');
    cell.style.border       = '1px solid #ddd';
    cell.style.borderRadius = '3px';
    cell.style.padding      = '4px 5px';
    cell.style.minWidth     = '0';
    cell.style.boxSizing    = 'border-box';

    const header = document.createElement('div');
    header.style.display      = 'flex';
    header.style.alignItems   = 'center';
    header.style.gap          = '4px';
    header.style.marginBottom = '3px';

    const charLabel = document.createElement('span');
    charLabel.textContent       = ch;
    charLabel.style.fontWeight  = 'bold';
    charLabel.style.fontSize    = '14px';
    charLabel.style.fontFamily  = FONT_NAME;
    charLabel.style.lineHeight  = '1';

    const recalcBtn = document.createElement('button');
    recalcBtn.textContent        = '↺';
    recalcBtn.style.flex         = '1';
    recalcBtn.style.fontSize     = '11px';
    recalcBtn.style.padding      = '1px 0';
    recalcBtn.style.cursor       = 'pointer';
    recalcBtn.style.border       = '1px solid #ccc';
    recalcBtn.style.borderRadius = '3px';
    recalcBtn.style.background   = 'white';
    recalcBtn.addEventListener('click', () => recalculateLetter(idx));

    header.appendChild(charLabel);
    header.appendChild(recalcBtn);
    cell.appendChild(header);

    for (const { key, label } of OVERRIDE_SLIDERS) {
      const val = (letterOverrides[ch] ?? DEFAULT_OVERRIDE)[key];

      const row = document.createElement('div');
      row.style.display      = 'flex';
      row.style.alignItems   = 'center';
      row.style.gap          = '2px';
      row.style.marginBottom = '1px';

      const lbl = document.createElement('span');
      lbl.textContent    = label;
      lbl.style.fontSize = '10px';
      lbl.style.minWidth = '28px';
      lbl.style.color    = '#666';

      const slider       = document.createElement('input');
      slider.type        = 'range';
      slider.min         = '0';
      slider.max         = '200';
      slider.step        = '1';
      slider.value       = val.toString();
      slider.style.flex     = '1';
      slider.style.minWidth = '0';
      slider.style.margin   = '0';

      const valSpan = document.createElement('span');
      valSpan.textContent              = val.toString();
      valSpan.style.fontSize           = '10px';
      valSpan.style.minWidth           = '24px';
      valSpan.style.textAlign          = 'right';
      valSpan.style.fontVariantNumeric = 'tabular-nums';

      slider.addEventListener('input', (e) => {
        const v = parseInt((e.target as HTMLInputElement).value, 10);
        if (!letterOverrides[ch]) letterOverrides[ch] = { ...DEFAULT_OVERRIDE };
        letterOverrides[ch][key] = v;
        valSpan.textContent = v.toString();
        saveLetterOverrides();
      });

      row.appendChild(lbl);
      row.appendChild(slider);
      row.appendChild(valSpan);
      cell.appendChild(row);
    }

    letterCells.push(cell);
    grid.appendChild(cell);
  }

  controlsContainer.appendChild(grid);
  gridInitialized = true;
  updateCellBorders();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isInitialized) {
    initializeCanvas();
    setupControls();
    setupLetterGrid();
  }
});

if (document.readyState !== 'loading' && !isInitialized) {
  initializeCanvas();
  setupControls();
  setupLetterGrid();
}
