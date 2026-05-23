export {};

import { PARAM_CONFIG, SpiralParams, draw, drawBorder, buildSVGPath, CANVAS_WIDTH, CANVAS_HEIGHT } from './drawing';
import { loadEntries, SheetEntry } from '../shared/sheets';
import { buildTextGroup } from '../shared/svgLabels';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let currentName = '';
let currentTimestamp = '';

const currentParams: SpiralParams = {
  param1: PARAM_CONFIG.param1.default,
  param2: PARAM_CONFIG.param2.default,
  param3: PARAM_CONFIG.param3.default,
  param4: PARAM_CONFIG.param4.default,
  param5: PARAM_CONFIG.param5.default,
  param6: PARAM_CONFIG.param6.default,
};

const sliderRefs: Record<string, { slider: HTMLInputElement; valueDisplay: HTMLSpanElement }> = {};

function initCanvas(): void {
  const container = document.getElementById('canvas-container')!;
  canvas = document.createElement('canvas');
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
  drawBorder(ctx);
  drawLabels(ctx);
}

function drawLabels(ctx: CanvasRenderingContext2D): void {
  if (!currentName && !currentTimestamp) return;
  ctx.save();
  ctx.fillStyle = 'black';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'bottom';
  if (currentName) {
    ctx.textAlign = 'left';
    ctx.fillText(currentName.toUpperCase(), 28, CANVAS_HEIGHT - 8);
  }
  if (currentTimestamp) {
    const match = currentTimestamp.match(/\d{4}/);
    if (match) {
      ctx.textAlign = 'right';
      ctx.fillText(match[0], CANVAS_WIDTH - 28, CANVAS_HEIGHT - 8);
    }
  }
  ctx.restore();
}

function loadParamsIntoSliders(params: SpiralParams): void {
  const keys = Object.keys(PARAM_CONFIG) as (keyof SpiralParams)[];
  keys.forEach((key) => {
    currentParams[key] = params[key];
    const ref = sliderRefs[key];
    if (ref) {
      ref.slider.value = params[key].toString();
      ref.valueDisplay.textContent = params[key].toFixed(2);
    }
  });
}

function buildControls(container: HTMLElement): void {
  // Entry list section
  const entriesHeading = document.createElement('h2');
  entriesHeading.textContent = 'Entries';
  container.appendChild(entriesHeading);

  const loadBtn = document.createElement('button');
  loadBtn.textContent = 'Load Entries';
  loadBtn.className = 'btn-block';
  container.appendChild(loadBtn);

  const entryList = document.createElement('div');
  entryList.className = 'entry-list';
  container.appendChild(entryList);

  loadBtn.addEventListener('click', async () => {
    loadBtn.setAttribute('disabled', 'true');
    loadBtn.textContent = 'Loading…';
    try {
      const entries = await loadEntries('Spiral');
      entryList.innerHTML = '';
      if (entries.length === 0) {
        entryList.innerHTML = '<div class="entry-item">No entries found.</div>';
      } else {
        entries.forEach((entry: SheetEntry) => {
          const el = document.createElement('div');
          el.className = 'entry-item';

          const nameEl = document.createElement('span');
          nameEl.className = 'entry-name';
          nameEl.textContent = entry.name;

          const tsEl = document.createElement('span');
          tsEl.className = 'entry-ts';
          tsEl.textContent = entry.timestamp;

          el.appendChild(nameEl);
          el.appendChild(tsEl);

          el.addEventListener('click', () => {
            try {
              const params = JSON.parse(entry.data) as SpiralParams;
              currentName = entry.name;
              currentTimestamp = entry.timestamp;
              loadParamsIntoSliders(params);
              redraw();
            } catch {
              // ignore parse errors
            }
          });

          entryList.appendChild(el);
        });
      }
    } finally {
      loadBtn.removeAttribute('disabled');
      loadBtn.textContent = 'Load Entries';
    }
  });

  // Sliders section
  const slidersHeading = document.createElement('h2');
  slidersHeading.textContent = 'Parameters';
  slidersHeading.style.marginTop = '16px';
  container.appendChild(slidersHeading);

  const paramKeys = Object.keys(PARAM_CONFIG) as (keyof SpiralParams)[];

  paramKeys.forEach((key) => {
    const config = PARAM_CONFIG[key];

    const wrapper = document.createElement('div');

    const labelRow = document.createElement('div');
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.marginBottom = '2px';

    const label = document.createElement('label');
    label.textContent = key;

    const valueDisplay = document.createElement('span');
    valueDisplay.style.fontSize = '12px';
    valueDisplay.textContent = currentParams[key].toFixed(2);

    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = config.min.toString();
    slider.max = config.max.toString();
    slider.step = config.step.toString();
    slider.value = currentParams[key].toString();

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      currentParams[key] = val;
      valueDisplay.textContent = val.toFixed(2);
      redraw();
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(slider);
    container.appendChild(wrapper);

    sliderRefs[key] = { slider, valueDisplay };
  });

  // Export SVG button
  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export SVG';
  exportBtn.className = 'btn-primary';
  exportBtn.style.marginTop = '16px';
  exportBtn.addEventListener('click', () => {
    exportSVG();
  });
  container.appendChild(exportBtn);
}

function exportSVG(): void {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
  svg.setAttribute('width', CANVAS_WIDTH.toString());
  svg.setAttribute('height', CANVAS_HEIGHT.toString());
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Spiral path
  const spiralPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  spiralPath.setAttribute('d', buildSVGPath(currentParams));
  spiralPath.setAttribute('fill', 'none');
  spiralPath.setAttribute('stroke', 'black');
  spiralPath.setAttribute('stroke-width', '0.5');
  svg.appendChild(spiralPath);

  // Border rect
  const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  borderRect.setAttribute('x', '25');
  borderRect.setAttribute('y', '25');
  borderRect.setAttribute('width', (CANVAS_WIDTH - 50).toString());
  borderRect.setAttribute('height', (CANVAS_HEIGHT - 75).toString());
  borderRect.setAttribute('fill', 'none');
  borderRect.setAttribute('stroke', 'black');
  borderRect.setAttribute('stroke-width', '1');
  svg.appendChild(borderRect);

  // Name label bottom-left
  const name = currentName || 'unknown';
  buildTextGroup(svg, name, 23.5, CANVAS_HEIGHT - 15);

  // Year label bottom-right: extract 4-digit year from entry timestamp, or current year
  const yearMatch = currentTimestamp.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear());
  buildTextGroup(svg, year, 551, CANVAS_HEIGHT - 15, 0.2, true);

  // Download
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spiral-${name}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  const container = document.getElementById('controls-container')!;
  buildControls(container);
  redraw();
});
