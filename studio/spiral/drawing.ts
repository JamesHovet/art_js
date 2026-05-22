import { Matrix4, Vector3 } from 'threejs-math';

export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 576;

export interface SpiralParams {
  param1: number;
  param2: number;
  param3: number;
  param4: number;
  param5: number;
  param6: number;
}

export const PARAM_CONFIG: Record<keyof SpiralParams, { default: number; min: number; max: number; step: number }> = {
  param1: { default: 7.5, min: 1, max: 10, step: 0.1 },
  param2: { default: 1.0, min: 0, max: 2, step: 0.01 },
  param3: { default: 0.5, min: 0, max: 1, step: 0.01 },
  param4: { default: 7.5, min: 1, max: 10, step: 0.1 },
  param5: { default: 1.0, min: 0, max: 2, step: 0.01 },
  param6: { default: 0.5, min: 0, max: 1, step: 0.01 },
};

function transformPoint(t: number, params: SpiralParams): Vector3 {
  const { param1, param2, param3, param4, param5, param6 } = params;
  const r = t * 0.015;
  const x = r * Math.cos(t);
  const y = r * Math.sin(t);
  const z =
    Math.cos(param1 * r * Math.cos(t + Math.PI * param2)) * param3 +
    Math.sin(param4 * r * Math.sin(t + Math.PI * param5)) * param6;

  const worldSpaceCoordinate = new Vector3(x, y, z);

  const scale = new Matrix4();
  scale.scale(new Vector3(60, 60, 1));

  const rotationX = new Matrix4();
  rotationX.makeRotationX(Math.PI / 4);

  const rotationZ = new Matrix4();
  rotationZ.makeRotationZ(-Math.PI / 2);

  const translation = new Matrix4();
  translation.makeTranslation(CANVAS_WIDTH / 2, 25 + (CANVAS_HEIGHT - 75) / 2, 0);

  return worldSpaceCoordinate
    .clone()
    .applyMatrix4(rotationZ)
    .applyMatrix4(rotationX)
    .applyMatrix4(scale)
    .applyMatrix4(translation);
}

export function drawBorder(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.strokeRect(25, 25, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 75);
  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, params: SpiralParams): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.5;

  const numCyclesOfTwoPi = 40;
  const numPointsPerCycle = 500;

  ctx.beginPath();
  let isFirstPoint = true;

  for (let c = 0; c < numCyclesOfTwoPi; c++) {
    for (let i = 0; i < numPointsPerCycle; i++) {
      const t = c * Math.PI * 2 + (i / numPointsPerCycle) * Math.PI * 2;
      const pt = transformPoint(t, params);

      if (isFirstPoint) {
        ctx.moveTo(pt.x, pt.y);
        isFirstPoint = false;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
  }

  ctx.stroke();
}

export function buildSVGPath(params: SpiralParams): string {
  const numCyclesOfTwoPi = 40;
  const numPointsPerCycle = 1000;

  let pathData = '';
  let isFirstPoint = true;

  for (let c = 0; c < numCyclesOfTwoPi; c++) {
    for (let i = 0; i < numPointsPerCycle; i++) {
      const t = c * Math.PI * 2 + (i / numPointsPerCycle) * Math.PI * 2;
      const pt = transformPoint(t, params);

      if (isFirstPoint) {
        pathData += `M ${pt.x} ${pt.y} `;
        isFirstPoint = false;
      } else {
        pathData += `L ${pt.x} ${pt.y} `;
      }
    }
  }

  return pathData;
}
