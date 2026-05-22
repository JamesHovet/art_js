export {};

import { PARAM_CONFIG, SpiralParams, draw, drawBorder, CANVAS_WIDTH, CANVAS_HEIGHT } from './drawing';
import { saveEntry } from '../shared/sheets';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const currentParams: SpiralParams = {
  param1: PARAM_CONFIG.param1.default,
  param2: PARAM_CONFIG.param2.default,
  param3: PARAM_CONFIG.param3.default,
  param4: PARAM_CONFIG.param4.default,
  param5: PARAM_CONFIG.param5.default,
  param6: PARAM_CONFIG.param6.default,
};

function initCanvas(): void {
  const container = document.getElementById('canvas-container')!;
  canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  container.appendChild(canvas);
}

function redraw(): void {
  draw(ctx, currentParams);
  drawBorder(ctx);
}

function buildSliders(): void {
  const inner = document.getElementById('controls-inner')!;
  inner.innerHTML = '';

  const paramKeys = Object.keys(PARAM_CONFIG) as (keyof SpiralParams)[];
  const sliderRefs: Record<string, HTMLInputElement> = {};

  paramKeys.forEach((key, index) => {
    const config = PARAM_CONFIG[key];

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.marginBottom = '12px';

    const label = document.createElement('label');
    label.textContent = String(index + 1);
    label.style.fontSize = '13px';
    label.style.minWidth = '16px';
    label.style.flexShrink = '0';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = config.min.toString();
    slider.max = config.max.toString();
    slider.step = config.step.toString();
    slider.value = currentParams[key].toString();
    slider.style.flex = '1';

    slider.addEventListener('input', () => {
      currentParams[key] = parseFloat(slider.value);
      redraw();
    });

    row.appendChild(label);
    row.appendChild(slider);
    inner.appendChild(row);
    sliderRefs[key] = slider;
  });

  // Randomize button
  const randomizeBtn = document.createElement('button');
  randomizeBtn.textContent = 'Randomize';
  randomizeBtn.className = 'btn-block';
  randomizeBtn.style.marginBottom = '16px';
  randomizeBtn.addEventListener('click', () => {
    paramKeys.forEach((key) => {
      const config = PARAM_CONFIG[key];
      const val = Math.random() * (config.max - config.min) + config.min;
      currentParams[key] = val;
      sliderRefs[key].value = val.toString();
    });
    redraw();
  });
  inner.appendChild(randomizeBtn);
}

function setupSubmit(): void {
  const submitBtn = document.getElementById('submit-btn')!;
  const nameInput = document.getElementById('name-input') as HTMLInputElement;
  const statusEl = document.getElementById('status')!;

  submitBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      statusEl.textContent = 'Please enter your name.';
      return;
    }
    submitBtn.setAttribute('disabled', 'true');
    statusEl.textContent = 'Saving…';
    try {
      await saveEntry('Spiral', name, currentParams);
      statusEl.textContent = `Saved! Thank you, ${name}.`;
    } catch {
      statusEl.textContent = 'Something went wrong. Please try again.';
    } finally {
      submitBtn.removeAttribute('disabled');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  buildSliders();
  setupSubmit();
  redraw();
});
