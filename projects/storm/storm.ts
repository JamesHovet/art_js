import {getLetterOffset, getLetterSVGPath} from "../../shared/letterSvgPaths";

const PARAM_CONFIG = {
  eyeRadius:          { default: 23,   min: 1,    max: 250,  step: 1,    decimals: 0, label: 'Eye Radius' },
  eyewallRadius:      { default: 50,   min: 1,    max: 400,  step: 1,    decimals: 0, label: 'Eyewall Radius' },
  eyewallWidth:       { default: 48,   min: 1,    max: 200,  step: 1,    decimals: 0, label: 'Eyewall Width' },
  eyewallDominance:   { default: 0.62, min: 0.0,  max: 1.0,  step: 0.01, decimals: 2, label: 'Eyewall Dominance' },
  outerDecay:         { default: 196,  min: 1,    max: 800,  step: 5,    decimals: 0, label: 'Outer Decay' },
  spiralTightness:    { default: 1.55, min: 0.0,  max: 8.0,  step: 0.05, decimals: 2, label: 'Spiral Tightness' },
  numArms:            { default: 5,    min: 1,    max: 16,   step: 1,    decimals: 0, label: 'Arms' },
  innerSharpness:     { default: 2.20, min: 0.05, max: 30.0, step: 0.05, decimals: 2, label: 'Inner Sharpness' },
  outerSharpness:     { default: 0.1,  min: 0.05, max: 50.0, step: 0.5,  decimals: 1, label: 'Outer Sharpness' },
  sharpnessScale:     { default: 91,   min: 1,    max: 600,  step: 5,    decimals: 0, label: 'Sharpness Scale' },
  harmonicAmp:        { default: 0.95, min: 0.0,  max: 3.0,  step: 0.05, decimals: 2, label: 'Harmonic Amp' },
  rotation:           { default: 0.0,  min: 0.0,  max: 6.28, step: 0.01, decimals: 2, label: 'Rotation' },
  falloffInner:       { default: 60,   min: 0,    max: 500,  step: 5,    decimals: 0, label: 'Falloff Inner R' },
  falloffOuter:       { default: 370,  min: 10,   max: 700,  step: 5,    decimals: 0, label: 'Falloff Outer R' },
  falloffCurve:       { default: 3.5,  min: 0.1,  max: 8.0,  step: 0.1,  decimals: 1, label: 'Falloff Curve' },
  densityGamma:       { default: 1.10, min: 0.1,  max: 5.0,  step: 0.05, decimals: 2, label: 'Density Gamma' },
  armWidthVar:        { default: 0.0,  min: 0.0,  max: 25.0, step: 0.1,  decimals: 1, label: 'Arm Width Var' },
  armBrightVar:       { default: 0.27, min: 0.0,  max: 1.0,  step: 0.01, decimals: 2, label: 'Arm Bright Var' },
  randSeed:           { default: 3371, min: 1,    max: 9999, step: 1,    decimals: 0, label: 'Random Seed' },
  outwardLean:        { default: 0.79, min: 0.0,  max: 2.0,  step: 0.01, decimals: 2, label: 'Outward Lean' },
  pointGridN:         { default: 195,  min: 10,   max: 500,  step: 5,    decimals: 0, label: 'Point Grid' },
  lineLength:         { default: 18,   min: 1,    max: 60,   step: 1,    decimals: 0, label: 'Line Length' },
  scatterThreshold:   { default: 0.56, min: 0.0,  max: 0.9,  step: 0.01, decimals: 2, label: 'Scatter Floor' },
  scatterRate:        { default: 0.37, min: 0.0,  max: 1.0,  step: 0.01, decimals: 2, label: 'Scatter Rate' },
  armThreshold:       { default: 0.06, min: 0.0,  max: 0.2,  step: 0.001, decimals: 3, label: 'Arm Threshold' },
  armRate:            { default: 2.27, min: 0.0,  max: 3.0,  step: 0.01, decimals: 2, label: 'Arm Rate' },
  sectorN:            { default: 24,   min: 1,    max: 80,   step: 1,    decimals: 0, label: 'Sector Count' },
  squeezeAspect:      { default: 1.0,  min: 0.2,  max: 5.0,  step: 0.05, decimals: 2, label: 'Aspect Ratio' },
  squeezeAngle:       { default: 0.0,  min: 0.0,  max: 6.28, step: 0.01, decimals: 2, label: 'Angle' },
  stormScale:         { default: 1.0,  min: 0.1,  max: 5.0,  step: 0.05, decimals: 2, label: 'Scale' },
  centerHoleInner:    { default: 0,    min: 0,    max: 400,  step: 5,    decimals: 0, label: 'Hole Inner R' },
  centerHoleOuter:    { default: 80,   min: 0,    max: 600,  step: 5,    decimals: 0, label: 'Hole Outer R' },
  centerHoleAmt:      { default: 0.0,  min: 0.0,  max: 2.0,  step: 0.01, decimals: 2, label: 'Hole Amount' },
  noiseSeed:          { default: 1,    min: 1,    max: 9999, step: 1,    decimals: 0, label: 'Noise Seed' },
  noiseScale:         { default: 40,   min: 20,   max: 2000, step: 10,   decimals: 0, label: 'Scale (px)' },
  noiseLacunarity:    { default: 2.0,  min: 1.2,  max: 4.0,  step: 0.05, decimals: 2, label: 'Lacunarity' },
  noiseOctaves:       { default: 8,    min: 1,    max: 8,    step: 1,    decimals: 0, label: 'Octaves' },
  noiseWeight:        { default: -0.08, min: -2.0, max: 2.0, step: 0.01, decimals: 2, label: 'Weight' },
  noiseOffsetX:       { default: 0,    min: -2000, max: 2000, step: 10,  decimals: 0, label: 'Offset X' },
  noiseOffsetY:       { default: 0,    min: -2000, max: 2000, step: 10,  decimals: 0, label: 'Offset Y' },
  noiseDirAmp:        { default: 0.0,  min: 0.0,   max: 3.0,  step: 0.05, decimals: 2, label: 'Dir Distort' },
};

let eyeRadius         = PARAM_CONFIG.eyeRadius.default;
let eyewallRadius     = PARAM_CONFIG.eyewallRadius.default;
let eyewallWidth      = PARAM_CONFIG.eyewallWidth.default;
let eyewallDominance  = PARAM_CONFIG.eyewallDominance.default;
let outerDecay        = PARAM_CONFIG.outerDecay.default;
let spiralTightness   = PARAM_CONFIG.spiralTightness.default;
let numArms           = PARAM_CONFIG.numArms.default;
let innerSharpness    = PARAM_CONFIG.innerSharpness.default;
let outerSharpness    = PARAM_CONFIG.outerSharpness.default;
let sharpnessScale    = PARAM_CONFIG.sharpnessScale.default;
let harmonicAmp       = PARAM_CONFIG.harmonicAmp.default;
let rotation          = PARAM_CONFIG.rotation.default;
let falloffInner      = PARAM_CONFIG.falloffInner.default;
let falloffOuter      = PARAM_CONFIG.falloffOuter.default;
let falloffCurve      = PARAM_CONFIG.falloffCurve.default;
let densityGamma      = PARAM_CONFIG.densityGamma.default;
let armWidthVar       = PARAM_CONFIG.armWidthVar.default;
let armBrightVar      = PARAM_CONFIG.armBrightVar.default;
let randSeed          = PARAM_CONFIG.randSeed.default;
let outwardLean       = PARAM_CONFIG.outwardLean.default;
let pointGridN        = PARAM_CONFIG.pointGridN.default;
let lineLength        = PARAM_CONFIG.lineLength.default;
let scatterThreshold  = PARAM_CONFIG.scatterThreshold.default;
let scatterRate       = PARAM_CONFIG.scatterRate.default;
let armThreshold      = PARAM_CONFIG.armThreshold.default;
let armRate           = PARAM_CONFIG.armRate.default;
let sectorN           = PARAM_CONFIG.sectorN.default;
let squeezeAspect     = PARAM_CONFIG.squeezeAspect.default;
let squeezeAngle      = PARAM_CONFIG.squeezeAngle.default;
let stormScale        = PARAM_CONFIG.stormScale.default;
let centerHoleInner   = PARAM_CONFIG.centerHoleInner.default;
let centerHoleOuter   = PARAM_CONFIG.centerHoleOuter.default;
let centerHoleAmt     = PARAM_CONFIG.centerHoleAmt.default;
let noiseEnabled      = true;
let noiseSeed         = PARAM_CONFIG.noiseSeed.default;
let noiseScale        = PARAM_CONFIG.noiseScale.default;
let noiseLacunarity   = PARAM_CONFIG.noiseLacunarity.default;
let noiseOctaves      = PARAM_CONFIG.noiseOctaves.default;
let noiseWeight       = PARAM_CONFIG.noiseWeight.default; // -0.08
let noiseOffsetX      = PARAM_CONFIG.noiseOffsetX.default;
let noiseOffsetY      = PARAM_CONFIG.noiseOffsetY.default;
let noiseDirAmp       = PARAM_CONFIG.noiseDirAmp.default;
let noiseAmps         = [0.81, 0.27, 0.25, 0.13, 0.0, 0.0, 0.0, 0.0];

let showBorder = false;
let showDebug  = false;

type Line = { x1: number; y1: number; x2: number; y2: number; ring: number; sector: number; r: number };
let savedLines: Line[] = [];

const NUM_KNOTS = 6;

let armSharpOffsets: number[] = [];
let armBrightOffsets: number[] = [];
let lengthScaleKnots: number[] = [0.90, 0.55, 0.90, 2.15, 3.00, 3.00];

function makeLCG(seed: number): () => number {
  let s = Math.max(1, Math.round(seed)) | 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

// 2D Perlin noise — permutation table reshuffled from noiseSeed on each draw
const NOISE_PERM = new Uint8Array(512);
const NOISE_GRAD2: [number, number][] = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

function buildNoisePerm() {
  const table = Array.from({ length: 256 }, (_, i) => i);
  const rng = makeLCG(Math.max(1, Math.round(noiseSeed)));
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = table[i]; table[i] = table[j]; table[j] = tmp;
  }
  for (let i = 0; i < 512; i++) NOISE_PERM[i] = table[i & 255];
}

function perlin2d(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const aa = NOISE_PERM[NOISE_PERM[xi]     + yi];
  const ab = NOISE_PERM[NOISE_PERM[xi]     + yi + 1];
  const ba = NOISE_PERM[NOISE_PERM[xi + 1] + yi];
  const bb = NOISE_PERM[NOISE_PERM[xi + 1] + yi + 1];
  const dot = ([gx, gy]: [number, number], dx: number, dy: number) => gx * dx + gy * dy;
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  return lerp(
    lerp(dot(NOISE_GRAD2[aa & 7], xf,     yf),     dot(NOISE_GRAD2[ba & 7], xf - 1, yf),     u),
    lerp(dot(NOISE_GRAD2[ab & 7], xf,     yf - 1), dot(NOISE_GRAD2[bb & 7], xf - 1, yf - 1), u),
    v
  );
}

function evalNoise(cssX: number, cssY: number): number {
  const baseX = (cssX + noiseOffsetX) / noiseScale;
  const baseY = (cssY + noiseOffsetY) / noiseScale;
  let val = 0;
  let freq = 1;
  const maxOct = Math.min(Math.round(noiseOctaves), noiseAmps.length);
  for (let oct = 0; oct < maxOct; oct++) {
    if (noiseAmps[oct] !== 0) val += noiseAmps[oct] * perlin2d(baseX * freq, baseY * freq);
    freq *= noiseLacunarity;
  }
  return val;
}

function evalLengthScale(r: number): number {
  const t = Math.max(0, Math.min(1, r / KNOT_DOMAIN)) * (NUM_KNOTS - 1);
  const i = Math.min(Math.floor(t), NUM_KNOTS - 2);
  const u = t - i;
  // Clamp neighbours to valid range (replicates endpoints as phantom points)
  const p0 = lengthScaleKnots[Math.max(0, i - 1)];
  const p1 = lengthScaleKnots[i];
  const p2 = lengthScaleKnots[Math.min(NUM_KNOTS - 1, i + 1)];
  const p3 = lengthScaleKnots[Math.min(NUM_KNOTS - 1, i + 2)];
  const result = 0.5 * (
    2 * p1 +
    (-p0 + p2) * u +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u +
    (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u
  );
  return Math.max(0, result);
}

function recomputeArmOffsets() {
  const rng = makeLCG(randSeed);
  armSharpOffsets = [];
  armBrightOffsets = [];
  for (let k = 0; k < numArms; k++) {
    armSharpOffsets.push((rng() * 2 - 1) * armWidthVar);
    armBrightOffsets.push(1 + (rng() * 2 - 1) * armBrightVar);
  }
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let svgElement: SVGElement;
let densityPreviewCanvas: HTMLCanvasElement;
let isInitialized = false;
let controlsInitialized = false;

const CANVAS_WIDTH = 1344;
const CANVAS_HEIGHT = 1056;
const PREVIEW_WIDTH = 448;
const PREVIEW_HEIGHT = 352;
const CANVAS_BG = '#FDFCFA';
const BORDER_LEFT   = 25;
const BORDER_TOP    = 25;
const BORDER_RIGHT  = CANVAS_WIDTH  - 25;
const BORDER_BOTTOM = CANVAS_HEIGHT - 50;
const SCALE = CANVAS_WIDTH / 900; // normalises pixel-distance params to the reference canvas size
const KNOT_R_MAX = Math.sqrt((CANVAS_WIDTH / 2) ** 2 + (CANVAS_HEIGHT / 2) ** 2);
const KNOT_DOMAIN = KNOT_R_MAX * 0.6; // knots span 0–60% of canvas radius; value holds flat beyond that
const NUM_RINGS = 4;
const RING_BOUNDARIES = [0.2, 0.30, 0.45].map(f => KNOT_DOMAIN * f); // radii separating the 4 rings
// subtreeSize(r) = total nodes in a complete binary subtree rooted at ring r = 2^(NUM_RINGS-r) - 1
const SUBTREE_SIZES = Array.from({ length: NUM_RINGS }, (_, i) => (1 << (NUM_RINGS - i)) - 1);

function getSectorId(ring: number, sector: number): string {
  const parts: number[] = [];
  for (let level = 0; level <= ring; level++) {
    parts.push(Math.floor(sector / (1 << (ring - level))) + 1);
  }
  return parts.join('_');
}

function getRing(r: number): number {
  if (r < RING_BOUNDARIES[0]) return 0;
  if (r < RING_BOUNDARIES[1]) return 1;
  if (r < RING_BOUNDARIES[2]) return 2;
  return 3;
}

// Depth-first tree-order position for a (ring, sector) node.
// Ring-0 sector p0 owns a subtree of SUBTREE_SIZES[0] nodes; within that subtree the
// path from root to node is encoded in the lower `ring` bits of `sector`.
function treeOrderPosition(ring: number, sector: number): number {
  const a0 = sector >> ring;
  const local_s = sector & ((1 << ring) - 1);
  let localPos = 0;
  for (let depth = 0; depth < ring; depth++) {
    const bit = (local_s >> (ring - 1 - depth)) & 1;
    localPos += 1 + bit * SUBTREE_SIZES[depth + 1];
  }
  return a0 * SUBTREE_SIZES[0] + localPos;
}

// Streamline accumulated-angle lookup table — rebuilt on each draw from outwardLean
const THETA_TABLE_SIZE = 600;
const THETA_LOG_R_MIN = Math.log(1);
const THETA_LOG_R_MAX = Math.log(KNOT_R_MAX * 1.2);
let thetaAccTable = new Float64Array(THETA_TABLE_SIZE);

function rebuildThetaTable() {
  const halfWidth = CANVAS_WIDTH / 2;
  const K_MAX = 20; // cap spiral tightness (handles outwardLean→0 gracefully)
  const delta = (THETA_LOG_R_MAX - THETA_LOG_R_MIN) / (THETA_TABLE_SIZE - 1);
  let acc = 0;
  thetaAccTable[0] = 0;
  for (let i = 1; i < THETA_TABLE_SIZE; i++) {
    const r = Math.exp(THETA_LOG_R_MIN + i * delta);
    const t = outwardLean > 0 ? Math.min(1, outwardLean * r / halfWidth) : 0;
    const k = Math.min(K_MAX, Math.tan(Math.PI / 2 * (1 - t)));
    acc += k * delta; // integral of k d(log r)
    thetaAccTable[i] = acc;
  }
}

function lookupTheta(r: number): number {
  const delta = (THETA_LOG_R_MAX - THETA_LOG_R_MIN) / (THETA_TABLE_SIZE - 1);
  const logR = Math.max(THETA_LOG_R_MIN, Math.min(THETA_LOG_R_MAX, Math.log(r)));
  const frac = (logR - THETA_LOG_R_MIN) / delta;
  const i = Math.min(THETA_TABLE_SIZE - 2, Math.floor(frac));
  return thetaAccTable[i] * (1 - (frac - i)) + thetaAccTable[i + 1] * (frac - i);
}

function stormField(cssX: number, cssY: number): { density: number; dx: number; dy: number } {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const x = cssX - cx;
  const y = cssY - cy;
  const r = Math.sqrt(x * x + y * y);
  if (r < 0.1) return { density: 0, dx: 0, dy: 0 };

  const theta = Math.atan2(y, x);
  const phi = theta - spiralTightness * Math.log(r) + rotation;

  // All pixel-distance params are in 576-reference-space; multiply by SCALE for actual pixels
  const sEyeRadius     = eyeRadius     * SCALE;
  const sEyewallRadius = eyewallRadius * SCALE;
  const sEwSigma       = Math.max(0.5, eyewallWidth  * SCALE);
  const sOuterDecay    = Math.max(0.5, outerDecay    * SCALE);
  const sSharpScale    = Math.max(0.5, sharpnessScale * SCALE);
  const sFalloffInner  = falloffInner  * SCALE;
  const sFalloffOuter  = falloffOuter  * SCALE;

  // Radial envelope
  const eyeK = 4.0 / Math.max(0.5, sEyeRadius);
  const eyeFactor = 1 / (1 + Math.exp(-eyeK * (r - sEyeRadius)));

  const eyewallPeak = Math.exp(-((r - sEyewallRadius) ** 2) / (2 * sEwSigma ** 2));
  const outerBand   = Math.exp(-Math.max(0, r - sEyewallRadius) / sOuterDecay);

  const radial = eyeFactor * (eyewallPeak + 0.4 * outerBand);

  // Angular modulation
  const sharpBlend  = 1 - Math.exp(-r / sSharpScale);
  const baseSharpness = Math.max(0.01, innerSharpness + (outerSharpness - innerSharpness) * sharpBlend);

  const armIdx = (((Math.round(phi * numArms / (2 * Math.PI)) % numArms) + numArms) % numArms);
  const armSharpness = Math.max(0.01, baseSharpness + (armSharpOffsets[armIdx] ?? 0));
  const armBright    = Math.max(0, armBrightOffsets[armIdx] ?? 1);

  const cosMain = Math.cos(numArms * phi);
  const bandMain = armBright * Math.pow(Math.max(0, cosMain), armSharpness);

  const cosHarm = Math.cos(2 * numArms * phi);
  const bandHarm = harmonicAmp * armBright * Math.pow(Math.max(0, cosHarm), armSharpness * 1.5);

  const band = Math.min(1, bandMain + bandHarm);

  const ewBlendSigma = sEwSigma * 2;
  const ewBlend = eyewallDominance * Math.exp(-((r - sEyewallRadius) ** 2) / (2 * ewBlendSigma ** 2));
  const angular = ewBlend + (1 - ewBlend) * band;

  const falloffRange = Math.max(1, sFalloffOuter - sFalloffInner);
  const falloffT = Math.min(1, Math.max(0, (r - sFalloffInner) / falloffRange));
  const falloffMult = 1 - Math.pow(falloffT, falloffCurve);

  const noiseAdd = noiseEnabled ? evalNoise(cssX, cssY) * noiseWeight * falloffMult : 0;

  const sCenterHoleInner = centerHoleInner * SCALE;
  const sCenterHoleOuter = Math.max(sCenterHoleInner + 1, centerHoleOuter * SCALE);
  const holeDist = Math.min(1, Math.max(0, (r - sCenterHoleInner) / (sCenterHoleOuter - sCenterHoleInner)));
  const holeMask = 1 - holeDist * holeDist * (3 - 2 * holeDist); // smoothstep: 1 at inner, 0 at outer

  const clipped = Math.min(1, Math.max(0, radial * angular * falloffMult + noiseAdd));
  const rawDensity = Math.max(0, clipped - centerHoleAmt * holeMask);
  const density = rawDensity <= 0 ? 0 : Math.pow(rawDensity, densityGamma);

  // Wind: Rankine vortex blended toward radial outward with distance
  const speed = r < sEyewallRadius
    ? r / Math.max(0.5, sEyewallRadius)
    : Math.max(0.5, sEyewallRadius) / r;

  const t = Math.min(1, outwardLean * r / (CANVAS_WIDTH / 2));
  const windAngle = theta + Math.PI / 2 * (1 - t);
  return { density, dx: Math.cos(windAngle) * speed, dy: Math.sin(windAngle) * speed };
}

// Maps a canvas point into the storm's input coordinate space: scale → rotate → squeeze-y.
function squeezePoint(cssX: number, cssY: number): [number, number] {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const x = (cssX - cx) / stormScale;
  const y = (cssY - cy) / stormScale;
  const ca = Math.cos(squeezeAngle);
  const sa = Math.sin(squeezeAngle);
  const rx =  x * ca + y * sa;
  const ry = -x * sa + y * ca;
  return [cx + rx, cy + ry * squeezeAspect];
}

// Inverse of squeezePoint applied to a direction vector (undo squeeze-y → undo rotate).
// stormScale cancels out after normalisation so no change needed here.
function squeezeDir(dx: number, dy: number): [number, number] {
  const ca = Math.cos(squeezeAngle);
  const sa = Math.sin(squeezeAngle);
  const dy2 = dy / squeezeAspect;
  return [dx * ca + dy2 * sa, -dx * sa + dy2 * ca];
}

// Inverse of squeezePoint: storm coords → canvas coords (undo squeeze-y → undo rotate → scale).
function unsqueezePoint(sX: number, sY: number): [number, number] {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const rx = sX - cx;
  const ry = (sY - cy) / squeezeAspect;
  const ca = Math.cos(squeezeAngle);
  const sa = Math.sin(squeezeAngle);
  return [cx + (rx * ca + ry * sa) * stormScale, cy + (-rx * sa + ry * ca) * stormScale];
}

function drawDensityPreview() {
  const pctx = densityPreviewCanvas.getContext('2d')!;
  const imageData = pctx.createImageData(PREVIEW_WIDTH, PREVIEW_HEIGHT);
  const data = imageData.data;
  const scaleX = CANVAS_WIDTH / PREVIEW_WIDTH;
  const scaleY = CANVAS_HEIGHT / PREVIEW_HEIGHT;

  for (let py = 0; py < PREVIEW_HEIGHT; py++) {
    for (let px = 0; px < PREVIEW_WIDTH; px++) {
      const [spx, spy] = squeezePoint(px * scaleX, py * scaleY);
      const { density } = stormField(spx, spy);
      const gray = Math.round(density * 255);
      const idx = (py * PREVIEW_WIDTH + px) * 4;
      data[idx] = data[idx + 1] = data[idx + 2] = gray;
      data[idx + 3] = 255;
    }
  }

  pctx.putImageData(imageData, 0, 0);
}

function drawShapeOnCanvas() {
  console.time('storm draw');
  recomputeArmOffsets();
  rebuildThetaTable();
  buildNoisePerm();

  // Density field preview (secondary canvas)
  drawDensityPreview();

  // Main canvas: white background + blue noise line strokes
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const rng = makeLCG(randSeed * 999983 + 1);
  const n = Math.max(2, Math.round(pointGridN));
  const cellW = CANVAS_WIDTH / n;
  const cellH = CANVAS_HEIGHT / n;

  savedLines = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const px = (i + rng()) * cellW;
      const py = (j + rng()) * cellH;
      const r1 = rng(); // scatter decision
      const r2 = rng(); // arm decision

      const [spx, spy] = squeezePoint(px, py);
      const { density, dx: rdx, dy: rdy } = stormField(spx, spy);
      const [dx, dy] = squeezeDir(rdx, rdy);

      // Layer 1: sparse haze everywhere above scatterThreshold
      const scatterAccept = density > scatterThreshold ? scatterRate : 0;
      // Layer 2: dense strokes on arm peaks above armThreshold
      const armDensity = Math.max(0, density - armThreshold) / Math.max(0.001, 1 - armThreshold);
      const armAccept = armDensity * armRate;

      if (r1 >= scatterAccept && r2 >= armAccept) continue;

      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag < 0.001) continue;

      let nx = dx / mag;
      let ny = dy / mag;

      if (noiseEnabled && noiseDirAmp !== 0) {
        // Sample noise at a spatially offset point so direction noise is decorrelated from density noise
        const dirNoise = evalNoise(px + 3141, py + 2718);
        const angle = Math.atan2(ny, nx) + dirNoise * noiseDirAmp;
        nx = Math.cos(angle);
        ny = Math.sin(angle);
      }

      // Use storm-space radius so ring/sector boundaries align with the drawn streamlines
      const pr = Math.sqrt((spx - CANVAS_WIDTH / 2) ** 2 + (spy - CANVAS_HEIGHT / 2) ** 2);
      const scaledLength = lineLength * evalLengthScale(pr);

      const x2 = px + nx * scaledLength;
      const y2 = py + ny * scaledLength;

      // Discard any line that breaks out of the border rectangle
      if (px < BORDER_LEFT || px > BORDER_RIGHT || py < BORDER_TOP || py > BORDER_BOTTOM) continue;
      if (x2 < BORDER_LEFT || x2 > BORDER_RIGHT || y2 < BORDER_TOP || y2 > BORDER_BOTTOM) continue;

      // Ring and sector classification — use storm-space angle so sectors match the streamlines
      const baseN = Math.max(1, Math.round(sectorN));
      const ring = getRing(pr);
      const ringSectorCount = baseN * (1 << ring); // N, 2N, 4N, 8N
      const ptheta = Math.atan2(spy - CANVAS_HEIGHT / 2, spx - CANVAS_WIDTH / 2);
      const pphi = ptheta - lookupTheta(pr);
      const normPhi = ((pphi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const sector = Math.floor(normPhi / (2 * Math.PI / ringSectorCount));

      savedLines.push({ x1: px, y1: py, x2, y2, ring, sector, r: pr });
    }
  }

  // Sort into depth-first tree order: sector-0 tree first, then sector-1 tree, etc.
  savedLines.sort((a, b) => treeOrderPosition(a.ring, a.sector) - treeOrderPosition(b.ring, b.sector));

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const { x1, y1, x2, y2 } of savedLines) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  if (showDebug) {
    // Ring boundaries (blue circles) + per-ring sector streamlines (red)
    const baseN = Math.max(1, Math.round(sectorN));
    const dcx = CANVAS_WIDTH / 2;
    const dcy = CANVAS_HEIGHT / 2;
    const R_STEPS = 400;

    // Ring boundaries are circles in storm space — draw as squeezed ellipses in canvas space
    ctx.strokeStyle = 'rgba(0, 100, 220, 0.5)';
    ctx.lineWidth = 0.8;
    const C_STEPS = 120;
    for (const rb of RING_BOUNDARIES) {
      ctx.beginPath();
      for (let s = 0; s <= C_STEPS; s++) {
        const angle = s / C_STEPS * 2 * Math.PI;
        const [ux, uy] = unsqueezePoint(dcx + rb * Math.cos(angle), dcy + rb * Math.sin(angle));
        if (s === 0) ctx.moveTo(ux, uy);
        else ctx.lineTo(ux, uy);
      }
      ctx.stroke();
    }

    // Sector streamlines: computed in storm space, drawn in canvas space via unsqueezePoint
    ctx.strokeStyle = 'rgba(220, 60, 0, 0.45)';
    ctx.lineWidth = 0.6;
    const ringRadii = [
      [3,                RING_BOUNDARIES[0]],
      [RING_BOUNDARIES[0], RING_BOUNDARIES[1]],
      [RING_BOUNDARIES[1], RING_BOUNDARIES[2]],
      [RING_BOUNDARIES[2], KNOT_R_MAX],
    ];
    for (let ring = 0; ring < NUM_RINGS; ring++) {
      const ringSectorCount = baseN * (1 << ring);
      const sectorWidth = 2 * Math.PI / ringSectorCount;
      const [rInner, rOuter] = ringRadii[ring];
      for (let k = 0; k < ringSectorCount; k++) {
        const phi_k = k * sectorWidth;
        ctx.beginPath();
        for (let s = 0; s <= R_STEPS; s++) {
          const r = rInner * Math.pow(rOuter / rInner, s / R_STEPS);
          const theta = phi_k + lookupTheta(r);
          const [ux, uy] = unsqueezePoint(dcx + r * Math.cos(theta), dcy + r * Math.sin(theta));
          if (s === 0) ctx.moveTo(ux, uy);
          else ctx.lineTo(ux, uy);
        }
        ctx.stroke();
      }
    }
  }

  console.timeEnd('storm draw');
}


function addTextGroup(svg: Element, str: string, transform: string) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("transform", transform);
  const spacing = 90;
  for (let i = 0; i < str.length; i++) {
    const letter = str[i];
    if (letter === ' ') continue;
    const offset = getLetterOffset(letter);
    const lg = document.createElementNS("http://www.w3.org/2000/svg", "g");
    lg.setAttribute("transform", `translate(${i * spacing - offset.x}, -${offset.y})`);
    lg.setAttribute("fill", "none");
    lg.setAttribute("stroke", "black");
    lg.setAttribute("stroke-width", "3");
    lg.innerHTML = getLetterSVGPath(letter);
    group.appendChild(lg);
  }
  svg.appendChild(group);
}

function drawTextOnSVG() {
  svgElement.innerHTML = '';

  const borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  borderRect.setAttribute("x", "25");
  borderRect.setAttribute("y", "25");
  borderRect.setAttribute("width", (CANVAS_WIDTH - 50).toString());
  borderRect.setAttribute("height", (CANVAS_HEIGHT - 75).toString());
  borderRect.setAttribute("fill", "none");
  borderRect.setAttribute("stroke", "black");
  borderRect.setAttribute("stroke-width", "1");
  svgElement.appendChild(borderRect);

  addTextGroup(svgElement, "JAMES HOVET", `translate(23.5, ${CANVAS_HEIGHT - 15}), scale(0.2)`);
  addTextGroup(svgElement, "2025", `translate(${CANVAS_WIDTH - 130}, ${CANVAS_HEIGHT - 15}), scale(0.2)`);
}

function buildSectorGroup(parentEl: Element, ring: number, sector: number, byGroup: Map<string, Line[]>) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("id", getSectorId(ring, sector));
  g.setAttribute("stroke", "black");
  g.setAttribute("stroke-width", "0.8");
  g.setAttribute("fill", "none");

  // This sector's own lines, sorted inward→outward
  const lines = (byGroup.get(`${ring}-${sector}`) ?? []).sort((a, b) => a.r - b.r);
  for (const { x1, y1, x2, y2 } of lines) {
    const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineEl.setAttribute("x1", x1.toFixed(2));
    lineEl.setAttribute("y1", y1.toFixed(2));
    lineEl.setAttribute("x2", x2.toFixed(2));
    lineEl.setAttribute("y2", y2.toFixed(2));
    g.appendChild(lineEl);
  }

  // Recurse: each sector has two children in the next ring
  if (ring < NUM_RINGS - 1) {
    buildSectorGroup(g, ring + 1, sector * 2, byGroup);
    buildSectorGroup(g, ring + 1, sector * 2 + 1, byGroup);
  }

  parentEl.appendChild(g);
}

function exportSVG() {
  console.time('svg export');

  const exportEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  exportEl.setAttribute('width', CANVAS_WIDTH.toString());
  exportEl.setAttribute('height', CANVAS_HEIGHT.toString());
  exportEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("x", "0");
  bgRect.setAttribute("y", "0");
  bgRect.setAttribute("width", CANVAS_WIDTH.toString());
  bgRect.setAttribute("height", CANVAS_HEIGHT.toString());
  bgRect.setAttribute("fill", CANVAS_BG);
  exportEl.appendChild(bgRect);

  // Nested <g> tree: one ring-0 <g> per top-level sector, children nested inside
  const expBaseN = Math.max(1, Math.round(sectorN));
  const byGroup = new Map<string, Line[]>();
  for (const line of savedLines) {
    const key = `${line.ring}-${line.sector}`;
    const arr = byGroup.get(key);
    if (arr) arr.push(line); else byGroup.set(key, [line]);
  }
  for (let s = 0; s < expBaseN; s++) {
    buildSectorGroup(exportEl, 0, s, byGroup);
  }

  if (showBorder) {
    const borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    borderRect.setAttribute("x", "25");
    borderRect.setAttribute("y", "25");
    borderRect.setAttribute("width", (CANVAS_WIDTH - 50).toString());
    borderRect.setAttribute("height", (CANVAS_HEIGHT - 75).toString());
    borderRect.setAttribute("fill", "none");
    borderRect.setAttribute("stroke", "black");
    borderRect.setAttribute("stroke-width", "1");
    exportEl.appendChild(borderRect);

    addTextGroup(exportEl, "JAMES HOVET", `translate(23.5, ${CANVAS_HEIGHT - 15}), scale(0.2)`);
    addTextGroup(exportEl, "2025", `translate(${CANVAS_WIDTH - 130}, ${CANVAS_HEIGHT - 15}), scale(0.2)`);
  }

  const svgData = new XMLSerializer().serializeToString(exportEl);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'storm.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.timeEnd('svg export');
}

function setupControls() {
  if (controlsInitialized) return;
  const container = document.getElementById('controls-container');
  if (!container) return;
  container.innerHTML = '';
  container.style.fontFamily = 'Arial, sans-serif';

  function createGroup(title: string, defaultOpen: boolean): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '4px';
    wrapper.style.border = '1px solid #ddd';
    wrapper.style.borderRadius = '4px';
    wrapper.style.overflow = 'hidden';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '4px 8px';
    header.style.backgroundColor = '#e0e0e0';
    header.style.cursor = 'pointer';
    header.style.userSelect = 'none';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    titleEl.style.fontWeight = 'bold';
    titleEl.style.fontSize = '11px';

    const arrow = document.createElement('span');
    arrow.textContent = defaultOpen ? '▼' : '▶';
    arrow.style.fontSize = '9px';
    arrow.style.color = '#666';

    header.appendChild(titleEl);
    header.appendChild(arrow);

    const content = document.createElement('div');
    content.style.padding = '6px 6px 2px';
    content.style.display = defaultOpen ? 'block' : 'none';

    header.addEventListener('click', () => {
      const isOpen = content.style.display !== 'none';
      content.style.display = isOpen ? 'none' : 'block';
      arrow.textContent = isOpen ? '▶' : '▼';
    });

    wrapper.appendChild(header);
    wrapper.appendChild(content);
    container.appendChild(wrapper);
    return content;
  }

  type ParamCfg = { default: number; min: number; max: number; step: number; decimals: number; label: string };

  function addSlider(parent: HTMLElement, key: string, setter: (v: number) => void) {
    const cfg = (PARAM_CONFIG as Record<string, ParamCfg>)[key];
    const div = document.createElement('div');
    div.style.marginBottom = '4px';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'baseline';
    row.style.marginBottom = '1px';

    const lbl = document.createElement('span');
    lbl.textContent = cfg.label;
    lbl.style.fontWeight = 'bold';
    lbl.style.fontSize = '11px';

    const val = document.createElement('span');
    val.textContent = cfg.default.toFixed(cfg.decimals);
    val.style.fontSize = '11px';
    val.style.color = '#555';
    val.style.fontFamily = 'monospace';

    row.appendChild(lbl);
    row.appendChild(val);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = cfg.min.toString();
    slider.max = cfg.max.toString();
    slider.step = cfg.step.toString();
    slider.value = cfg.default.toString();
    slider.style.width = '100%';
    slider.style.height = '14px';
    slider.style.margin = '0';
    slider.style.padding = '0';
    slider.style.display = 'block';

    slider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      setter(v);
      val.textContent = v.toFixed(cfg.decimals);
      drawShapeOnCanvas();
    });

    div.appendChild(row);
    div.appendChild(slider);
    parent.appendChild(div);
  }

  function addCustomSlider(parent: HTMLElement, labelText: string, min: number, max: number, step: number, initVal: number, decimals: number, setter: (v: number) => void) {
    const div = document.createElement('div');
    div.style.marginBottom = '4px';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'baseline';
    row.style.marginBottom = '1px';

    const lbl = document.createElement('span');
    lbl.textContent = labelText;
    lbl.style.fontWeight = 'bold';
    lbl.style.fontSize = '11px';

    const val = document.createElement('span');
    val.textContent = initVal.toFixed(decimals);
    val.style.fontSize = '11px';
    val.style.color = '#555';
    val.style.fontFamily = 'monospace';

    row.appendChild(lbl);
    row.appendChild(val);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = initVal.toString();
    slider.style.width = '100%';
    slider.style.height = '14px';
    slider.style.margin = '0';
    slider.style.padding = '0';
    slider.style.display = 'block';

    slider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      setter(v);
      val.textContent = v.toFixed(decimals);
      drawShapeOnCanvas();
    });

    div.appendChild(row);
    div.appendChild(slider);
    parent.appendChild(div);
  }

  const setters: Record<string, (v: number) => void> = {
    eyeRadius:        (v) => { eyeRadius = v; },
    eyewallRadius:    (v) => { eyewallRadius = v; },
    eyewallWidth:     (v) => { eyewallWidth = v; },
    eyewallDominance: (v) => { eyewallDominance = v; },
    outerDecay:       (v) => { outerDecay = v; },
    spiralTightness:  (v) => { spiralTightness = v; },
    numArms:          (v) => { numArms = Math.round(v); },
    innerSharpness:   (v) => { innerSharpness = v; },
    outerSharpness:   (v) => { outerSharpness = v; },
    sharpnessScale:   (v) => { sharpnessScale = v; },
    harmonicAmp:      (v) => { harmonicAmp = v; },
    rotation:         (v) => { rotation = v; },
    falloffInner:     (v) => { falloffInner = v; },
    falloffOuter:     (v) => { falloffOuter = v; },
    falloffCurve:     (v) => { falloffCurve = v; },
    densityGamma:     (v) => { densityGamma = v; },
    armWidthVar:      (v) => { armWidthVar = v; },
    armBrightVar:     (v) => { armBrightVar = v; },
    randSeed:         (v) => { randSeed = v; },
    outwardLean:      (v) => { outwardLean = v; },
    pointGridN:       (v) => { pointGridN = Math.round(v); },
    lineLength:       (v) => { lineLength = Math.round(v); },
    scatterThreshold: (v) => { scatterThreshold = v; },
    scatterRate:      (v) => { scatterRate = v; },
    armThreshold:     (v) => { armThreshold = v; },
    armRate:          (v) => { armRate = v; },
    sectorN:          (v) => { sectorN = Math.round(v); },
    squeezeAspect:    (v) => { squeezeAspect = v; },
    squeezeAngle:     (v) => { squeezeAngle = v; },
    stormScale:       (v) => { stormScale = v; },
    centerHoleInner:  (v) => { centerHoleInner = v; },
    centerHoleOuter:  (v) => { centerHoleOuter = v; },
    centerHoleAmt:    (v) => { centerHoleAmt = v; },
    noiseSeed:        (v) => { noiseSeed = v; },
    noiseScale:       (v) => { noiseScale = v; },
    noiseLacunarity:  (v) => { noiseLacunarity = v; },
    noiseOctaves:     (v) => { noiseOctaves = Math.round(v); },
    noiseWeight:      (v) => { noiseWeight = v; },
    noiseOffsetX:     (v) => { noiseOffsetX = v; },
    noiseOffsetY:     (v) => { noiseOffsetY = v; },
    noiseDirAmp:      (v) => { noiseDirAmp = v; },
  };

  // --- Storm Shape ---
  const shapeGroup = createGroup('Storm Shape', true);
  for (const k of ['eyeRadius', 'eyewallRadius', 'eyewallWidth', 'eyewallDominance', 'outerDecay']) {
    addSlider(shapeGroup, k, setters[k]);
  }

  // --- Arms ---
  const armsGroup = createGroup('Arms', true);
  for (const k of ['spiralTightness', 'numArms', 'innerSharpness', 'outerSharpness', 'sharpnessScale', 'harmonicAmp', 'rotation', 'armWidthVar', 'armBrightVar']) {
    addSlider(armsGroup, k, setters[k]);
  }

  // --- Falloff ---
  const falloffGroup = createGroup('Falloff', true);
  for (const k of ['falloffInner', 'falloffOuter', 'falloffCurve', 'densityGamma']) {
    addSlider(falloffGroup, k, setters[k]);
  }

  // --- Sampling ---
  const samplingGroup = createGroup('Sampling', true);
  for (const k of ['randSeed', 'pointGridN', 'outwardLean', 'lineLength', 'scatterThreshold', 'scatterRate', 'armThreshold', 'armRate', 'sectorN']) {
    addSlider(samplingGroup, k, setters[k]);
  }

  // --- Squeeze ---
  const squeezeGroup = createGroup('Squeeze', true);
  for (const k of ['stormScale', 'squeezeAspect', 'squeezeAngle']) {
    addSlider(squeezeGroup, k, setters[k]);
  }

  // --- Center Hole ---
  const centerGroup = createGroup('Center Hole', true);
  for (const k of ['centerHoleInner', 'centerHoleOuter', 'centerHoleAmt']) {
    addSlider(centerGroup, k, setters[k]);
  }

  // --- Length Scale ---
  const lsGroup = createGroup('Length Scale', false);
  const knotPcts = ['0%', '12%', '24%', '36%', '48%', '60%+'];
  for (let k = 0; k < NUM_KNOTS; k++) {
    addCustomSlider(lsGroup, `r = ${knotPcts[k]}`, 0, 3, 0.05, lengthScaleKnots[k], 2, (v) => { lengthScaleKnots[k] = v; });
  }

  // --- Noise ---
  const noiseGroup = createGroup('Noise', false);

  const enableRow = document.createElement('div');
  enableRow.style.display = 'flex';
  enableRow.style.alignItems = 'center';
  enableRow.style.gap = '6px';
  enableRow.style.marginBottom = '6px';
  const enableCheck = document.createElement('input');
  enableCheck.type = 'checkbox';
  enableCheck.checked = noiseEnabled;
  enableCheck.addEventListener('change', () => { noiseEnabled = enableCheck.checked; drawShapeOnCanvas(); });
  const enableLabel = document.createElement('label');
  enableLabel.textContent = 'Enable';
  enableLabel.style.fontSize = '11px';
  enableRow.appendChild(enableCheck);
  enableRow.appendChild(enableLabel);
  noiseGroup.appendChild(enableRow);

  for (const k of ['noiseSeed', 'noiseScale', 'noiseLacunarity', 'noiseOctaves', 'noiseWeight', 'noiseOffsetX', 'noiseOffsetY', 'noiseDirAmp']) {
    addSlider(noiseGroup, k, setters[k]);
  }

  const octHeader = document.createElement('div');
  octHeader.textContent = 'Per-Octave Amplitude';
  octHeader.style.fontWeight = 'bold';
  octHeader.style.fontSize = '11px';
  octHeader.style.marginTop = '6px';
  octHeader.style.marginBottom = '2px';
  noiseGroup.appendChild(octHeader);

  for (let o = 0; o < 8; o++) {
    addCustomSlider(noiseGroup, `Oct ${o}`, 0, 2, 0.01, noiseAmps[o], 2, (v) => { noiseAmps[o] = v; });
  }

  // --- Footer: checkboxes + save button ---
  function addCheckbox(labelText: string, checked: boolean, onChange: (v: boolean) => void) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '6px';
    row.style.marginTop = '6px';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => { onChange(cb.checked); drawShapeOnCanvas(); });
    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    lbl.style.fontSize = '11px';
    row.appendChild(cb);
    row.appendChild(lbl);
    container.appendChild(row);
    return cb;
  }

  addCheckbox('Show sector debug', showDebug, (v) => { showDebug = v; });

  const borderRow = document.createElement('div');
  borderRow.style.display = 'flex';
  borderRow.style.alignItems = 'center';
  borderRow.style.gap = '6px';
  borderRow.style.marginTop = '6px';
  borderRow.style.marginBottom = '4px';
  const borderCheckbox = document.createElement('input');
  borderCheckbox.type = 'checkbox';
  borderCheckbox.id = 'showBorderCheckbox';
  borderCheckbox.checked = showBorder;
  borderCheckbox.addEventListener('change', () => { showBorder = borderCheckbox.checked; });
  const borderLabel = document.createElement('label');
  borderLabel.htmlFor = 'showBorderCheckbox';
  borderLabel.textContent = 'Include border in SVG';
  borderLabel.style.fontSize = '11px';
  borderRow.appendChild(borderCheckbox);
  borderRow.appendChild(borderLabel);
  container.appendChild(borderRow);

  const saveBtn = document.createElement('button');
  saveBtn.id = 'saveSVG';
  saveBtn.textContent = 'Save SVG';
  saveBtn.style.marginTop = '6px';
  saveBtn.style.width = '100%';
  saveBtn.style.padding = '8px';
  saveBtn.style.backgroundColor = '#007bff';
  saveBtn.style.color = 'white';
  saveBtn.style.border = 'none';
  saveBtn.style.borderRadius = '4px';
  saveBtn.style.cursor = 'pointer';
  saveBtn.style.fontWeight = 'bold';
  saveBtn.addEventListener('click', exportSVG);
  container.appendChild(saveBtn);

  controlsInitialized = true;
}

function initializeCanvasAndSVG() {
  if (isInitialized) return;

  const stormContainer = document.getElementById('storm-container');
  if (!stormContainer) {
    console.error('storm-container element not found');
    return;
  }
  stormContainer.innerHTML = '';

  canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgElement.setAttribute('width', CANVAS_WIDTH.toString());
  svgElement.setAttribute('height', CANVAS_HEIGHT.toString());
  svgElement.style.position = 'absolute';
  svgElement.style.top = '0';
  svgElement.style.left = '0';
  svgElement.style.pointerEvents = 'none';

  stormContainer.appendChild(canvas);
  stormContainer.appendChild(svgElement);

  // Density preview canvas (secondary view)
  const densityContainer = document.getElementById('density-container');
  if (!densityContainer) {
    console.error('density-container element not found');
    return;
  }
  densityContainer.innerHTML = '';
  densityPreviewCanvas = document.createElement('canvas');
  densityPreviewCanvas.width = PREVIEW_WIDTH;
  densityPreviewCanvas.height = PREVIEW_HEIGHT;
  densityPreviewCanvas.style.display = 'block';
  densityContainer.appendChild(densityPreviewCanvas);

  drawTextOnSVG();
  drawShapeOnCanvas();

  isInitialized = true;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isInitialized) {
    initializeCanvasAndSVG();
    setupControls();
  }
});

if (document.readyState !== 'loading' && !isInitialized) {
  initializeCanvasAndSVG();
  setupControls();
}
