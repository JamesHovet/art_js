# Studio Plotter System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-collect / desktop-render plotter studio for Spiral, Letters, and Tree generative art projects, sharing data via Google Sheets.

**Architecture:** Common infrastructure lives in `studio/shared/` and `studio/landing/`. Each art project lives in `studio/<project>/` with three files: `drawing.ts` (shared art logic), `collect.ts` (mobile), `render.ts` (desktop). Both collect and render import the same drawing module for guaranteed identical output.

**Tech Stack:** TypeScript, Canvas 2D API, webpack 5, Google Apps Script (Google Sheets backend). No p5.js in the new code.

**Spec:** `docs/superpowers/specs/2026-05-21-studio-plotter-design.md`

---

## Phase 1: Common Infrastructure (implement in main session before subagents)

### Task 1: seededRandom.ts

**Files:**
- Create: `studio/shared/seededRandom.ts`

- [ ] Create the file:

```typescript
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussianRandom(rng: () => number, mean = 0, std = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min)) + min;
}
```

- [ ] Commit: `git add studio/shared/seededRandom.ts && git commit -m "studio: add seeded PRNG utilities"`

---

### Task 2: sheets.ts

**Files:**
- Create: `studio/shared/sheets.ts`

- [ ] Create the file (URL taken from `projects/tree_timeline/tree_timeline.ts` line 46):

```typescript
export type SheetTab = 'Spiral' | 'Letters' | 'Tree';

export interface SheetEntry {
  rowIndex: number;
  name: string;
  timestamp: string;
  data: string;
}

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbyXhxlnewbftEuGhSUp5XtnIphvEkzLU5I-0UGfWJqJZWk1GPJfA3I40CFeQaeVt2MO/exec';

export async function saveEntry(
  tab: SheetTab,
  name: string,
  data: unknown
): Promise<void> {
  await fetch(SHEETS_API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheet: tab,
      name,
      timestamp: new Date().toISOString(),
      data: JSON.stringify(data),
    }),
  });
}

export async function loadEntries(tab: SheetTab): Promise<SheetEntry[]> {
  try {
    const response = await fetch(`${SHEETS_API_URL}?sheet=${encodeURIComponent(tab)}`);
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) return result.data;
    return [];
  } catch {
    return [];
  }
}
```

- [ ] Commit: `git add studio/shared/sheets.ts && git commit -m "studio: add Google Sheets shared API"`

---

### Task 3: Update Apps Script

**Files:**
- Modify: `projects/tree_timeline/appscript_old_backup.js` (replace entirely)

- [ ] Replace the file content:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetName = data.sheet || 'Sheet1';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Name', 'Timestamp', 'Data']);
    }
    sheet.appendRow([data.name, data.timestamp, data.data]);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Saved' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheetName = (e.parameter && e.parameter.sheet) || 'Sheet1';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3);
    const values = range.getValues();
    const entries = values.map((row, index) => ({
      rowIndex: index + 2,
      name: row[0],
      timestamp: row[1],
      data: row[2],
    }));
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: entries }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Note: After updating the script in the Google Apps Script editor, redeploy as a new version.

- [ ] Commit: `git add projects/tree_timeline/appscript_old_backup.js && git commit -m "studio: update apps script to support multi-tab routing"`

---

### Task 4: Landing page

**Files:**
- Create: `studio/landing/landing.ts`
- Create: `studio/landing/landing.html`

- [ ] Create `studio/landing/landing.ts`:

```typescript
export {};
```

- [ ] Create `studio/landing/landing.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Studio</title>
  <style>
    body { font-family: monospace; max-width: 480px; margin: 48px auto; padding: 0 24px; }
    h1 { font-size: 18px; font-weight: bold; margin-bottom: 40px; }
    h2 { font-size: 13px; font-weight: bold; margin: 28px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    a { display: block; margin: 6px 0; color: #000; text-decoration: none; font-size: 14px; }
    a:hover { text-decoration: underline; }
    .label { font-size: 11px; color: #999; margin-left: 6px; }
  </style>
</head>
<body>
  <h1>Studio</h1>

  <h2>Spiral</h2>
  <a href="/studio_spiral_collect/">Collect <span class="label">mobile</span></a>
  <a href="/studio_spiral_render/">Render <span class="label">desktop</span></a>

  <h2>Letters</h2>
  <a href="/studio_letters_collect/">Collect <span class="label">mobile</span></a>
  <a href="/studio_letters_render/">Render <span class="label">desktop</span></a>

  <h2>Tree</h2>
  <a href="/studio_tree_collect/">Collect <span class="label">mobile</span></a>
  <a href="/studio_tree_render/">Render <span class="label">desktop</span></a>
</body>
</html>
```

- [ ] Commit: `git add studio/landing/ && git commit -m "studio: add landing page"`

---

### Task 5: Webpack + .gitignore

**Files:**
- Modify: `webpack.common.js`
- Modify: `.gitignore`

- [ ] Add to `webpack.common.js` entry object (after existing entries):

```js
studio_landing:         './studio/landing/landing.ts',
studio_spiral_collect:  './studio/spiral/collect.ts',
studio_spiral_render:   './studio/spiral/render.ts',
studio_letters_collect: './studio/letters/collect.ts',
studio_letters_render:  './studio/letters/render.ts',
studio_tree_collect:    './studio/tree/collect.ts',
studio_tree_render:     './studio/tree/render.ts',
```

- [ ] Add to `webpack.common.js` plugins array (after existing HtmlWebpackPlugin entries):

```js
new HtmlWebpackPlugin({
  template: './studio/landing/landing.html',
  filename: 'studio_landing/index.html',
  chunks: ['studio_landing'],
}),
new HtmlWebpackPlugin({
  template: './studio/spiral/collect.html',
  filename: 'studio_spiral_collect/index.html',
  chunks: ['studio_spiral_collect'],
}),
new HtmlWebpackPlugin({
  template: './studio/spiral/render.html',
  filename: 'studio_spiral_render/index.html',
  chunks: ['studio_spiral_render'],
}),
new HtmlWebpackPlugin({
  template: './studio/letters/collect.html',
  filename: 'studio_letters_collect/index.html',
  chunks: ['studio_letters_collect'],
}),
new HtmlWebpackPlugin({
  template: './studio/letters/render.html',
  filename: 'studio_letters_render/index.html',
  chunks: ['studio_letters_render'],
}),
new HtmlWebpackPlugin({
  template: './studio/tree/collect.html',
  filename: 'studio_tree_collect/index.html',
  chunks: ['studio_tree_collect'],
}),
new HtmlWebpackPlugin({
  template: './studio/tree/render.html',
  filename: 'studio_tree_render/index.html',
  chunks: ['studio_tree_render'],
}),
```

- [ ] Add to `.gitignore`:

```
.superpowers/
```

- [ ] Commit: `git add webpack.common.js .gitignore && git commit -m "studio: register all studio webpack entries"`

---

## Phase 2: Per-Project Implementation (parallel subagents with worktrees)

### Task 6: Spiral (subagent)

**Files:**
- Create: `studio/spiral/drawing.ts`
- Create: `studio/spiral/collect.ts`
- Create: `studio/spiral/collect.html`
- Create: `studio/spiral/render.ts`
- Create: `studio/spiral/render.html`

**drawing.ts** — port from `projects/spiral/spiral.ts`:
- Export `PARAM_CONFIG` with param1–param6 (same ranges as existing)
- Export `SpiralParams` interface
- Export `draw(ctx: CanvasRenderingContext2D, params: SpiralParams): void` — contains `transformPoint` logic and canvas draw loop
- Export `buildSVGPath(params: SpiralParams): string` — same math, outputs `M x y L x y` string
- `CANVAS_WIDTH = CANVAS_HEIGHT = 576`
- No randomness

`transformPoint(t, params)` inner logic (from `projects/spiral/spiral.ts:122-149`):
```typescript
function transformPoint(t: number, params: SpiralParams): { x: number; y: number } {
  const { param1, param2, param3, param4, param5, param6 } = params;
  const r = t * 0.015;
  const x = r * Math.cos(t);
  const y = r * Math.sin(t);
  const z = Math.cos(param1 * r * Math.cos(t + Math.PI * param2)) * param3
           + Math.sin(param4 * r * Math.sin(t + Math.PI * param5)) * param6;
  // apply rotationZ(-π/2), rotationX(π/4), scale(60,60,1), translate(288, 263.5, 0)
  const cx = -x, cy = y; // rotZ
  const cx2 = cx, cy2 = cy * Math.cos(Math.PI / 4) - z * Math.sin(Math.PI / 4); // rotX
  return { x: cx2 * 60 + 288, y: cy2 * 60 + 263.5 };
}
```

Wait — the existing code uses three.js Matrix4 for the transforms. Subagent must replicate the exact transform chain from `projects/spiral/spiral.ts:131-148`. Import `{ Matrix4, Vector3 } from 'threejs-math'` and reuse as-is, or inline the math. Reuse the import to be safe.

**collect.html** — mobile-friendly, 100% viewport width. HtmlWebpackPlugin injects the script tag automatically — do NOT add one manually:
```html
<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spiral — Collect</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: monospace; margin: 0; padding: 16px; background: #fff; }
    canvas { display: block; width: 100%; max-width: 576px; height: auto; border: 1px solid #eee; margin: 0 auto 16px; }
    .controls { max-width: 576px; margin: 0 auto; }
    label { display: block; font-size: 12px; margin-bottom: 2px; }
    input[type=range] { width: 100%; margin-bottom: 12px; }
    input[type=text] { width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ccc; margin-bottom: 12px; }
    button { width: 100%; padding: 14px; font-size: 16px; font-family: monospace; background: #000; color: #fff; border: none; cursor: pointer; margin-bottom: 8px; }
    button.secondary { background: #fff; color: #000; border: 1px solid #000; }
    .status { font-size: 13px; text-align: center; padding: 8px; }
  </style>
</head><body>
  <div id="canvas-container"></div>
  <div class="controls">
    <div id="controls-inner"></div>
    <input type="text" id="name-input" placeholder="Your name" autocomplete="off">
    <button id="submit-btn">Save</button>
    <div class="status" id="status"></div>
  </div>
</body></html>
```

**collect.ts**:
- `initCanvas()` — creates 576×576 canvas in `#canvas-container`, DPR-scaled
- On load: build sliders from `PARAM_CONFIG`, each calls `draw(ctx, currentParams)` on input
- "Randomize" button: picks random values for each param within min/max, redraws
- "Save" button: reads name input, calls `saveEntry('Spiral', name, currentParams)`, shows success message
- Name validation: must be non-empty before submit

**render.html** — desktop, same layout as existing projects (canvas left, controls right):
```html
<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spiral — Render</title>
  <style>
    body { font-family: monospace; display: flex; gap: 24px; padding: 24px; margin: 0; }
    #canvas-container { position: relative; width: 576px; height: 576px; flex-shrink: 0; }
    #controls-container { width: 360px; overflow-y: auto; max-height: 100vh; }
    input[type=range] { width: 100%; }
    button { width: 100%; padding: 8px; margin-bottom: 8px; font-family: monospace; cursor: pointer; }
    .entry-list { border: 1px solid #ddd; max-height: 300px; overflow-y: auto; margin-bottom: 16px; }
    .entry { padding: 8px 10px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 12px; }
    .entry:hover { background: #f5f5f5; }
    .entry .name { font-weight: bold; }
    .entry .ts { color: #888; font-size: 11px; }
  </style>
</head><body>
  <div id="canvas-container"></div>
  <div id="controls-container"></div>
</body></html>
```

**render.ts**:
- `initCanvas()` — same DPR setup
- On load: build all sliders from `PARAM_CONFIG`; "Load entries" button calls `loadEntries('Spiral')`, renders list where each entry shows `name` + raw ISO `timestamp`; clicking populates sliders and redraws
- "Export SVG" button: calls `buildSVGPath(params)`, assembles full SVG (border rect + path + name label bottom-left + year bottom-right using `getLetterSVGPath`/`getLetterOffset`), downloads as `spiral-<name>.svg`

**SVG text label helper** — lives in `studio/shared/svgLabels.ts`, imported by all render pages:
```typescript
// studio/shared/svgLabels.ts
import { getLetterOffset, getLetterSVGPath } from '../../shared/letterSvgPaths';

export function buildTextGroup(
  svg: SVGElement,
  text: string,
  x: number,
  y: number,
  scale = 0.2
): void {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${x}, ${y}) scale(${scale})`);
  const spacing = 90;
  [...text.toUpperCase()].forEach((ch, i) => {
    if (ch === ' ') return;
    const path = getLetterSVGPath(ch);
    if (!path) return;
    const offset = getLetterOffset(ch);
    const sg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sg.setAttribute('transform', `translate(${i * spacing - offset.x}, ${-offset.y})`);
    sg.setAttribute('fill', 'none');
    sg.setAttribute('stroke', 'black');
    sg.setAttribute('stroke-width', '3');
    sg.innerHTML = path;
    g.appendChild(sg);
  });
  svg.appendChild(g);
}
```
Add `studio/shared/svgLabels.ts` to Task 1 as a 6th file to create alongside seededRandom.ts.

---

### Task 7: Letters (subagent)

**Files:**
- Create: `studio/letters/drawing.ts`
- Create: `studio/letters/collect.ts`
- Create: `studio/letters/collect.html`
- Create: `studio/letters/render.ts`
- Create: `studio/letters/render.html`

**drawing.ts** — rewrite of `projects/letters/letters.ts` without p5:

```typescript
import { makeRng, gaussianRandom } from '../shared/seededRandom';

export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 576;

export interface LettersParams {
  letter: string;       // single uppercase char A-Z
  numLines: number;
  lineLength: number;
  gaussianStdDev: number;
  seed: number;
}

export const PARAM_CONFIG = {
  numLines:        { default: 3000, min: 1500, max: 7000, step: 100 },
  lineLength:      { default: 5,    min: 1,    max: 15,   step: 0.05 },
  gaussianStdDev:  { default: 0.3,  min: 0.1,  max: 1.0,  step: 0.01 },
  seed:            { default: 42,   min: 0,    max: 999999, step: 1 },
};

function makeVirtualCanvas(letter: string): HTMLCanvasElement {
  const vc = document.createElement('canvas');
  vc.width = CANVAS_WIDTH;
  vc.height = CANVAS_HEIGHT;
  const vctx = vc.getContext('2d')!;
  vctx.fillStyle = '#f5f5f5';
  vctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  vctx.fillStyle = 'black';
  vctx.font = '550px "Times New Roman", serif';
  vctx.textAlign = 'center';
  vctx.textBaseline = 'middle';
  vctx.fillText(letter, CANVAS_WIDTH / 2, 50 + (CANVAS_HEIGHT - 75) / 2);
  return vc;
}

function isInLetter(vc: HTMLCanvasElement, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT) return false;
  const vctx = vc.getContext('2d')!;
  const d = vctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
  return (d[0] + d[1] + d[2]) / 3 < 128;
}

function runWalk(params: LettersParams): Array<[number, number]> {
  const { letter, numLines, lineLength, gaussianStdDev, seed } = params;
  const rng = makeRng(seed);
  const vc = makeVirtualCanvas(letter);

  // find start point
  let sx = 0, sy = 0;
  for (let i = 0; i < 10000; i++) {
    const tx = rng() * CANVAS_WIDTH;
    const ty = rng() * CANVAS_HEIGHT;
    if (isInLetter(vc, tx, ty)) { sx = tx; sy = ty; break; }
  }

  let dir = rng() * Math.PI * 2;
  const points: Array<[number, number]> = [[sx, sy]];
  let cx = sx, cy = sy;

  for (let i = 0; i < numLines; i++) {
    let found = false;
    for (let attempt = 0; attempt < 1000; attempt++) {
      dir += gaussianRandom(rng, 0, gaussianStdDev);
      const nx = cx + Math.cos(dir) * lineLength;
      const ny = cy + Math.sin(dir) * lineLength;
      if (isInLetter(vc, nx, ny)) {
        points.push([nx, ny]);
        cx = nx; cy = ny;
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return points;
}

export function draw(ctx: CanvasRenderingContext2D, params: LettersParams): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // border
  ctx.beginPath();
  ctx.rect(25, 25, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 75);
  ctx.stroke();

  const points = runWalk(params);
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.lineWidth = 0.5;
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

export function buildSVGPath(params: LettersParams): string {
  const points = runWalk(params);
  if (points.length === 0) return '';
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
  }
  return d;
}
```

**collect.html** — mobile-friendly (same structure as spiral collect.html but id `studio_letters_collect`):
- Letter picker: 26 buttons (A–Z) in a grid, tap to select current letter
- Sliders for numLines, lineLength, gaussianStdDev
- Seed display (read-only number) + "New Seed" button
- Name input + Save button
- Canvas preview (re-runs walk on every change; may be slow on mobile — add a short debounce 300ms)

**collect.ts**:
- On letter button click: update `currentParams.letter`, redraw
- On slider change: update param, debounce 300ms, redraw
- "New Seed" button: `currentParams.seed = Math.floor(Math.random() * 1000000)`, update display, redraw
- Save: `saveEntry('Letters', name, currentParams)`, show success

**render.html / render.ts** — same pattern as spiral render but for letters.

---

### Task 8: Tree (subagent)

**Files:**
- Create: `studio/tree/drawing.ts`
- Create: `studio/tree/collect.ts`
- Create: `studio/tree/collect.html`
- Create: `studio/tree/render.ts`
- Create: `studio/tree/render.html`

**drawing.ts** — refactor from `projects/tree/tree.ts`:

```typescript
import { makeRng, gaussianRandom, randInt } from '../shared/seededRandom';

export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 576;

export interface WeatherDataPoint {
  year: number;
  location: string;
  latitude: number;
  longitude: number;
  temperature_2m_mean: number | string;
  dew_point_2m_mean: number | string;
  relative_humidity_2m_mean: number | string;
  precipitation_sum: number | string;
}

interface GaussianParams {
  centerAngle: number;
  yRemapFrom: [number, number];
  sigma: number;
  amplitude: number;
}

export interface TreeParams {
  scale: number;
  ringWidthFactor: number;
  numCircles: number;
  favorabilityContribution: number;
  gaussianContribution: number;
  noiseContribution: number;
  tempMin: number; tempMax: number; tempContribution: number;
  dewMin: number; dewMax: number; dewContribution: number;
  fineDetailFreq: number; fineDetailAmp: number;
  mediumDetailFreq: number; mediumDetailAmp: number;
  coarseDetailFreq: number; coarseDetailAmp: number;
  fineRingOffset: number; mediumRingOffset: number; coarseRingOffset: number;
  noiseOctaves: number;
  smoothingBase: number; smoothingInner: number; smoothingFalloff: number;
  noiseSeed: number;
  gaussianSeed: number;
  gaussianCountMin: number; gaussianCountMax: number;
  gaussianSigmaMin: number; gaussianSigmaMax: number;
  gaussianAmplitudeMin: number; gaussianAmplitudeMax: number;
  gaussianYFromMinRange: number; gaussianYFromMaxRange: number;
}
```

`PARAM_CONFIG` mirrors `projects/tree/tree.ts` exactly with these changes:
- `seed` renamed to `noiseSeed`
- Add `gaussianSeed: { default: 42, min: 0, max: 999999, step: 1 }`

All tree math functions (PerlinNoise1D, lerp, remap, getRadialNoise, smoothRingRadii, calculateRingWidth, calculateFavorabilityFromWeather, gaussian2D) copied verbatim from `projects/tree/tree.ts`.

`generateGaussians(params: TreeParams): GaussianParams[]` — uses `makeRng(params.gaussianSeed)` instead of `Math.random()`:
```typescript
export function generateGaussians(params: TreeParams): GaussianParams[] {
  const rng = makeRng(params.gaussianSeed);
  const count = randInt(rng, params.gaussianCountMin, params.gaussianCountMax + 1);
  return Array.from({ length: count }, () => {
    const yFromMin = rng() * (params.gaussianYFromMaxRange - params.gaussianYFromMinRange - 3) + params.gaussianYFromMinRange;
    const yFromMax = rng() * (params.gaussianYFromMaxRange - yFromMin - 3) + (yFromMin + 3);
    return {
      centerAngle: rng() * Math.PI * 2,
      yRemapFrom: [yFromMin, yFromMax] as [number, number],
      sigma: rng() * (params.gaussianSigmaMax - params.gaussianSigmaMin) + params.gaussianSigmaMin,
      amplitude: rng() * (params.gaussianAmplitudeMax - params.gaussianAmplitudeMin) + params.gaussianAmplitudeMin,
    };
  });
}
```

`generateCirclePoints(params: TreeParams, weatherData: WeatherDataPoint[]): number[][]` — adapted from `projects/tree/tree.ts:586-700`, uses `generateGaussians(params)` and `new PerlinNoise1D(params.noiseSeed)`.

`draw(ctx, params, weatherData)` and `buildSVGPath(params, weatherData)` follow same pattern as spiral but call `generateCirclePoints`.

**collect.html** — two-phase mobile layout:
- Phase 1 (life history): same HTML as `projects/tree_timeline/tree_timeline.html` — name, birth year, birth location search, year table, "Generate My Tree" button
- Phase 2 (params, hidden until weather fetch completes): all ~30 sliders, noiseSeed slider + "Randomize Noise" button, "Regenerate Gaussians" button, canvas preview, Submit button

**collect.ts** — two phases:
- Phase 1: copy life history + weather fetch logic from `projects/tree_timeline/tree_timeline.ts` verbatim (geocoding, weather API, year table)
- On weather fetch complete: `currentWeatherData = weatherData; currentParams.numCircles = weatherData.length; showPhase2(); draw(ctx, currentParams, currentWeatherData);`
- "Regenerate Gaussians" button: `currentParams.gaussianSeed = Math.floor(Math.random() * 1000000); draw(...)`
- Submit: `saveEntry('Tree', name, { params: currentParams, weatherData: currentWeatherData })`

**render.ts**:
- Load entries → list with `entry.name — entry.timestamp`
- On entry click: `const { params, weatherData } = JSON.parse(entry.data); draw(ctx, params, weatherData)`
- All sliders + "Regenerate Gaussians" button
- Export SVG: `buildSVGPath(params, weatherData)` + border rect + name label

---

## Subagent Instructions

Each subagent receives:
1. The spec: `docs/superpowers/specs/2026-05-21-studio-plotter-design.md`
2. This plan: `docs/superpowers/plans/2026-05-21-studio-plotter.md`
3. The source project to port from (`projects/spiral/spiral.ts`, etc.)
4. The already-built shared modules: `studio/shared/seededRandom.ts`, `studio/shared/sheets.ts`
5. Instruction: implement Tasks 6, 7, or 8 for their project. Build and verify `npx webpack --config webpack.common.js` completes without errors.
