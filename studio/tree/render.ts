export {};

import { PARAM_CONFIG, TreeParams, WeatherDataPoint, draw, buildSVGPath, CANVAS_WIDTH, CANVAS_HEIGHT } from './drawing';
import { loadEntries, SheetEntry } from '../shared/sheets';
import { buildTextGroup } from '../shared/svgLabels';

// ===== GLOBAL STATE =====

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let svgOverlay: SVGSVGElement | null = null;
let currentParams: TreeParams = buildDefaultParams();
let currentWeatherData: WeatherDataPoint[] = [];
let currentName: string = '';
let currentTimestamp: string = '';

function buildDefaultParams(): TreeParams {
  return {
    scale: PARAM_CONFIG.scale.default,
    ringWidthFactor: PARAM_CONFIG.ringWidthFactor.default,
    numCircles: PARAM_CONFIG.numCircles.default,
    favorabilityContribution: PARAM_CONFIG.favorabilityContribution.default,
    gaussianContribution: PARAM_CONFIG.gaussianContribution.default,
    noiseContribution: PARAM_CONFIG.noiseContribution.default,
    tempMin: PARAM_CONFIG.tempMin.default,
    tempMax: PARAM_CONFIG.tempMax.default,
    tempContribution: PARAM_CONFIG.tempContribution.default,
    dewMin: PARAM_CONFIG.dewMin.default,
    dewMax: PARAM_CONFIG.dewMax.default,
    dewContribution: PARAM_CONFIG.dewContribution.default,
    fineDetailFreq: PARAM_CONFIG.fineDetailFreq.default,
    fineDetailAmp: PARAM_CONFIG.fineDetailAmp.default,
    mediumDetailFreq: PARAM_CONFIG.mediumDetailFreq.default,
    mediumDetailAmp: PARAM_CONFIG.mediumDetailAmp.default,
    coarseDetailFreq: PARAM_CONFIG.coarseDetailFreq.default,
    coarseDetailAmp: PARAM_CONFIG.coarseDetailAmp.default,
    fineRingOffset: PARAM_CONFIG.fineRingOffset.default,
    mediumRingOffset: PARAM_CONFIG.mediumRingOffset.default,
    coarseRingOffset: PARAM_CONFIG.coarseRingOffset.default,
    noiseOctaves: PARAM_CONFIG.noiseOctaves.default,
    smoothingBase: PARAM_CONFIG.smoothingBase.default,
    smoothingInner: PARAM_CONFIG.smoothingInner.default,
    smoothingFalloff: PARAM_CONFIG.smoothingFalloff.default,
    noiseSeed: PARAM_CONFIG.noiseSeed.default,
    gaussianSeed: PARAM_CONFIG.gaussianSeed.default,
    gaussianCountMin: PARAM_CONFIG.gaussianCountMin.default,
    gaussianCountMax: PARAM_CONFIG.gaussianCountMax.default,
    gaussianSigmaMin: PARAM_CONFIG.gaussianSigmaMin.default,
    gaussianSigmaMax: PARAM_CONFIG.gaussianSigmaMax.default,
    gaussianAmplitudeMin: PARAM_CONFIG.gaussianAmplitudeMin.default,
    gaussianAmplitudeMax: PARAM_CONFIG.gaussianAmplitudeMax.default,
    gaussianYFromMinRange: PARAM_CONFIG.gaussianYFromMinRange.default,
    gaussianYFromMaxRange: PARAM_CONFIG.gaussianYFromMaxRange.default,
  };
}

// ===== CANVAS INIT =====

function initCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  container.innerHTML = '';
  container.style.position = 'relative';

  const dpr = window.devicePixelRatio || 1;
  canvas = document.createElement('canvas');
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  container.appendChild(canvas);

  svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
  svgOverlay.setAttribute('viewBox', '0 0 ' + CANVAS_WIDTH + ' ' + CANVAS_HEIGHT);
  svgOverlay.style.position = 'absolute';
  svgOverlay.style.top = '0';
  svgOverlay.style.left = '0';
  svgOverlay.style.width = '100%';
  svgOverlay.style.height = '100%';
  svgOverlay.style.pointerEvents = 'none';
  container.appendChild(svgOverlay);
}

function updateSVGOverlay(): void {
  if (!svgOverlay) return;
  svgOverlay.innerHTML = '';

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '25');
  rect.setAttribute('y', '25');
  rect.setAttribute('width', String(CANVAS_WIDTH - 50));
  rect.setAttribute('height', String(CANVAS_HEIGHT - 75));
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', 'black');
  rect.setAttribute('stroke-width', '1');
  svgOverlay.appendChild(rect);

  if (currentName) {
    buildTextGroup(svgOverlay, currentName, 23.5, CANVAS_HEIGHT - 15);
  }

  let yr = '';
  if (currentWeatherData.length > 0) {
    yr = currentWeatherData[0].year + '-' + currentWeatherData[currentWeatherData.length - 1].year;
  } else if (currentTimestamp) {
    const m = currentTimestamp.match(/\d{4}/);
    if (m) yr = m[0];
  }
  if (yr) buildTextGroup(svgOverlay, yr, 395, CANVAS_HEIGHT - 15);
}

function drawTree() {
  if (!ctx) return;
  draw(ctx, currentParams, currentWeatherData);
  updateSVGOverlay();
}

// ===== CONTROLS =====

let sliderRefs: Map<keyof TreeParams, { slider: HTMLInputElement; val: HTMLElement }> = new Map();

function setupControls() {
  const container = document.getElementById('controls-container');
  if (!container) return;
  container.innerHTML = '';
  sliderRefs.clear();

  function addHeader(text: string) {
    const h = document.createElement('div');
    h.className = 'section-header';
    h.textContent = text;
    container.appendChild(h);
  }

  function addSlider(
    labelText: string,
    key: keyof TreeParams,
    cfg: { min: number; max: number; step: number; default: number },
    isDecimal: boolean
  ) {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const lbl = document.createElement('label');
    lbl.textContent = labelText;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = cfg.min.toString();
    slider.max = cfg.max.toString();
    slider.step = cfg.step.toString();
    slider.value = (currentParams[key] as number).toString();

    const val = document.createElement('div');
    val.className = 'val';
    val.textContent = isDecimal ? (currentParams[key] as number).toFixed(2) : (currentParams[key] as number).toFixed(0);

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      (currentParams as any)[key] = isDecimal ? v : Math.round(v);
      val.textContent = isDecimal ? v.toFixed(2) : v.toFixed(0);
      drawTree();
    });

    row.appendChild(lbl);
    row.appendChild(slider);
    row.appendChild(val);
    container.appendChild(row);

    sliderRefs.set(key, { slider, val });
    return slider;
  }

  function addButton(text: string, color: string, onClick: () => void) {
    const btn = document.createElement('button');
    btn.className = 'btn-block';
    btn.textContent = text;
    btn.style.background = color;
    btn.addEventListener('click', onClick);
    container.appendChild(btn);
    return btn;
  }

  addHeader('Overall');
  addSlider('Scale (px)', 'scale', PARAM_CONFIG.scale, false);
  addSlider('Growth Model Blend', 'ringWidthFactor', PARAM_CONFIG.ringWidthFactor, true);
  addSlider('Num Circles', 'numCircles', PARAM_CONFIG.numCircles, false);

  addHeader('Effect Contributions');
  addSlider('Favorability', 'favorabilityContribution', PARAM_CONFIG.favorabilityContribution, true);
  addSlider('Gaussians', 'gaussianContribution', PARAM_CONFIG.gaussianContribution, true);
  addSlider('Perlin Noise', 'noiseContribution', PARAM_CONFIG.noiseContribution, true);

  addHeader('Weather Mapping');
  addSlider('Temp Min (°C)', 'tempMin', PARAM_CONFIG.tempMin, false);
  addSlider('Temp Max (°C)', 'tempMax', PARAM_CONFIG.tempMax, false);
  addSlider('Temp Contribution', 'tempContribution', PARAM_CONFIG.tempContribution, true);
  addSlider('Dew Min (°C)', 'dewMin', PARAM_CONFIG.dewMin, false);
  addSlider('Dew Max (°C)', 'dewMax', PARAM_CONFIG.dewMax, false);
  addSlider('Dew Contribution', 'dewContribution', PARAM_CONFIG.dewContribution, true);

  addHeader('Perlin Noise');

  // noiseSeed slider + randomize button
  const seedRow = document.createElement('div');
  seedRow.className = 'slider-row';
  const seedLbl = document.createElement('label');
  seedLbl.textContent = 'Noise Seed';
  const seedSlider = document.createElement('input');
  seedSlider.type = 'range';
  seedSlider.min = PARAM_CONFIG.noiseSeed.min.toString();
  seedSlider.max = PARAM_CONFIG.noiseSeed.max.toString();
  seedSlider.step = PARAM_CONFIG.noiseSeed.step.toString();
  seedSlider.value = currentParams.noiseSeed.toString();
  const seedVal = document.createElement('div');
  seedVal.className = 'val';
  seedVal.textContent = currentParams.noiseSeed.toFixed(0);
  seedSlider.addEventListener('input', () => {
    currentParams.noiseSeed = parseInt(seedSlider.value, 10);
    seedVal.textContent = currentParams.noiseSeed.toFixed(0);
    drawTree();
  });
  seedRow.appendChild(seedLbl);
  seedRow.appendChild(seedSlider);
  seedRow.appendChild(seedVal);
  container.appendChild(seedRow);
  sliderRefs.set('noiseSeed', { slider: seedSlider, val: seedVal });

  addButton('Randomize Noise', '#6c757d', () => {
    const s = Math.floor(Math.random() * 1000000);
    currentParams.noiseSeed = s;
    seedSlider.value = s.toString();
    seedVal.textContent = s.toFixed(0);
    drawTree();
  });

  addSlider('Noise Octaves', 'noiseOctaves', PARAM_CONFIG.noiseOctaves, false);
  addSlider('Fine Freq', 'fineDetailFreq', PARAM_CONFIG.fineDetailFreq, true);
  addSlider('Fine Amp', 'fineDetailAmp', PARAM_CONFIG.fineDetailAmp, true);
  addSlider('Fine Ring Offset', 'fineRingOffset', PARAM_CONFIG.fineRingOffset, true);
  addSlider('Medium Freq', 'mediumDetailFreq', PARAM_CONFIG.mediumDetailFreq, true);
  addSlider('Medium Amp', 'mediumDetailAmp', PARAM_CONFIG.mediumDetailAmp, true);
  addSlider('Medium Ring Offset', 'mediumRingOffset', PARAM_CONFIG.mediumRingOffset, true);
  addSlider('Coarse Freq', 'coarseDetailFreq', PARAM_CONFIG.coarseDetailFreq, true);
  addSlider('Coarse Amp', 'coarseDetailAmp', PARAM_CONFIG.coarseDetailAmp, true);
  addSlider('Coarse Ring Offset', 'coarseRingOffset', PARAM_CONFIG.coarseRingOffset, true);

  addHeader('Gaussians');
  addButton('Regenerate Gaussians', '#17a2b8', () => {
    currentParams.gaussianSeed = Math.floor(Math.random() * 1000000);
    drawTree();
  });
  addSlider('Gaussian Count Min', 'gaussianCountMin', PARAM_CONFIG.gaussianCountMin, false);
  addSlider('Gaussian Count Max', 'gaussianCountMax', PARAM_CONFIG.gaussianCountMax, false);
  addSlider('Sigma Min', 'gaussianSigmaMin', PARAM_CONFIG.gaussianSigmaMin, true);
  addSlider('Sigma Max', 'gaussianSigmaMax', PARAM_CONFIG.gaussianSigmaMax, true);
  addSlider('Amplitude Min', 'gaussianAmplitudeMin', PARAM_CONFIG.gaussianAmplitudeMin, true);
  addSlider('Amplitude Max', 'gaussianAmplitudeMax', PARAM_CONFIG.gaussianAmplitudeMax, true);
  addSlider('Y From Min Range', 'gaussianYFromMinRange', PARAM_CONFIG.gaussianYFromMinRange, false);
  addSlider('Y From Max Range', 'gaussianYFromMaxRange', PARAM_CONFIG.gaussianYFromMaxRange, false);

  addHeader('Smoothing');
  addSlider('Smoothing Base', 'smoothingBase', PARAM_CONFIG.smoothingBase, false);
  addSlider('Smoothing Inner', 'smoothingInner', PARAM_CONFIG.smoothingInner, false);
  addSlider('Smoothing Falloff', 'smoothingFalloff', PARAM_CONFIG.smoothingFalloff, true);
}

function syncSlidersToParams() {
  for (const key of Object.keys(currentParams) as (keyof TreeParams)[]) {
    const ref = sliderRefs.get(key);
    if (!ref) continue;
    const v = currentParams[key] as number;
    ref.slider.value = v.toString();
    // Determine decimal by step
    const cfg = (PARAM_CONFIG as any)[key];
    const isDecimal = cfg && cfg.step < 1;
    ref.val.textContent = isDecimal ? v.toFixed(2) : v.toFixed(0);
  }
}

// ===== ENTRY LOADING =====

function loadEntry(entry: SheetEntry) {
  currentName = entry.name;
  currentTimestamp = entry.timestamp;

  try {
    const parsed = JSON.parse(entry.data) as { params: TreeParams; weatherData: WeatherDataPoint[] };
    currentParams = parsed.params;
    currentWeatherData = parsed.weatherData;
  } catch (e) {
    console.error('Error parsing entry data:', e);
    return;
  }

  syncSlidersToParams();
  drawTree();
}

function displayEntries(entries: SheetEntry[]) {
  const list = document.getElementById('entries-list');
  if (!list) return;
  list.innerHTML = '';

  if (entries.length === 0) {
    list.innerHTML = '<p style="color:#888;font-size:13px;">No entries found.</p>';
    return;
  }

  entries.forEach((entry) => {
    const div = document.createElement('div');
    div.className = 'entry-item';

    const nameEl = document.createElement('div');
    nameEl.className = 'entry-name';
    nameEl.textContent = entry.name;

    const tsEl = document.createElement('div');
    tsEl.className = 'entry-ts';
    tsEl.textContent = entry.timestamp;

    div.appendChild(nameEl);
    div.appendChild(tsEl);

    div.addEventListener('click', () => {
      loadEntry(entry);
    });

    list.appendChild(div);
  });
}

// ===== SVG EXPORT =====

function exportSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', CANVAS_WIDTH.toString());
  svg.setAttribute('height', CANVAS_HEIGHT.toString());
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Border rect
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '25');
  rect.setAttribute('y', '25');
  rect.setAttribute('width', (CANVAS_WIDTH - 50).toString());
  rect.setAttribute('height', (CANVAS_HEIGHT - 75).toString());
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', 'black');
  rect.setAttribute('stroke-width', '1');
  svg.appendChild(rect);

  // Tree path
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.setAttribute('d', buildSVGPath(currentParams, currentWeatherData));
  pathEl.setAttribute('fill', 'none');
  pathEl.setAttribute('stroke', 'black');
  pathEl.setAttribute('stroke-width', '1');
  svg.appendChild(pathEl);

  // Name label bottom-left
  buildTextGroup(svg, currentName || 'TREE', 23.5, CANVAS_HEIGHT - 15);

  // Year range bottom-right
  let yearRangeStr: string;
  if (currentWeatherData.length > 0) {
    yearRangeStr = currentWeatherData[0].year + '-' + currentWeatherData[currentWeatherData.length - 1].year;
  } else {
    // Fall back to year from timestamp
    const ts = currentTimestamp ? new Date(currentTimestamp) : new Date();
    yearRangeStr = ts.getFullYear().toString();
  }
  buildTextGroup(svg, yearRangeStr, 395, CANVAS_HEIGHT - 15);

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'tree-' + (currentName || 'output') + '.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  setupControls();

  const loadBtn = document.getElementById('load-btn');
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      (loadBtn as HTMLButtonElement).disabled = true;
      loadBtn.textContent = 'Loading...';
      try {
        const entries = await loadEntries('Tree');
        displayEntries(entries);
      } finally {
        (loadBtn as HTMLButtonElement).disabled = false;
        loadBtn.textContent = 'Load Entries';
      }
    });
  }

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSVG);
  }
});
