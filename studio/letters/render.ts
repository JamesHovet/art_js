export {};

import { draw, buildSVGPath, CANVAS_WIDTH, CANVAS_HEIGHT, PARAM_CONFIG, LettersParams } from './drawing';
import { loadEntries, SheetEntry } from '../shared/sheets';
import { buildTextGroup } from '../../studio/shared/svgLabels';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

let currentParams: LettersParams = {
  letter: 'A',
  numLines: PARAM_CONFIG.numLines.default,
  lineLength: PARAM_CONFIG.lineLength.default,
  gaussianStdDev: PARAM_CONFIG.gaussianStdDev.default,
  seed: PARAM_CONFIG.seed.default,
};

let currentEntryName = '';
let currentTimestamp = '';
let ctx: CanvasRenderingContext2D;
let selectedEntryEl: HTMLElement | null = null;

function initCanvas(): void {
  const container = document.getElementById('canvas-container')!;
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  container.appendChild(canvas);
}

function redraw(): void {
  draw(ctx, currentParams);
}

function updateSeedDisplay(): void {
  const el = document.getElementById('seed-display-render');
  if (el) el.textContent = String(currentParams.seed);
}

function updateLetterPickerSelection(): void {
  const container = document.getElementById('letter-picker-render');
  if (!container) return;
  const allBtns = container.querySelectorAll('button');
  allBtns.forEach(function(btn) {
    if (btn.textContent === currentParams.letter) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

function updateSliders(): void {
  const sliderKeys: Array<keyof typeof PARAM_CONFIG> = ['numLines', 'lineLength', 'gaussianStdDev'];
  sliderKeys.forEach(function(key) {
    const slider = document.getElementById('slider-' + key) as HTMLInputElement | null;
    const valueEl = document.getElementById('sliderval-' + key);
    if (slider) slider.value = String((currentParams as unknown as Record<string, number>)[key]);
    if (valueEl) valueEl.textContent = String((currentParams as unknown as Record<string, number>)[key]);
  });
  updateSeedDisplay();
  updateLetterPickerSelection();
}

function buildControls(): void {
  const container = document.getElementById('controls-container')!;

  // Section: Entries
  const entriesSection = document.createElement('section');
  const entriesH3 = document.createElement('h3');
  entriesH3.textContent = 'Saved Entries';
  entriesSection.appendChild(entriesH3);

  const loadBtn = document.createElement('button');
  loadBtn.textContent = 'Load Entries';
  entriesSection.appendChild(loadBtn);

  const statusEl = document.createElement('div');
  statusEl.id = 'status-render';
  entriesSection.appendChild(statusEl);

  const entryList = document.createElement('div');
  entryList.className = 'entry-list';
  entriesSection.appendChild(entryList);

  loadBtn.addEventListener('click', async function() {
    statusEl.textContent = 'Loading...';
    entryList.innerHTML = '';
    const entries = await loadEntries('Letters');
    if (entries.length === 0) {
      statusEl.textContent = 'No entries found.';
      return;
    }
    statusEl.textContent = entries.length + ' entries loaded.';
    entries.forEach(function(entry: SheetEntry) {
      const el = document.createElement('div');
      el.className = 'entry-item';
      const nameEl = document.createElement('div');
      nameEl.className = 'entry-name';
      nameEl.textContent = entry.name;
      el.appendChild(nameEl);
      const tsEl = document.createElement('div');
      tsEl.className = 'entry-ts';
      tsEl.textContent = entry.timestamp;
      el.appendChild(tsEl);
      el.addEventListener('click', function() {
        if (selectedEntryEl) selectedEntryEl.classList.remove('selected');
        el.classList.add('selected');
        selectedEntryEl = el;
        try {
          const parsed = JSON.parse(entry.data) as LettersParams;
          currentParams = parsed;
          currentEntryName = entry.name;
          currentTimestamp = entry.timestamp;
          updateSliders();
          redraw();
        } catch (e) {
          statusEl.textContent = 'Error parsing entry data.';
        }
      });
      entryList.appendChild(el);
    });
  });

  container.appendChild(entriesSection);

  // Section: Letter picker
  const letterSection = document.createElement('section');
  const letterH3 = document.createElement('h3');
  letterH3.textContent = 'Letter';
  letterSection.appendChild(letterH3);

  const pickerGrid = document.createElement('div');
  pickerGrid.id = 'letter-picker-render';
  LETTERS.forEach(function(letter) {
    const btn = document.createElement('button');
    btn.textContent = letter;
    if (letter === currentParams.letter) btn.classList.add('selected');
    btn.addEventListener('click', function() {
      currentParams.letter = letter;
      updateLetterPickerSelection();
      redraw();
    });
    pickerGrid.appendChild(btn);
  });
  letterSection.appendChild(pickerGrid);
  container.appendChild(letterSection);

  // Section: Parameters
  const paramsSection = document.createElement('section');
  const paramsH3 = document.createElement('h3');
  paramsH3.textContent = 'Parameters';
  paramsSection.appendChild(paramsH3);

  const sliderDefs: Array<{
    key: keyof typeof PARAM_CONFIG;
    label: string;
    parse: (v: string) => number;
    format: (v: number) => string;
  }> = [
    { key: 'numLines',       label: 'Lines',              parse: parseInt,   format: function(v) { return String(v); } },
    { key: 'lineLength',     label: 'Line Length',        parse: parseFloat, format: function(v) { return v.toFixed(2); } },
    { key: 'gaussianStdDev', label: 'Direction Variance', parse: parseFloat, format: function(v) { return v.toFixed(2); } },
  ];

  sliderDefs.forEach(function(def) {
    const cfg = PARAM_CONFIG[def.key];
    const wrapper = document.createElement('div');

    const lbl = document.createElement('label');
    lbl.textContent = def.label;
    wrapper.appendChild(lbl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'slider-' + def.key;
    slider.min = String(cfg.min);
    slider.max = String(cfg.max);
    slider.step = String(cfg.step);
    slider.value = String((currentParams as unknown as Record<string, number>)[def.key]);
    wrapper.appendChild(slider);

    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'slider-value';
    valueDisplay.id = 'sliderval-' + def.key;
    valueDisplay.textContent = def.format((currentParams as unknown as Record<string, number>)[def.key] as number);
    wrapper.appendChild(valueDisplay);

    slider.addEventListener('input', function() {
      const val = def.parse(slider.value);
      (currentParams as unknown as Record<string, number>)[def.key] = val;
      valueDisplay.textContent = def.format(val);
      redraw();
    });

    paramsSection.appendChild(wrapper);
  });

  // Seed row
  const seedLbl = document.createElement('label');
  seedLbl.textContent = 'Seed';
  paramsSection.appendChild(seedLbl);

  const seedRow = document.createElement('div');
  seedRow.className = 'seed-row';

  const seedDisplay = document.createElement('div');
  seedDisplay.id = 'seed-display-render';
  seedDisplay.textContent = String(currentParams.seed);
  seedRow.appendChild(seedDisplay);

  const newSeedBtn = document.createElement('button');
  newSeedBtn.id = 'new-seed-btn-render';
  newSeedBtn.textContent = 'New Seed';
  newSeedBtn.addEventListener('click', function() {
    currentParams.seed = Math.floor(Math.random() * 1000000);
    updateSeedDisplay();
    redraw();
  });
  seedRow.appendChild(newSeedBtn);
  paramsSection.appendChild(seedRow);

  container.appendChild(paramsSection);

  // Section: Export
  const exportSection = document.createElement('section');
  const exportH3 = document.createElement('h3');
  exportH3.textContent = 'Export';
  exportSection.appendChild(exportH3);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn-primary';
  exportBtn.textContent = 'Export SVG';
  exportBtn.addEventListener('click', function() {
    exportSVG();
  });
  exportSection.appendChild(exportBtn);

  container.appendChild(exportSection);
}

function exportSVG(): void {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg') as SVGElement;
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('width', String(CANVAS_WIDTH));
  svg.setAttribute('height', String(CANVAS_HEIGHT));
  svg.setAttribute('viewBox', '0 0 ' + CANVAS_WIDTH + ' ' + CANVAS_HEIGHT);

  // Border rect
  const rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('x', '25');
  rect.setAttribute('y', '25');
  rect.setAttribute('width', String(CANVAS_WIDTH - 50));
  rect.setAttribute('height', String(CANVAS_HEIGHT - 75));
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', 'black');
  rect.setAttribute('stroke-width', '1');
  svg.appendChild(rect);

  // Walk path
  const pathData = buildSVGPath(currentParams);
  if (pathData) {
    const pathEl = document.createElementNS(svgNS, 'path');
    pathEl.setAttribute('d', pathData);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', 'black');
    pathEl.setAttribute('stroke-width', '0.5');
    svg.appendChild(pathEl);
  }

  // Name label bottom-left
  const nameToWrite = currentEntryName || 'UNKNOWN';
  buildTextGroup(svg, nameToWrite, 23.5, CANVAS_HEIGHT - 15);

  // Year bottom-right — extract 4 digits from timestamp
  let year = new Date().getFullYear().toString();
  if (currentTimestamp) {
    const match = currentTimestamp.match(/\d{4}/);
    if (match) year = match[0];
  }
  buildTextGroup(svg, year, 450, CANVAS_HEIGHT - 15);

  // Serialize and download
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (currentEntryName || 'unknown').replace(/\s+/g, '-').toLowerCase();
  a.download = 'letters-' + safeName + '.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.addEventListener('DOMContentLoaded', function() {
  initCanvas();
  buildControls();
  redraw();
});
