import { makeRng } from '../shared/seededRandom';
import { generateCirclePoints, TreeParams, WeatherDataPoint } from '../tree/drawing';
import { buildSVGPath as buildLettersPath, LettersParams } from '../letters/drawing';
import { SpiralParams } from '../spiral/drawing';
import { TREE_DESCRIPTION, LETTERS_DESCRIPTION, SPIRAL_DESCRIPTION, renderDescription } from '../shared/descriptions';

const CX = 576 / 2;             // 288 — horizontal center
const CY = 25 + (576 - 75) / 2; // 275.5 — vertical center of original drawing area
const INV_SQRT2 = 1 / Math.sqrt(2);
const PAUSE_MS = 500;

// ---- Spiral: inline math, no threejs dependency ----
function spiralPoint(t: number, p: SpiralParams): [number, number] {
  const r = t * 0.015;
  const x = r * Math.cos(t);
  const y = r * Math.sin(t);
  const z = Math.cos(p.param1 * r * Math.cos(t + Math.PI * p.param2)) * p.param3
           + Math.sin(p.param4 * r * Math.sin(t + Math.PI * p.param5)) * p.param6;
  return [y * 60 + CX, -(x + z) * INV_SQRT2 * 60 + CY];
}

// ---- Tree: ring points for progressive animation ----
function buildRingPoints(ring: number[], scaleFactor: number): Array<[number, number]> {
  const n = ring.length;
  const pts: Array<[number, number]> = [[CX + ring[0] * scaleFactor, CY]];
  for (let i = 1; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    pts.push([CX + Math.cos(angle) * ring[i] * scaleFactor, CY + Math.sin(angle) * ring[i] * scaleFactor]);
  }
  pts.push(pts[0]); // close the ring
  return pts;
}

// ---- Climate data generator ----
function generateClimateData(numRings: number, seed: number): WeatherDataPoint[] {
  const rng = makeRng(seed);
  const period1 = 3 + rng() * 8;
  const period2 = 10 + rng() * 20;
  const noiseScale = 0.2 + rng() * 0.35;

  return Array.from({ length: numRings }, (_, i) => {
    const signal = Math.max(-1, Math.min(1,
      Math.sin((i / period1) * Math.PI * 2) * 0.5 +
      Math.sin((i / period2) * Math.PI * 2) * 0.3 +
      (rng() - 0.5) * 2 * noiseScale
    ));
    return {
      year: 2000 - numRings + i,
      location: 'Studio',
      latitude: 45, longitude: -90,
      temperature_2m_mean: 10 + signal * 18,
      dew_point_2m_mean: 2 + signal * 14,
      relative_humidity_2m_mean: 60,
      precipitation_sum: 600,
    };
  });
}

// ---- Random param generators ----
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTreeParams(): TreeParams {
  const numCircles = randInt(20, 35);
  return {
    scale: 237,
    ringWidthFactor: rand(0.4, 0.8),
    numCircles,
    favorabilityContribution: rand(0.6, 0.9),
    gaussianContribution: rand(0.4, 1.2),
    noiseContribution: rand(0.4, 1.2),
    tempMin: -10, tempMax: 30, tempContribution: 0.5,
    dewMin: -20, dewMax: 20, dewContribution: 0.5,
    fineDetailFreq: rand(2, 12),
    fineDetailAmp: rand(0.3, 1.5),
    mediumDetailFreq: rand(2, 7),
    mediumDetailAmp: rand(0.05, 0.3),
    coarseDetailFreq: rand(0.5, 2),
    coarseDetailAmp: rand(0.1, 0.5),
    fineRingOffset: rand(1, 5),
    mediumRingOffset: rand(5, 20),
    coarseRingOffset: 0,
    noiseOctaves: 4,
    smoothingBase: randInt(2, 8),
    smoothingInner: randInt(15, 30),
    smoothingFalloff: 4.5,
    noiseSeed: randInt(0, 999999),
    gaussianSeed: randInt(0, 999999),
    gaussianCountMin: randInt(1, 3),
    gaussianCountMax: randInt(4, 9),
    gaussianSigmaMin: rand(0.2, 0.8),
    gaussianSigmaMax: rand(0.9, 2.0),
    gaussianAmplitudeMin: rand(0.3, 0.8),
    gaussianAmplitudeMax: rand(1.2, 2.5),
    gaussianYFromMinRange: 0,
    gaussianYFromMaxRange: numCircles,
  };
}

function randomLettersParams(): LettersParams {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return {
    letter: alphabet[Math.floor(Math.random() * 26)],
    numLines: randInt(1500, 2500),
    lineLength: rand(3, 8),
    gaussianStdDev: rand(0.15, 0.45),
    seed: randInt(0, 999999),
  };
}

function randomSpiralParams(): SpiralParams {
  return {
    param1: rand(2, 9), param2: rand(0, 2), param3: rand(0.2, 0.8),
    param4: rand(2, 9), param5: rand(0, 2), param6: rand(0.2, 0.8),
  };
}

// ---- Tree: ring-by-ring progressive animation ----
function animateTreeRings(containerEl: SVGGElement, params: TreeParams): void {
  const climateSeed = randInt(0, 999999);
  const weatherData = generateClimateData(params.numCircles, climateSeed);
  const allRings = generateCirclePoints(params, weatherData);

  let maxRadius = 0;
  for (const ring of allRings) for (const r of ring) maxRadius = Math.max(maxRadius, r);
  const scaleFactor = maxRadius > 0 ? params.scale / maxRadius : 1;

  while (containerEl.firstChild) containerEl.removeChild(containerEl.firstChild);

  const numRings = allRings.length;
  const msPerRing = Math.round(6000 / numRings);

  const pathEls = allRings.map(() => {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', 'black');
    pathEl.setAttribute('stroke-width', '1');
    containerEl.appendChild(pathEl);
    return pathEl;
  });

  function animateRing(ringIdx: number): void {
    if (ringIdx >= numRings) {
      setTimeout(() => animateTreeRings(containerEl, randomTreeParams()), PAUSE_MS);
      return;
    }
    runProgressiveAnimation(
      pathEls[ringIdx],
      buildRingPoints(allRings[ringIdx], scaleFactor),
      msPerRing,
      () => animateRing(ringIdx + 1)
    );
  }

  animateRing(0);
}

// ---- Progressive path-building animation ----
// Incrementally appends L commands each rAF frame. No stroke-dashoffset, no
// getTotalLength() — completely bypasses iOS Safari CSS transition/SVG quirks.
function runProgressiveAnimation(
  pathEl: SVGPathElement,
  points: Array<[number, number]>,
  drawMs: number,
  onComplete: () => void
): void {
  if (points.length === 0) { onComplete(); return; }

  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  pathEl.setAttribute('d', d);
  let lastIdx = 0;
  let startTime: number | null = null;

  function frame(ts: number): void {
    if (startTime === null) startTime = ts;
    const progress = Math.min(1, (ts - startTime) / drawMs);
    const targetIdx = Math.min(points.length - 1, Math.floor(progress * points.length));

    for (let i = lastIdx + 1; i <= targetIdx; i++) {
      d += ` L ${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`;
    }
    if (targetIdx > lastIdx) {
      pathEl.setAttribute('d', d);
      lastIdx = targetIdx;
    }

    if (progress < 1) requestAnimationFrame(frame);
    else onComplete();
  }

  requestAnimationFrame(frame);
}

// ---- Letters: parse walk path into points, then animate progressively ----
function parsePolylinePath(d: string): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const re = /[ML]\s*([\d.]+)\s+([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    pts.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  return pts;
}

function animateLettersPath(pathEl: SVGPathElement, drawMs: number, initialDelay: number): void {
  function cycle(): void {
    const raw = buildLettersPath(randomLettersParams());
    if (!raw) { setTimeout(cycle, 1000); return; }
    const points = parsePolylinePath(raw);
    if (points.length === 0) { setTimeout(cycle, 1000); return; }
    runProgressiveAnimation(pathEl, points, drawMs, () => setTimeout(cycle, PAUSE_MS));
  }
  setTimeout(cycle, initialDelay);
}

// ---- Spiral: compute points directly, animate progressively ----
function animateSpiralPath(pathEl: SVGPathElement, drawMs: number, initialDelay: number): void {
  const NUM_CYCLES = 40;
  const PTS_PER_CYCLE = 150;

  function cycle(): void {
    const params = randomSpiralParams();
    const points: Array<[number, number]> = [];
    for (let c = 0; c < NUM_CYCLES; c++) {
      for (let i = 0; i < PTS_PER_CYCLE; i++) {
        points.push(spiralPoint((c + i / PTS_PER_CYCLE) * Math.PI * 2, params));
      }
    }
    runProgressiveAnimation(pathEl, points, drawMs, () => setTimeout(cycle, PAUSE_MS));
  }
  setTimeout(cycle, initialDelay);
}

document.addEventListener('DOMContentLoaded', () => {
  const treeRingsEl   = document.getElementById('tree-rings')   as unknown as SVGGElement;
  const lettersPathEl = document.getElementById('letters-path') as unknown as SVGPathElement;
  const spiralPathEl  = document.getElementById('spiral-path')  as unknown as SVGPathElement;

  renderDescription(TREE_DESCRIPTION,    document.getElementById('tree-desc')!,    'artwork-description');
  renderDescription(LETTERS_DESCRIPTION, document.getElementById('letters-desc')!, 'artwork-description');
  renderDescription(SPIRAL_DESCRIPTION,  document.getElementById('spiral-desc')!,  'artwork-description');

  animateTreeRings(treeRingsEl, randomTreeParams());
  animateLettersPath(lettersPathEl, 5600, 1500);
  animateSpiralPath(spiralPathEl, 5600, 2500);
});
