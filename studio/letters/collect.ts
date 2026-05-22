export {};

import { draw, CANVAS_WIDTH, CANVAS_HEIGHT, PARAM_CONFIG, LettersParams } from './drawing';
import { saveEntry } from '../shared/sheets';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

let currentParams: LettersParams = {
  letter: 'A',
  numLines: PARAM_CONFIG.numLines.default,
  lineLength: PARAM_CONFIG.lineLength.default,
  gaussianStdDev: PARAM_CONFIG.gaussianStdDev.default,
  seed: PARAM_CONFIG.seed.default,
};

let ctx: CanvasRenderingContext2D;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function initCanvas(): void {
  const container = document.getElementById('canvas-container')!;
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  container.appendChild(canvas);
}

function redraw(): void {
  draw(ctx, currentParams);
}

function scheduleRedraw(): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    debounceTimer = null;
    redraw();
  }, 300);
}

const MM_PER_PX = 153 / 576;
const AXIDRAW_SPEED = 50; // mm/s
const TEXT_TIME_S = 10;
const MAX_DRAW_SECONDS = 240;

function estimatedSeconds(numLines: number, lineLength: number): number {
  return (numLines * lineLength * MM_PER_PX) / AXIDRAW_SPEED + TEXT_TIME_S;
}

function isOverLimit(): boolean {
  return estimatedSeconds(currentParams.numLines, currentParams.lineLength) > MAX_DRAW_SECONDS;
}

function updateDrawTime(): void {
  const el = document.getElementById('draw-time');
  if (!el) return;
  const secs = estimatedSeconds(currentParams.numLines, currentParams.lineLength);
  const mins = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  const timeStr = mins > 0 ? mins + ' min ' + s + ' sec' : s + ' sec';
  if (secs > MAX_DRAW_SECONDS) {
    el.className = 'draw-time warn';
    el.textContent = 'Estimated draw time: ' + timeStr + '. Too long to plot — reduce Lines or Line Length to stay under 4 minutes.';
  } else {
    el.className = 'draw-time';
    el.textContent = 'Estimated draw time: ' + timeStr + '.';
  }
}

function freshSeed(): void {
  currentParams.seed = Math.floor(Math.random() * 1000000);
}

function buildLetterPicker(): void {
  const container = document.getElementById('letter-picker')!;
  LETTERS.forEach(function(letter) {
    const btn = document.createElement('button');
    btn.textContent = letter;
    if (letter === currentParams.letter) btn.classList.add('selected');
    btn.addEventListener('click', function() {
      currentParams.letter = letter;
      freshSeed();
      const allBtns = container.querySelectorAll('button');
      allBtns.forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      scheduleRedraw();
    });
    container.appendChild(btn);
  });
}

function buildSliders(): void {
  const container = document.getElementById('controls-inner')!;

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
    slider.min = String(cfg.min);
    slider.max = String(cfg.max);
    slider.step = String(cfg.step);
    slider.value = String((currentParams as unknown as Record<string, number>)[def.key]);
    slider.dataset.key = def.key;
    slider.style.marginBottom = '8px';
    wrapper.appendChild(slider);

    slider.addEventListener('input', function() {
      (currentParams as unknown as Record<string, number>)[def.key] = def.parse(slider.value);
      freshSeed();
      updateDrawTime();
      scheduleRedraw();
    });

    container.appendChild(wrapper);
  });
}

function setupSeedAndRandomizeButtons(): void {
  const seedBtn = document.getElementById('new-seed-btn');
  if (seedBtn) {
    seedBtn.addEventListener('click', function() {
      freshSeed();
      scheduleRedraw();
    });
  }

  const randomizeBtn = document.getElementById('randomize-btn');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', function() {
      currentParams.numLines = Math.round(
        PARAM_CONFIG.numLines.min + Math.random() * (PARAM_CONFIG.numLines.max - PARAM_CONFIG.numLines.min)
      );
      currentParams.lineLength = parseFloat(
        (PARAM_CONFIG.lineLength.min + Math.random() * (PARAM_CONFIG.lineLength.max - PARAM_CONFIG.lineLength.min)).toFixed(2)
      );
      currentParams.gaussianStdDev = parseFloat(
        (PARAM_CONFIG.gaussianStdDev.min + Math.random() * (PARAM_CONFIG.gaussianStdDev.max - PARAM_CONFIG.gaussianStdDev.min)).toFixed(2)
      );
      freshSeed();
      const sliderKeys: Array<keyof typeof PARAM_CONFIG> = ['numLines', 'lineLength', 'gaussianStdDev'];
      sliderKeys.forEach(function(key) {
        const slider = document.querySelector<HTMLInputElement>('input[data-key="' + key + '"]');
        if (slider) slider.value = String((currentParams as unknown as Record<string, number>)[key]);
      });
      updateDrawTime();
      scheduleRedraw();
    });
  }
}

function setupSubmit(): void {
  const btn = document.getElementById('submit-btn') as HTMLButtonElement;
  const nameInput = document.getElementById('name-input') as HTMLInputElement;
  const status = document.getElementById('status')!;

  btn.addEventListener('click', async function() {
    const name = nameInput.value.trim();
    if (!name) {
      status.textContent = 'Please enter your name.';
      status.style.color = '#c00';
      return;
    }
    if (isOverLimit()) {
      status.textContent = 'Drawing time exceeds 4 minutes. Reduce Lines or Line Length before saving.';
      status.style.color = '#c00';
      return;
    }
    btn.disabled = true;
    status.textContent = 'Saving...';
    status.style.color = '#555';
    try {
      await saveEntry('Letters', name, currentParams);
      status.textContent = 'Saved! Your letter walk has been recorded.';
      status.style.color = '#060';
    } catch (err) {
      status.textContent = 'Something went wrong. Please try again.';
      status.style.color = '#c00';
    } finally {
      btn.disabled = false;
    }
  });
}

window.addEventListener('DOMContentLoaded', function() {
  initCanvas();
  buildLetterPicker();
  buildSliders();
  updateDrawTime();
  setupSeedAndRandomizeButtons();
  setupSubmit();
  redraw();
});
