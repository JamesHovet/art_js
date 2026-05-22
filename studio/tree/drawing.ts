export {};

import { makeRng, randInt } from '../shared/seededRandom';

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

export const PARAM_CONFIG = {
  scale: {
    default: 230,
    min: 180,
    max: 250,
    step: 5
  },
  ringWidthFactor: {
    default: 0.65,
    min: 0,
    max: 1,
    step: 0.01
  },
  numCircles: {
    default: 26,
    min: 1,
    max: 75,
    step: 1
  },
  favorabilityContribution: {
    default: 1,
    min: 0,
    max: 1,
    step: 0.01
  },
  gaussianContribution: {
    default: 1,
    min: 0,
    max: 2,
    step: 0.01
  },
  noiseContribution: {
    default: 1,
    min: 0,
    max: 2,
    step: 0.01
  },
  tempMin: {
    default: -10,
    min: -30,
    max: 20,
    step: 1
  },
  tempMax: {
    default: 30,
    min: 10,
    max: 50,
    step: 1
  },
  tempContribution: {
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.05
  },
  dewMin: {
    default: -20,
    min: -40,
    max: 10,
    step: 1
  },
  dewMax: {
    default: 20,
    min: 5,
    max: 40,
    step: 1
  },
  dewContribution: {
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.05
  },
  fineDetailFreq: {
    default: 1.0,
    min: 1,
    max: 30,
    step: 0.5
  },
  fineDetailAmp: {
    default: 1,
    min: 0,
    max: 3,
    step: 0.01
  },
  mediumDetailFreq: {
    default: 3.5,
    min: 0.5,
    max: 15,
    step: 0.5
  },
  mediumDetailAmp: {
    default: 0.31,
    min: 0,
    max: 1,
    step: 0.01
  },
  coarseDetailFreq: {
    default: 1.6,
    min: 0.1,
    max: 5,
    step: 0.1
  },
  coarseDetailAmp: {
    default: 0.55,
    min: 0,
    max: 1,
    step: 0.01
  },
  fineRingOffset: {
    default: 2.0,
    min: 0,
    max: 20,
    step: 0.05
  },
  mediumRingOffset: {
    default: 20.0,
    min: 0,
    max: 20,
    step: 0.05
  },
  coarseRingOffset: {
    default: 0.0,
    min: 0,
    max: 20,
    step: 0.05
  },
  noiseOctaves: {
    default: 4,
    min: 1,
    max: 4,
    step: 1
  },
  smoothingBase: {
    default: 4,
    min: 0,
    max: 20,
    step: 1
  },
  smoothingInner: {
    default: 30,
    min: 0,
    max: 30,
    step: 1
  },
  smoothingFalloff: {
    default: 4.5,
    min: 1,
    max: 20,
    step: 0.5
  },
  noiseSeed: {
    default: Math.floor(Math.random() * 1000000),
    min: 0,
    max: 999999,
    step: 1
  },
  gaussianSeed: {
    default: Math.floor(Math.random() * 1000000),
    min: 0,
    max: 999999,
    step: 1
  },
  gaussianCountMin: {
    default: 1,
    min: 1,
    max: 10,
    step: 1
  },
  gaussianCountMax: {
    default: 6,
    min: 1,
    max: 10,
    step: 1
  },
  gaussianSigmaMin: {
    default: 0.3,
    min: 0.1,
    max: 3,
    step: 0.1
  },
  gaussianSigmaMax: {
    default: 0.9,
    min: 0.1,
    max: 3,
    step: 0.1
  },
  gaussianAmplitudeMin: {
    default: 0.1,
    min: 0,
    max: 5,
    step: 0.1
  },
  gaussianAmplitudeMax: {
    default: 1.7,
    min: 0,
    max: 5,
    step: 0.1
  },
  gaussianYFromMinRange: {
    default: 0,
    min: 0,
    max: 100,
    step: 1
  },
  gaussianYFromMaxRange: {
    default: 20,
    min: 0,
    max: 100,
    step: 1
  }
};

// ===== MATH FUNCTIONS (verbatim from projects/tree/tree.ts) =====

class PerlinNoise1D {
  private permutation: number[];

  constructor(seed: number = 0) {
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    for (let i = 255; i > 0; i--) {
      const randomSeed = Math.sin(seed + i) * 10000;
      const j = Math.floor((randomSeed - Math.floor(randomSeed)) * (i + 1));
      const tmp = this.permutation[i];
      this.permutation[i] = this.permutation[j];
      this.permutation[j] = tmp;
    }

    this.permutation = this.permutation.concat(this.permutation);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number): number {
    return (hash & 1) === 0 ? x : -x;
  }

  noise(x: number): number {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);

    const a = this.permutation[X];
    const b = this.permutation[X + 1];

    return this.lerp(this.grad(a, x), this.grad(b, x - 1), u);
  }

  octaveNoise(x: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function remap(t: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
  return newMin + (t - oldMin) / (oldMax - oldMin) * (newMax - newMin);
}

function smoothRingRadii(radii: number[], windowSize: number): number[] {
  if (windowSize === 0) return radii;

  const smoothed: number[] = [];
  const n = radii.length;

  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -windowSize; j <= windowSize; j++) {
      const index = (i + j + n) % n;
      sum += radii[index];
      count++;
    }

    smoothed.push(sum / count);
  }

  return smoothed;
}

function calculateRingWidth(currentRingIndex: number, favorability: number): number {
  const t = currentRingIndex + 1;
  const c = favorability;

  return Math.sqrt(c * t) - Math.sqrt(c * (t - 1));
}

function calculateFavorabilityFromWeather(weatherDataPoint: WeatherDataPoint, params: TreeParams): number {
  const temp = weatherDataPoint.temperature_2m_mean;
  const dew = weatherDataPoint.dew_point_2m_mean;

  if (typeof temp !== 'number' || typeof dew !== 'number') return 0.5;

  const normalizedTemp = Math.max(0, Math.min(1, (temp - params.tempMin) / (params.tempMax - params.tempMin)));
  const normalizedDew = Math.max(0, Math.min(1, (dew - params.dewMin) / (params.dewMax - params.dewMin)));

  const totalContribution = params.tempContribution + params.dewContribution;
  if (totalContribution === 0) return 0.5;

  const favorability = (normalizedTemp * params.tempContribution + normalizedDew * params.dewContribution) / totalContribution;

  return Math.max(0.1, Math.min(1.0, favorability));
}

function gaussian2D(x: number, y: number, sigma: number): number {
  const coefficient = 1 / (2 * Math.PI * sigma * sigma);
  const exponent = -(x * x + y * y) / (2 * sigma * sigma);
  return coefficient * Math.exp(exponent);
}

function polarToCartesian(allCirclesRadii: number[][], circleIndex: number, pointIndex: number, scaleFactor: number): { x: number; y: number } {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = 25 + (CANVAS_HEIGHT - 75) / 2;
  const angle = (pointIndex / NUM_CIRCLE_POINTS) * Math.PI * 2;
  const r = allCirclesRadii[circleIndex][pointIndex] * scaleFactor;

  return {
    x: centerX + Math.cos(angle) * r,
    y: centerY + Math.sin(angle) * r
  };
}

// ===== NEW: seeded gaussian generation =====

export function generateGaussians(params: TreeParams): GaussianParams[] {
  const rng = makeRng(params.gaussianSeed);
  const countMin = Math.min(params.gaussianCountMin, params.gaussianCountMax);
  const countMax = Math.max(params.gaussianCountMin, params.gaussianCountMax);
  const count = randInt(rng, countMin, countMax + 1);
  return Array.from({ length: count }, () => {
    const minGap = 3;
    const yFromMin = rng() * (params.gaussianYFromMaxRange - params.gaussianYFromMinRange - minGap) + params.gaussianYFromMinRange;
    const yFromMax = rng() * (params.gaussianYFromMaxRange - yFromMin - minGap) + (yFromMin + minGap);
    return {
      centerAngle: rng() * Math.PI * 2,
      yRemapFrom: [yFromMin, yFromMax] as [number, number],
      sigma: rng() * (params.gaussianSigmaMax - params.gaussianSigmaMin) + params.gaussianSigmaMin,
      amplitude: rng() * (params.gaussianAmplitudeMax - params.gaussianAmplitudeMin) + params.gaussianAmplitudeMin,
    };
  });
}

export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 576;
const NUM_CIRCLE_POINTS = 500;

export function generateCirclePoints(params: TreeParams, weatherData: WeatherDataPoint[]): number[][] {
  const allCirclesRadii: number[][] = [];
  const perlinNoise = new PerlinNoise1D(params.noiseSeed);
  const gaussianList = generateGaussians(params);

  function getRadialNoise(angle: number, ringIndex: number): number {
    const persistence = 0.5;

    const sampleCircular = (frequency: number, ringOffset: number): number => {
      const offset = ringIndex * ringOffset;
      const x = Math.cos(angle) * frequency + offset;
      const y = Math.sin(angle) * frequency + offset * 1.5;

      const noiseX = perlinNoise.octaveNoise(x, params.noiseOctaves, persistence);
      const noiseY = perlinNoise.octaveNoise(y, params.noiseOctaves, persistence);

      return noiseX + noiseY;
    };

    const fineNoiseRaw = sampleCircular(params.fineDetailFreq, params.fineRingOffset);
    const fineNoise = ((fineNoiseRaw + 1) / 2) * params.fineDetailAmp;

    const mediumNoiseRaw = sampleCircular(params.mediumDetailFreq, params.mediumRingOffset);
    const mediumNoise = ((mediumNoiseRaw + 1) / 2) * params.mediumDetailAmp;

    const coarseNoiseRaw = sampleCircular(params.coarseDetailFreq, params.coarseRingOffset);
    const coarseNoise = ((coarseNoiseRaw + 1) / 2) * params.coarseDetailAmp;

    return fineNoise + mediumNoise + coarseNoise;
  }

  // Generate favorability scores
  const favorabilityScores: number[] = [];
  if (weatherData && weatherData.length > 0) {
    for (let i = 0; i < params.numCircles; i++) {
      if (i < weatherData.length) {
        favorabilityScores.push(calculateFavorabilityFromWeather(weatherData[i], params));
      } else {
        favorabilityScores.push(0.5);
      }
    }
  } else {
    for (let i = 0; i < params.numCircles; i++) {
      favorabilityScores.push(0.5);
    }
  }

  const biologicalWidths: number[] = [];
  const linearWidths: number[] = [];

  for (let i = 0; i < params.numCircles; i++) {
    const baseFavorability = 1.0;
    biologicalWidths.push(calculateRingWidth(i, baseFavorability));
    linearWidths.push(baseFavorability);
  }

  const totalBiologicalWidth = biologicalWidths.reduce((sum, w) => sum + w, 0);
  const totalLinearWidth = linearWidths.reduce((sum, w) => sum + w, 0);
  const linearScale = totalBiologicalWidth / totalLinearWidth;

  for (let ringIndex = 0; ringIndex < params.numCircles; ringIndex++) {
    const circleRadii: number[] = [];

    const biologicalWidth = biologicalWidths[ringIndex];
    const linearWidth = linearWidths[ringIndex] * linearScale;
    const interpolatedWidth = lerp(biologicalWidth, linearWidth, params.ringWidthFactor);
    const baseRingWidth = interpolatedWidth;

    const favorability = favorabilityScores[ringIndex];
    const adjustedFavorability = lerp(1.0, favorability, params.favorabilityContribution);

    for (let i = 0; i < NUM_CIRCLE_POINTS; i++) {
      const theta = (i / NUM_CIRCLE_POINTS) * Math.PI * 2;

      let ringContribution = baseRingWidth;

      for (const gaussian of gaussianList) {
        let angleDiff = theta - gaussian.centerAngle;

        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const yRemapToMin = -3 * gaussian.sigma;
        const yRemapToMax = 3 * gaussian.sigma;
        const y = remap(ringIndex, gaussian.yRemapFrom[0], gaussian.yRemapFrom[1],
                        yRemapToMin, yRemapToMax);

        ringContribution += gaussian2D(angleDiff, y, gaussian.sigma) * gaussian.amplitude * params.gaussianContribution;
      }

      const noise = getRadialNoise(theta, ringIndex);
      ringContribution += noise * params.noiseContribution;

      ringContribution *= adjustedFavorability;

      let r: number;
      if (ringIndex === 0) {
        r = ringContribution;
      } else {
        const previousR = allCirclesRadii[ringIndex - 1][i];
        r = previousR + ringContribution;
      }

      circleRadii.push(r);
    }

    const ringProgress = ringIndex / (params.numCircles - 1);
    const falloffCurve = Math.pow(1 - ringProgress, params.smoothingFalloff);
    const adaptiveSmoothing = Math.round(params.smoothingBase + falloffCurve * params.smoothingInner);

    const smoothedRadii = smoothRingRadii(circleRadii, adaptiveSmoothing);

    allCirclesRadii.push(smoothedRadii);
  }

  return allCirclesRadii;
}

export function draw(ctx: CanvasRenderingContext2D, params: TreeParams, weatherData: WeatherDataPoint[]): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.rect(25, 25, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 75);
  ctx.stroke();

  const allCirclesRadii = generateCirclePoints(params, weatherData);

  let maxRadius = 0;
  for (const cr of allCirclesRadii) for (const r of cr) maxRadius = Math.max(maxRadius, r);
  const scaleFactor = maxRadius > 0 ? params.scale / maxRadius : 1;

  ctx.lineWidth = 1;
  for (let ci = 0; ci < allCirclesRadii.length; ci++) {
    const cr = allCirclesRadii[ci];
    if (cr.length === 0) continue;
    ctx.beginPath();
    const fp = polarToCartesian(allCirclesRadii, ci, 0, scaleFactor);
    ctx.moveTo(fp.x, fp.y);
    for (let i = 1; i < cr.length; i++) {
      const p = polarToCartesian(allCirclesRadii, ci, i, scaleFactor);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(fp.x, fp.y);
    ctx.stroke();
  }
}

export function buildSVGPath(params: TreeParams, weatherData: WeatherDataPoint[]): string {
  const allCirclesRadii = generateCirclePoints(params, weatherData);
  let maxRadius = 0;
  for (const cr of allCirclesRadii) for (const r of cr) maxRadius = Math.max(maxRadius, r);
  const scaleFactor = maxRadius > 0 ? params.scale / maxRadius : 1;

  let d = '';
  for (let ci = 0; ci < allCirclesRadii.length; ci++) {
    const cr = allCirclesRadii[ci];
    if (cr.length === 0) continue;
    const fp = polarToCartesian(allCirclesRadii, ci, 0, scaleFactor);
    d += 'M ' + fp.x.toFixed(2) + ' ' + fp.y.toFixed(2) + ' ';
    for (let i = 1; i < cr.length; i++) {
      const p = polarToCartesian(allCirclesRadii, ci, i, scaleFactor);
      d += 'L ' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ' ';
    }
    d += 'Z ';
  }
  return d;
}
