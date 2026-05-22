import { makeRng, gaussianRandom } from '../shared/seededRandom';

export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 576;

export interface LettersParams {
  letter: string;        // single uppercase char A-Z or 0-9
  numLines: number;
  lineLength: number;
  gaussianStdDev: number;
  seed: number;
}

export const PARAM_CONFIG = {
  numLines:       { default: 3000, min: 1500, max: 7000,   step: 100  },
  lineLength:     { default: 5,    min: 1,    max: 15,      step: 0.05 },
  gaussianStdDev: { default: 0.3,  min: 0.1,  max: 1.0,    step: 0.01 },
  seed:           { default: 42,   min: 0,    max: 999999,  step: 1    },
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

function isInLetter(vctx: CanvasRenderingContext2D, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT) return false;
  const d = vctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
  return (d[0] + d[1] + d[2]) / 3 < 128;
}

function runWalk(params: LettersParams): Array<[number, number]> {
  const { letter, numLines, lineLength, gaussianStdDev, seed } = params;
  const rng = makeRng(seed);
  const vc = makeVirtualCanvas(letter);
  const vctx = vc.getContext('2d')!;

  // find start point inside letter
  let sx = CANVAS_WIDTH / 2, sy = CANVAS_HEIGHT / 2;
  for (let i = 0; i < 10000; i++) {
    const tx = rng() * CANVAS_WIDTH;
    const ty = rng() * CANVAS_HEIGHT;
    if (isInLetter(vctx, tx, ty)) { sx = tx; sy = ty; break; }
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
      if (isInLetter(vctx, nx, ny)) {
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

  // border rect (25, 25, 526, 476)
  ctx.beginPath();
  ctx.rect(25, 25, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 75);
  ctx.stroke();

  const points = runWalk(params);
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.lineWidth = 0.5;
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
}

export function buildSVGPath(params: LettersParams): string {
  const points = runWalk(params);
  if (points.length === 0) return '';
  let d = 'M ' + points[0][0].toFixed(2) + ' ' + points[0][1].toFixed(2);
  for (let i = 1; i < points.length; i++) {
    d += ' L ' + points[i][0].toFixed(2) + ' ' + points[i][1].toFixed(2);
  }
  return d;
}
