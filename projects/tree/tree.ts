import {getLetterOffset, getLetterSVGPath} from "../../shared/letterSvgPaths";

// Parameter configuration constants
const PARAM_CONFIG = {
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
  // Effect contribution factors
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
  // Weather data mapping parameters
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
  // Multi-scale Perlin noise parameters
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
  // Smoothing parameters
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
  // Seed parameter
  seed: {
    default: Math.floor(Math.random() * 1000000),
    min: 0,
    max: 999999,
    step: 1
  },
  // Gaussian random generation parameters
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

// Circle parameters
let scale = PARAM_CONFIG.scale.default;
let ringWidthFactor = PARAM_CONFIG.ringWidthFactor.default;
let numCircles = PARAM_CONFIG.numCircles.default;
// Effect contribution factors
let favorabilityContribution = PARAM_CONFIG.favorabilityContribution.default;
let gaussianContribution = PARAM_CONFIG.gaussianContribution.default;
let noiseContribution = PARAM_CONFIG.noiseContribution.default;
let tempMin = PARAM_CONFIG.tempMin.default;
let tempMax = PARAM_CONFIG.tempMax.default;
let tempContribution = PARAM_CONFIG.tempContribution.default;
let dewMin = PARAM_CONFIG.dewMin.default;
let dewMax = PARAM_CONFIG.dewMax.default;
let dewContribution = PARAM_CONFIG.dewContribution.default;
// Perlin noise parameters
let fineDetailFreq = PARAM_CONFIG.fineDetailFreq.default;
let fineDetailAmp = PARAM_CONFIG.fineDetailAmp.default;
let mediumDetailFreq = PARAM_CONFIG.mediumDetailFreq.default;
let mediumDetailAmp = PARAM_CONFIG.mediumDetailAmp.default;
let coarseDetailFreq = PARAM_CONFIG.coarseDetailFreq.default;
let coarseDetailAmp = PARAM_CONFIG.coarseDetailAmp.default;
let fineRingOffset = PARAM_CONFIG.fineRingOffset.default;
let mediumRingOffset = PARAM_CONFIG.mediumRingOffset.default;
let coarseRingOffset = PARAM_CONFIG.coarseRingOffset.default;
let noiseOctaves = PARAM_CONFIG.noiseOctaves.default;
// Smoothing parameters
let smoothingBase = PARAM_CONFIG.smoothingBase.default;
let smoothingInner = PARAM_CONFIG.smoothingInner.default;
let smoothingFalloff = PARAM_CONFIG.smoothingFalloff.default;
// Seed parameter
let seed = PARAM_CONFIG.seed.default;
// Gaussian random generation parameters
let gaussianCountMin = PARAM_CONFIG.gaussianCountMin.default;
let gaussianCountMax = PARAM_CONFIG.gaussianCountMax.default;
let gaussianSigmaMin = PARAM_CONFIG.gaussianSigmaMin.default;
let gaussianSigmaMax = PARAM_CONFIG.gaussianSigmaMax.default;
let gaussianAmplitudeMin = PARAM_CONFIG.gaussianAmplitudeMin.default;
let gaussianAmplitudeMax = PARAM_CONFIG.gaussianAmplitudeMax.default;
let gaussianYFromMinRange = PARAM_CONFIG.gaussianYFromMinRange.default;
let gaussianYFromMaxRange = PARAM_CONFIG.gaussianYFromMaxRange.default;
let allCirclesRadii: number[][] = []; // Array of circles, each circle is an array of r values
const NUM_CIRCLE_POINTS = 500;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let svgElement: SVGElement;
let debugCanvas: HTMLCanvasElement;
let debugCtx: CanvasRenderingContext2D;
let isInitialized = false;
let controlsInitialized = false;
let favorabilityScores: number[] = [];
let debugAccumulating = true; // Toggle for debug view
let loadedWeatherData: any = null; // Store loaded weather data
let seedSliderElement: HTMLInputElement;
let seedValueElement: HTMLDivElement;
let renderGaussianControlsFunc: () => void;

// Google Sheets API
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbyXhxlnewbftEuGhSUp5XtnIphvEkzLU5I-0UGfWJqJZWk1GPJfA3I40CFeQaeVt2MO/exec';

interface SheetEntry {
  rowIndex: number;
  name: string;
  timestamp: string;
  data: string;
}

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 576;

function initializeCanvasAndSVG() {
  if (isInitialized) return;

  const treeContainer = document.getElementById('tree-container');
  if (!treeContainer) {
    console.error('tree-container element not found');
    return;
  }

  // Clear container first
  treeContainer.innerHTML = '';

  // Create canvas element
  canvas = document.createElement('canvas');

  // Get device pixel ratio for high-DPI displays
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Set the display size (CSS pixels)
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';

  // Set the actual canvas size in memory (scaled for high-DPI)
  canvas.width = CANVAS_WIDTH * devicePixelRatio;
  canvas.height = CANVAS_HEIGHT * devicePixelRatio;

  ctx = canvas.getContext('2d')!;

  // Scale the drawing context so everything is drawn at the correct size
  ctx.scale(devicePixelRatio, devicePixelRatio);

  // Create SVG element
  svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgElement.setAttribute('width', CANVAS_WIDTH.toString());
  svgElement.setAttribute('height', CANVAS_HEIGHT.toString());
  svgElement.style.position = 'absolute';
  svgElement.style.top = '0';
  svgElement.style.left = '0';
  svgElement.style.pointerEvents = 'none';

  // Add both to container
  treeContainer.appendChild(canvas);
  treeContainer.appendChild(svgElement);

  // Create debug canvas below the main art
  const debugContainer = document.getElementById('debug-container');
  if (debugContainer) {
    debugContainer.innerHTML = '';

    debugCanvas = document.createElement('canvas');
    debugCanvas.style.border = '1px solid #ccc';
    debugCanvas.style.backgroundColor = 'white';
    debugCanvas.style.display = 'block';
    debugCanvas.style.marginTop = '20px';

    debugCtx = debugCanvas.getContext('2d')!;
    debugContainer.appendChild(debugCanvas);
  }

  // Draw initial text and border on SVG
  drawTextOnSVG();

  // Generate initial circle points
  generateCirclePoints();

  // Draw initial circle on canvas
  drawCircleOnCanvas();

  // Draw initial debug view
  drawDebugView();

  isInitialized = true;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function remap(t: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
  // Map t from [oldMin, oldMax] to [newMin, newMax]
  return newMin + (t - oldMin) / (oldMax - oldMin) * (newMax - newMin);
}

// 1D Perlin noise implementation
class PerlinNoise1D {
  private permutation: number[];

  constructor(seed: number = 0) {
    // Initialize permutation table
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle using seed
    for (let i = 255; i > 0; i--) {
      const randomSeed = Math.sin(seed + i) * 10000;
      const j = Math.floor((randomSeed - Math.floor(randomSeed)) * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }

    // Duplicate for overflow
    this.permutation = [...this.permutation, ...this.permutation];
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

let perlinNoise = new PerlinNoise1D(seed);

function updateSeed(newSeed: number) {
  seed = newSeed;
  perlinNoise = new PerlinNoise1D(seed);
  generateCirclePoints();
  drawCircleOnCanvas();
  drawDebugView();
  drawFavorabilityGraph();
}

function getRadialNoise(angle: number, ringIndex: number): number {
  // Multi-scale Perlin noise approach with three layers
  // Sample on a circle using cos/sin to ensure continuity at angle=0 and angle=2π

  // Use hard-coded persistence for the octave noise
  const persistence = 0.5;

  // Helper function to sample Perlin noise on a circle
  const sampleCircular = (frequency: number, ringOffset: number): number => {
    // Offset for this ring to break periodicity across rings
    const offset = ringIndex * ringOffset;

    // Sample at two points using cos and sin to create circular continuity
    const x = Math.cos(angle) * frequency + offset;
    const y = Math.sin(angle) * frequency + offset * 1.5; // Different offset for y

    const noiseX = perlinNoise.octaveNoise(x, noiseOctaves, persistence);
    const noiseY = perlinNoise.octaveNoise(y, noiseOctaves, persistence);

    // Combine the two samples
    return noiseX + noiseY;
  };

  // Fine detail layer - high frequency, small variations (knots, texture)
  // Shift from [-1, 1] to [0, 1] to make it purely additive
  const fineNoiseRaw = sampleCircular(fineDetailFreq, fineRingOffset);
  const fineNoise = ((fineNoiseRaw + 1) / 2) * fineDetailAmp;

  // Medium detail layer - mid-range features (irregular growth patterns)
  // Shift from [-1, 1] to [0, 1] to make it purely additive
  const mediumNoiseRaw = sampleCircular(mediumDetailFreq, mediumRingOffset);
  const mediumNoise = ((mediumNoiseRaw + 1) / 2) * mediumDetailAmp;

  // Coarse detail layer - large-scale asymmetry (overall shape distortion)
  // Shift from [-1, 1] to [0, 1] to make it purely additive
  const coarseNoiseRaw = sampleCircular(coarseDetailFreq, coarseRingOffset);
  const coarseNoise = ((coarseNoiseRaw + 1) / 2) * coarseDetailAmp;

  // Combine all layers
  return fineNoise + mediumNoise + coarseNoise;
}

function smoothRingRadii(radii: number[], windowSize: number): number[] {
  if (windowSize === 0) return radii;

  const smoothed: number[] = [];
  const n = radii.length;

  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;

    // Average over the window, wrapping around at boundaries
    for (let j = -windowSize; j <= windowSize; j++) {
      // Use modulo to wrap around
      let index = (i + j + n) % n;
      sum += radii[index];
      count++;
    }

    smoothed.push(sum / count);
  }

  return smoothed;
}

function calculateRingWidth(currentRingIndex: number, favorability: number): number {
  // The formula derived from Biondi & Qeadan (2008) Eq. 10:
  // Expected Width = sqrt(c * t) - sqrt(c * (t - 1))
  // Where t is the ring number (1-indexed), and c is the Basal Area Increment
  //
  // c (favorability) represents the amount of tree mass added that year
  // This creates rings that get progressively narrower AND vary by growing conditions

  const t = currentRingIndex + 1; // Convert to 1-indexed
  const c = favorability;

  return Math.sqrt(c * t) - Math.sqrt(c * (t - 1));
}

function calculateFavorabilityFromWeather(weatherDataPoint: any): number {
  const temp = weatherDataPoint.temperature_2m_mean;
  const dew = weatherDataPoint.dew_point_2m_mean;

  // Normalize temperature to [0, 1] range
  const normalizedTemp = Math.max(0, Math.min(1, (temp - tempMin) / (tempMax - tempMin)));

  // Normalize dew point to [0, 1] range
  const normalizedDew = Math.max(0, Math.min(1, (dew - dewMin) / (dewMax - dewMin)));

  // Calculate weighted average
  const totalContribution = tempContribution + dewContribution;
  if (totalContribution === 0) return 0.5; // Default if both contributions are 0

  const favorability = (normalizedTemp * tempContribution + normalizedDew * dewContribution) / totalContribution;

  return Math.max(0.1, Math.min(1.0, favorability));
}

function gaussian2D(x: number, y: number, sigma: number): number {
  // 2D Gaussian function: z = (1 / (2π σ²)) * exp(-(x² + y²) / (2σ²))
  const coefficient = 1 / (2 * Math.PI * sigma * sigma);
  const exponent = -(x * x + y * y) / (2 * sigma * sigma);
  return coefficient * Math.exp(exponent);
}

// Gaussian distortion parameters
interface GaussianParams {
  centerAngle: number;       // Angle where the Gaussian is centered (radians)
  yRemapFrom: [number, number]; // [min, max] for ringIndex input range
  sigma: number;             // Width of the Gaussian (yRemapTo is automatically [-3*sigma, 3*sigma])
  amplitude: number;         // Multiplier for the Gaussian output
}

// Generate random Gaussians on initialization
function generateRandomGaussians(): GaussianParams[] {
  const countMin = Math.min(gaussianCountMin, gaussianCountMax);
  const countMax = Math.max(gaussianCountMin, gaussianCountMax);
  const numGaussians = Math.floor(Math.random() * (countMax - countMin + 1)) + countMin;
  const gaussians: GaussianParams[] = [];

  for (let i = 0; i < numGaussians; i++) {
    // Generate yRemapFrom with min < max and at least 3 apart
    const minGap = 3;
    const yFromMin = Math.random() * (gaussianYFromMaxRange - gaussianYFromMinRange - minGap) + gaussianYFromMinRange;
    const yFromMax = Math.random() * (gaussianYFromMaxRange - yFromMin - minGap) + (yFromMin + minGap);

    gaussians.push({
      centerAngle: Math.random() * Math.PI * 2, // Random angle from 0 to 2π
      yRemapFrom: [yFromMin, yFromMax],
      sigma: Math.random() * (gaussianSigmaMax - gaussianSigmaMin) + gaussianSigmaMin,
      amplitude: Math.random() * (gaussianAmplitudeMax - gaussianAmplitudeMin) + gaussianAmplitudeMin
    });
  }

  return gaussians;
}

let gaussianList: GaussianParams[] = generateRandomGaussians();

function generateCirclePoints() {
  allCirclesRadii = [];

  // Generate favorability scores
  favorabilityScores = [];
  if (loadedWeatherData && loadedWeatherData.length > 0) {
    // Use weather data to calculate favorability
    for (let i = 0; i < numCircles; i++) {
      if (i < loadedWeatherData.length) {
        favorabilityScores.push(calculateFavorabilityFromWeather(loadedWeatherData[i]));
      } else {
        favorabilityScores.push(0.5); // Default for any extra rings
      }
    }
  } else {
    // No weather data - use constant 0.5
    for (let i = 0; i < numCircles; i++) {
      favorabilityScores.push(0.5);
    }
  }

  // Calculate individual ring widths (not cumulative) for both models
  const biologicalWidths: number[] = [];
  const linearWidths: number[] = [];

  for (let i = 0; i < numCircles; i++) {
    // Use constant favorability of 1.0 for base width calculation
    // Actual favorability will be applied as a multiplier later
    const baseFavorability = 1.0;
    // Biological model: width using sqrt formula
    biologicalWidths.push(calculateRingWidth(i, baseFavorability));
    // Linear model: width directly from favorability
    linearWidths.push(baseFavorability);
  }

  // Normalize linear widths to match biological total for fair interpolation
  const totalBiologicalWidth = biologicalWidths.reduce((sum, w) => sum + w, 0);
  const totalLinearWidth = linearWidths.reduce((sum, w) => sum + w, 0);
  const linearScale = totalBiologicalWidth / totalLinearWidth;

  // Build rings iteratively - each ring builds on top of the previous one
  for (let ringIndex = 0; ringIndex < numCircles; ringIndex++) {
    const circleRadii: number[] = [];

    // Calculate this ring's base width (interpolated between biological and linear)
    const biologicalWidth = biologicalWidths[ringIndex];
    const linearWidth = linearWidths[ringIndex] * linearScale;
    const interpolatedWidth = lerp(biologicalWidth, linearWidth, ringWidthFactor);
    const baseRingWidth = interpolatedWidth;

    // Get favorability for this ring
    // Lerp between 1.0 (no effect) and favorability (full effect) based on contribution slider
    const favorability = favorabilityScores[ringIndex];
    const adjustedFavorability = lerp(1.0, favorability, favorabilityContribution);

    // For each angle around the circle
    for (let i = 0; i < NUM_CIRCLE_POINTS; i++) {
      const theta = (i / NUM_CIRCLE_POINTS) * Math.PI * 2;

      // Start with base width
      let ringContribution = baseRingWidth;

      // Add Gaussian effects
      for (const gaussian of gaussianList) {
        // Calculate angular difference with wrapping to ensure continuity at theta=0 and theta=2π
        let angleDiff = theta - gaussian.centerAngle;

        // Normalize to [-π, π] for proper wrapping
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Calculate y parameter using remap with automatic yRemapTo based on sigma
        const yRemapToMin = -3 * gaussian.sigma;
        const yRemapToMax = 3 * gaussian.sigma;
        const y = remap(ringIndex, gaussian.yRemapFrom[0], gaussian.yRemapFrom[1],
                        yRemapToMin, yRemapToMax);

        // Add Gaussian contribution
        ringContribution += gaussian2D(angleDiff, y, gaussian.sigma) * gaussian.amplitude * gaussianContribution;
      }

      // Add Perlin noise
      const noise = getRadialNoise(theta, ringIndex);
      ringContribution += noise * noiseContribution;

      // Apply favorability as a multiplier to the total contribution
      ringContribution *= adjustedFavorability;

      // Calculate final radius by adding contribution to previous ring
      let r: number;
      if (ringIndex === 0) {
        // First ring: just the contribution
        r = ringContribution;
      } else {
        // Subsequent rings: build on previous ring's radius at this angle
        const previousR = allCirclesRadii[ringIndex - 1][i];
        r = previousR + ringContribution;
      }

      circleRadii.push(r);
    }

    // Calculate adaptive smoothing based on ring index with non-linear falloff
    // Inner rings (smaller) get more smoothing, outer rings (larger) get less
    // Use power curve for rapid falloff: (1 - progress)^falloff
    const ringProgress = ringIndex / (numCircles - 1); // 0 for first ring, 1 for last ring
    const falloffCurve = Math.pow(1 - ringProgress, smoothingFalloff);
    const adaptiveSmoothing = Math.round(smoothingBase + falloffCurve * smoothingInner);

    // Smooth the ring radii with rolling average (maintains boundary continuity)
    const smoothedRadii = smoothRingRadii(circleRadii, adaptiveSmoothing);

    allCirclesRadii.push(smoothedRadii);
  }
}

// Helper function to convert polar to Cartesian coordinates for a specific circle
function polarToCartesian(circleIndex: number, pointIndex: number, scaleFactor: number = 1): { x: number; y: number } {
  const centerX = CANVAS_WIDTH / 2;
  // Center Y should be halfway between top and bottom of border rectangle
  // Border rectangle: y=25, height=CANVAS_HEIGHT-75
  const centerY = 25 + (CANVAS_HEIGHT - 75) / 2;
  const angle = (pointIndex / NUM_CIRCLE_POINTS) * Math.PI * 2;
  const r = allCirclesRadii[circleIndex][pointIndex] * scaleFactor;

  return {
    x: centerX + Math.cos(angle) * r,
    y: centerY + Math.sin(angle) * r
  };
}

function drawTextOnSVG() {
  // Clear existing content
  svgElement.innerHTML = '';

  // Create border rectangle
  const borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  borderRect.setAttribute("x", "25");
  borderRect.setAttribute("y", "25");
  borderRect.setAttribute("width", (CANVAS_WIDTH - 50).toString());
  borderRect.setAttribute("height", (CANVAS_HEIGHT - 75).toString());
  borderRect.setAttribute("fill", "none");
  borderRect.setAttribute("stroke", "black");
  borderRect.setAttribute("stroke-width", "1");
  svgElement.appendChild(borderRect);

  // Create text group
  let textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroup.setAttribute("transform", "translate(23.5, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

  const distanceBetweenLettersInOriginalFileSpace = 90;
  let stringToWrite = "TREE OF YOUR LIFE";

  for (let i = 0; i < stringToWrite.length; i++) {
    const letter = stringToWrite[i];
    if (letter === ' ') continue; // Skip spaces

    const offset = getLetterOffset(letter);
    let svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const xPosition = i * distanceBetweenLettersInOriginalFileSpace - offset.x;
    svgGroup.setAttribute("transform", `translate(${xPosition}, -${offset.y})`);
    svgGroup.setAttribute("fill", "none");
    svgGroup.setAttribute("stroke", "black");
    svgGroup.setAttribute("stroke-width", "3");
    svgGroup.innerHTML = getLetterSVGPath(letter);
    textGroup.appendChild(svgGroup);
  }

  svgElement.appendChild(textGroup);

  // Now draw a second set of text on the right side - year range
  let stringToWriteTwo = getYearRangeText();

  let textGroupRight = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroupRight.setAttribute("transform", "translate(395, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

  for (let i = 0; i < stringToWriteTwo.length; i++) {
    const letter = stringToWriteTwo[i];
    if (letter === ' ') continue; // Skip spaces

    const offset = getLetterOffset(letter);
    let svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const xPosition = i * distanceBetweenLettersInOriginalFileSpace - offset.x;
    svgGroup.setAttribute("transform", `translate(${xPosition}, -${offset.y})`);
    svgGroup.setAttribute("fill", "none");
    svgGroup.setAttribute("stroke", "black");
    svgGroup.setAttribute("stroke-width", "3");
    svgGroup.innerHTML = getLetterSVGPath(letter);
    textGroupRight.appendChild(svgGroup);
  }

  svgElement.appendChild(textGroupRight);
}

function getYearRangeText(): string {
  if (loadedWeatherData && loadedWeatherData.length > 0) {
    const startYear = loadedWeatherData[0].year;
    const endYear = loadedWeatherData[loadedWeatherData.length - 1].year;
    return `${startYear}-${endYear}`;
  }
  return "XXXX-XXXX";
}

function drawCircleOnCanvas() {
  // Clear canvas completely
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Set canvas styles
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'none';

  // Find max radius across all circles to calculate scale factor
  let maxRadius = 0;
  for (const circleRadii of allCirclesRadii) {
    for (const r of circleRadii) {
      maxRadius = Math.max(maxRadius, r);
    }
  }

  // Calculate scale factor to normalize drawing to desired scale
  const scaleFactor = maxRadius > 0 ? scale / maxRadius : 1;

  // Draw all circles
  for (let circleIndex = 0; circleIndex < allCirclesRadii.length; circleIndex++) {
    const circleRadii = allCirclesRadii[circleIndex];

    if (circleRadii.length > 0) {
      ctx.beginPath();

      const firstPoint = polarToCartesian(circleIndex, 0, scaleFactor);
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < circleRadii.length; i++) {
        const point = polarToCartesian(circleIndex, i, scaleFactor);
        ctx.lineTo(point.x, point.y);
      }

      // Close the path by connecting back to the first point
      ctx.lineTo(firstPoint.x, firstPoint.y);
      ctx.stroke();
    }
  }
}

function drawDebugView() {
  if (!debugCanvas || !debugCtx || allCirclesRadii.length === 0) return;

  const numRings = allCirclesRadii.length;
  const numPoints = NUM_CIRCLE_POINTS;

  // Canvas dimensions - width based on points, height based on rings
  const padding = 40;
  const canvasWidth = 800;
  const lineHeight = 20; // Height per ring line
  const canvasHeight = padding * 2 + numRings * lineHeight;

  debugCanvas.width = canvasWidth;
  debugCanvas.height = canvasHeight;
  debugCanvas.style.width = canvasWidth + 'px';
  debugCanvas.style.height = canvasHeight + 'px';

  // Clear canvas
  debugCtx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw background
  debugCtx.fillStyle = '#f5f5f5';
  debugCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate the range of r values for scaling
  let maxR = 0;
  let minR = Infinity;

  if (debugAccumulating) {
    // For accumulating mode, use actual r values
    for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
      for (let i = 0; i < numPoints; i++) {
        const r = allCirclesRadii[ringIndex][i];
        maxR = Math.max(maxR, r);
        minR = Math.min(minR, r);
      }
    }
  } else {
    // For non-accumulating mode, calculate relative widths
    for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
      for (let i = 0; i < numPoints; i++) {
        let r: number;
        if (ringIndex === 0) {
          r = allCirclesRadii[0][i];
        } else {
          r = allCirclesRadii[ringIndex][i] - allCirclesRadii[ringIndex - 1][i];
        }
        maxR = Math.max(maxR, r);
        minR = Math.min(minR, r);
      }
    }
  }

  // Add some padding to the range
  const rRange = maxR - minR;
  const rPadding = rRange * 0.1;
  minR -= rPadding;
  maxR += rPadding;

  // Draw each ring as a line
  for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
    debugCtx.strokeStyle = '#333';
    debugCtx.lineWidth = 1;
    debugCtx.beginPath();

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const x = padding + (i / numPoints) * (canvasWidth - 2 * padding);

      let r: number;
      if (debugAccumulating) {
        // Accumulating mode: use actual r values
        r = allCirclesRadii[ringIndex][i];

        // Scale r to fit in the full canvas height (no yBase offset)
        const normalizedR = (r - minR) / (maxR - minR);
        const y = canvasHeight - padding - normalizedR * (canvasHeight - 2 * padding);

        if (i === 0) {
          debugCtx.moveTo(x, y);
        } else {
          debugCtx.lineTo(x, y);
        }
      } else {
        // Non-accumulating mode: show difference from previous ring
        if (ringIndex === 0) {
          r = allCirclesRadii[0][i];
        } else {
          r = allCirclesRadii[ringIndex][i] - allCirclesRadii[ringIndex - 1][i];
        }

        // Each ring gets its own line with yBase offset
        const yBase = padding + ringIndex * lineHeight + lineHeight / 2;
        const normalizedR = (r - minR) / (maxR - minR);
        const y = yBase - (normalizedR - 0.5) * (lineHeight * 0.8);

        if (i === 0) {
          debugCtx.moveTo(x, y);
        } else {
          debugCtx.lineTo(x, y);
        }
      }
    }

    debugCtx.stroke();
  }

  // Draw axes and labels
  debugCtx.strokeStyle = '#999';
  debugCtx.lineWidth = 0.5;
  debugCtx.font = '10px Arial';
  debugCtx.fillStyle = '#666';

  // Draw horizontal gridlines for each ring (only in non-accumulating mode)
  if (!debugAccumulating) {
    for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
      const y = padding + ringIndex * lineHeight + lineHeight / 2;
      debugCtx.beginPath();
      debugCtx.moveTo(padding, y);
      debugCtx.lineTo(canvasWidth - padding, y);
      debugCtx.stroke();

      // Ring label
      debugCtx.fillText(`R${ringIndex}`, 5, y + 3);
    }
  }

  // Draw labels
  debugCtx.fillStyle = '#000';
  debugCtx.font = '12px Arial';
  debugCtx.fillText('θ (angle) →', canvasWidth / 2 - 30, canvasHeight - 10);

  debugCtx.save();
  debugCtx.translate(15, canvasHeight / 2);
  debugCtx.rotate(-Math.PI / 2);
  debugCtx.fillText('r (radius) →', 0, 0);
  debugCtx.restore();
}

function drawCircleOnSVG(): string {
  let pathData = '';

  // Find max radius across all circles to calculate scale factor
  let maxRadius = 0;
  for (const circleRadii of allCirclesRadii) {
    for (const r of circleRadii) {
      maxRadius = Math.max(maxRadius, r);
    }
  }

  // Calculate scale factor to normalize drawing to desired scale
  const scaleFactor = maxRadius > 0 ? scale / maxRadius : 1;

  // Generate path data for all circles
  for (let circleIndex = 0; circleIndex < allCirclesRadii.length; circleIndex++) {
    const circleRadii = allCirclesRadii[circleIndex];

    if (circleRadii.length === 0) {
      continue;
    }

    // Start path at the first point
    const firstPoint = polarToCartesian(circleIndex, 0, scaleFactor);
    pathData += `M ${firstPoint.x} ${firstPoint.y} `;

    // Add line segments to all other points
    for (let i = 1; i < circleRadii.length; i++) {
      const point = polarToCartesian(circleIndex, i, scaleFactor);
      pathData += `L ${point.x} ${point.y} `;
    }

    // Close the path
    pathData += 'Z ';
  }

  return pathData;
}

function exportSVG() {
  console.time("svg export");

  // Create a new SVG for export
  const exportSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  exportSVG.setAttribute('width', CANVAS_WIDTH.toString());
  exportSVG.setAttribute('height', CANVAS_HEIGHT.toString());
  exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add metadata with all parameter values
  const metadata = document.createElementNS("http://www.w3.org/2000/svg", "metadata");
  const metadataContent = `
Tree Ring Parameters:
=====================
Overall Settings:
  Number of Rings: ${numCircles}
  Scale: ${scale}
  Growth Model Blend: ${ringWidthFactor}

Generated: ${new Date().toISOString()}
  `;
  metadata.textContent = metadataContent;
  exportSVG.appendChild(metadata);

  // Add border rectangle
  const borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  borderRect.setAttribute("x", "25");
  borderRect.setAttribute("y", "25");
  borderRect.setAttribute("width", (CANVAS_WIDTH - 50).toString());
  borderRect.setAttribute("height", (CANVAS_HEIGHT - 75).toString());
  borderRect.setAttribute("fill", "none");
  borderRect.setAttribute("stroke", "black");
  borderRect.setAttribute("stroke-width", "1");
  exportSVG.appendChild(borderRect);

  // Add circle path
  const circlePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  circlePath.setAttribute("d", drawCircleOnSVG());
  circlePath.setAttribute("fill", "none");
  circlePath.setAttribute("stroke", "black");
  circlePath.setAttribute("stroke-width", "2");
  exportSVG.appendChild(circlePath);

  // Create text group
  let textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroup.setAttribute("transform", "translate(23.5, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

  const distanceBetweenLettersInOriginalFileSpace = 90;
  let stringToWrite = "TREE OF YOUR LIFE";

  for (let i = 0; i < stringToWrite.length; i++) {
    const letter = stringToWrite[i];
    if (letter === ' ') continue; // Skip spaces

    const offset = getLetterOffset(letter);
    let svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const xPosition = i * distanceBetweenLettersInOriginalFileSpace - offset.x;
    svgGroup.setAttribute("transform", `translate(${xPosition}, -${offset.y})`);
    svgGroup.setAttribute("fill", "none");
    svgGroup.setAttribute("stroke", "black");
    svgGroup.setAttribute("stroke-width", "3");
    svgGroup.innerHTML = getLetterSVGPath(letter);
    textGroup.appendChild(svgGroup);
  }

  exportSVG.appendChild(textGroup);

  // Now draw a second set of text on the right side
  let stringToWriteTwo = getYearRangeText();

  let textGroupRight = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroupRight.setAttribute("transform", "translate(395, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

  for (let i = 0; i < stringToWriteTwo.length; i++) {
    const letter = stringToWriteTwo[i];
    if (letter === ' ') continue; // Skip spaces

    const offset = getLetterOffset(letter);
    let svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const xPosition = i * distanceBetweenLettersInOriginalFileSpace - offset.x;
    svgGroup.setAttribute("transform", `translate(${xPosition}, -${offset.y})`);
    svgGroup.setAttribute("fill", "none");
    svgGroup.setAttribute("stroke", "black");
    svgGroup.setAttribute("stroke-width", "3");
    svgGroup.innerHTML = getLetterSVGPath(letter);
    textGroupRight.appendChild(svgGroup);
  }

  exportSVG.appendChild(textGroupRight);

  // Download the SVG
  const svgData = new XMLSerializer().serializeToString(exportSVG);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const downloadLink = document.createElement('a');
  downloadLink.href = svgUrl;
  downloadLink.download = 'tree.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(svgUrl);

  console.timeEnd("svg export");
}

function drawFavorabilityGraph() {
  const graphContainer = document.getElementById('favorability-graph');
  if (!graphContainer) return;

  graphContainer.innerHTML = '';

  const graphWidth = 400;
  const barHeight = 20;
  const padding = 2;
  const graphHeight = numCircles * (barHeight + padding) + 30;

  const graphCanvas = document.createElement('canvas');
  graphCanvas.width = graphWidth;
  graphCanvas.height = graphHeight;
  graphCanvas.style.width = graphWidth + 'px';
  graphCanvas.style.height = graphHeight + 'px';
  graphCanvas.style.border = '1px solid #ccc';
  graphCanvas.style.backgroundColor = 'white';

  const gctx = graphCanvas.getContext('2d')!;
  gctx.font = '9px Arial';

  // Calculate ranges for weather data if available
  let tempRange = { min: tempMin, max: tempMax };
  let dewRange = { min: dewMin, max: dewMax };

  // Draw bars and weather data
  for (let i = 0; i < favorabilityScores.length; i++) {
    const favorability = favorabilityScores[i];
    const maxBarWidth = 200;
    const barWidth = favorability * maxBarWidth;
    const y = 20 + i * (barHeight + padding);

    // Draw favorability bar
    gctx.fillStyle = '#4CAF50';
    gctx.fillRect(5, y, barWidth, barHeight);

    gctx.strokeStyle = '#388E3C';
    gctx.lineWidth = 0.5;
    gctx.strokeRect(5, y, barWidth, barHeight);

    // Draw favorability value
    const textX = 210;
    const textY = y + barHeight / 2 + 3;
    gctx.fillStyle = '#333';
    gctx.textAlign = 'left';
    gctx.fillText(favorability.toFixed(2), textX, textY);

    // Draw weather data if available
    if (loadedWeatherData && i < loadedWeatherData.length) {
      const weatherPoint = loadedWeatherData[i];
      const temp = weatherPoint.temperature_2m_mean;
      const dew = weatherPoint.dew_point_2m_mean;

      // Draw temperature
      gctx.fillStyle = '#e74c3c';
      gctx.fillText(`T:${temp.toFixed(1)}°`, 250, textY);

      // Draw dew point
      gctx.fillStyle = '#3498db';
      gctx.fillText(`D:${dew.toFixed(1)}°`, 315, textY);
    }
  }

  // Draw legend
  gctx.font = 'bold 10px Arial';
  gctx.fillStyle = '#4CAF50';
  gctx.fillText('Favorability', 5, 12);

  if (loadedWeatherData && loadedWeatherData.length > 0) {
    gctx.fillStyle = '#e74c3c';
    gctx.fillText('Temp', 250, 12);
    gctx.fillStyle = '#3498db';
    gctx.fillText('Dew', 315, 12);
  }

  graphContainer.appendChild(graphCanvas);
}

async function fetchSheetEntries(): Promise<SheetEntry[]> {
  try {
    const response = await fetch(SHEETS_API_URL);
    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching sheet entries:', error);
    return [];
  }
}

function displaySheetEntries(entries: SheetEntry[], container: HTMLElement) {
  container.innerHTML = '';

  if (entries.length === 0) {
    container.innerHTML = '<p style="color: #666; font-size: 12px; margin: 10px 0;">No entries found.</p>';
    return;
  }

  // Show only the 10 most recent
  const recentEntries = entries.slice(0, 10);

  const listContainer = document.createElement('div');
  listContainer.style.maxHeight = '300px';
  listContainer.style.overflowY = 'auto';
  listContainer.style.border = '1px solid #ddd';
  listContainer.style.borderRadius = '4px';
  listContainer.style.backgroundColor = 'white';

  recentEntries.forEach((entry) => {
    const entryDiv = document.createElement('div');
    entryDiv.style.padding = '10px';
    entryDiv.style.borderBottom = '1px solid #eee';
    entryDiv.style.cursor = 'pointer';
    entryDiv.style.fontSize = '12px';

    const timestamp = new Date(entry.timestamp);
    const formattedDate = timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString();

    entryDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${entry.name}</div>
      <div style="color: #666; font-size: 11px;">${formattedDate}</div>
    `;

    entryDiv.addEventListener('mouseenter', () => {
      entryDiv.style.backgroundColor = '#f5f5f5';
    });

    entryDiv.addEventListener('mouseleave', () => {
      entryDiv.style.backgroundColor = 'white';
    });

    entryDiv.addEventListener('click', () => {
      // Parse and store weather data
      try {
        const weatherData = JSON.parse(entry.data);
        loadedWeatherData = weatherData;

        // Set number of rings to match weather data length
        numCircles = weatherData.length;

        // Regenerate with new ring count
        generateCirclePoints();
        drawCircleOnCanvas();
        drawTextOnSVG(); // Update the year range text
        drawDebugView();
        drawFavorabilityGraph();
      } catch (error) {
        console.error('Error parsing weather data:', error);
      }
    });

    listContainer.appendChild(entryDiv);
  });

  container.appendChild(listContainer);
}

function setupControls() {
  if (controlsInitialized) return;

  const controlsContainer = document.getElementById('controls-container');
  if (controlsContainer) {
    // Clear existing controls
    controlsContainer.innerHTML = '';

    // Helper function to create a slider
    const createSlider = (label: string, paramConfig: any, currentValue: number, setValue: (value: number) => void) => {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.gap = '10px';
      container.style.marginBottom = '8px';

      const labelElement = document.createElement('div');
      labelElement.textContent = label;
      labelElement.style.fontWeight = 'bold';
      labelElement.style.fontSize = '12px';
      labelElement.style.minWidth = '140px';
      labelElement.style.flexShrink = '0';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = paramConfig.min.toString();
      slider.max = paramConfig.max.toString();
      slider.step = paramConfig.step.toString();
      slider.value = currentValue.toString();
      slider.style.flex = '1';

      const value = document.createElement('div');
      value.textContent = currentValue.toFixed(0);
      value.style.fontSize = '12px';
      value.style.minWidth = '40px';
      value.style.textAlign = 'right';
      value.style.flexShrink = '0';

      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const newValue = parseFloat(target.value);
        setValue(newValue);
        value.textContent = newValue.toFixed(0);
        generateCirclePoints();
        drawCircleOnCanvas();
        drawDebugView();
      });

      container.appendChild(labelElement);
      container.appendChild(slider);
      container.appendChild(value);
      controlsContainer.appendChild(container);

      return { slider, value };
    };

    // Helper function to create a decimal slider
    const createDecimalSlider = (label: string, paramConfig: any, currentValue: number, setValue: (value: number) => void) => {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.gap = '10px';
      container.style.marginBottom = '8px';

      const labelElement = document.createElement('div');
      labelElement.textContent = label;
      labelElement.style.fontWeight = 'bold';
      labelElement.style.fontSize = '12px';
      labelElement.style.minWidth = '140px';
      labelElement.style.flexShrink = '0';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = paramConfig.min.toString();
      slider.max = paramConfig.max.toString();
      slider.step = paramConfig.step.toString();
      slider.value = currentValue.toString();
      slider.style.flex = '1';

      const value = document.createElement('div');
      value.textContent = currentValue.toFixed(2);
      value.style.fontSize = '12px';
      value.style.minWidth = '40px';
      value.style.textAlign = 'right';
      value.style.flexShrink = '0';

      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const newValue = parseFloat(target.value);
        setValue(newValue);
        value.textContent = newValue.toFixed(2);
        generateCirclePoints();
        drawCircleOnCanvas();
        drawDebugView();
      });

      container.appendChild(labelElement);
      container.appendChild(slider);
      container.appendChild(value);
      controlsContainer.appendChild(container);

      return { slider, value };
    };

    const createSectionHeader = (text: string) => {
      const header = document.createElement('div');
      header.textContent = text;
      header.style.marginTop = '15px';
      header.style.marginBottom = '8px';
      header.style.fontWeight = 'bold';
      header.style.fontSize = '13px';
      header.style.borderBottom = '2px solid #333';
      header.style.paddingBottom = '3px';
      controlsContainer.appendChild(header);
    };

    // === OVERALL SETTINGS ===
    createSectionHeader('Overall Settings');
    createSlider('Number of Rings', PARAM_CONFIG.numCircles, numCircles, (v) => numCircles = Math.floor(v));
    createSlider('Scale (px)', PARAM_CONFIG.scale, scale, (v) => scale = v);
    createDecimalSlider('Growth Model Blend', PARAM_CONFIG.ringWidthFactor, ringWidthFactor, (v) => ringWidthFactor = v);

    // Effect contribution factors
    const contributionHeader = document.createElement('div');
    contributionHeader.textContent = 'Effect Contributions';
    contributionHeader.style.marginTop = '10px';
    contributionHeader.style.marginBottom = '8px';
    contributionHeader.style.fontWeight = 'bold';
    contributionHeader.style.fontSize = '11px';
    contributionHeader.style.color = '#666';
    controlsContainer.appendChild(contributionHeader);

    createDecimalSlider('Favorability', PARAM_CONFIG.favorabilityContribution, favorabilityContribution, (v) => {
      favorabilityContribution = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
      drawFavorabilityGraph();
    });
    createDecimalSlider('Gaussians', PARAM_CONFIG.gaussianContribution, gaussianContribution, (v) => {
      gaussianContribution = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Perlin Noise', PARAM_CONFIG.noiseContribution, noiseContribution, (v) => {
      noiseContribution = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });

    // Randomize Both button
    const randomizeBothButton = document.createElement('button');
    randomizeBothButton.textContent = 'Randomize Both (Seed + Gaussians)';
    randomizeBothButton.style.marginTop = '20px';
    randomizeBothButton.style.width = '100%';
    randomizeBothButton.style.backgroundColor = '#6f42c1';
    randomizeBothButton.style.color = 'white';
    randomizeBothButton.style.fontWeight = 'bold';
    randomizeBothButton.style.marginBottom = '10px';
    randomizeBothButton.addEventListener('click', () => {
      // Randomize seed
      const newSeed = Math.floor(Math.random() * 1000000);
      if (seedSliderElement && seedValueElement) {
        seedSliderElement.value = newSeed.toString();
        seedValueElement.textContent = newSeed.toFixed(0);
      }
      updateSeed(newSeed);

      // Regenerate gaussians
      gaussianList.length = 0;
      gaussianList.push(...generateRandomGaussians());
      if (renderGaussianControlsFunc) {
        renderGaussianControlsFunc();
      }
    });
    controlsContainer.appendChild(randomizeBothButton);

    // Save SVG button
    const saveSVGButton = document.createElement('button');
    saveSVGButton.id = 'saveSVG';
    saveSVGButton.textContent = 'Save SVG';
    saveSVGButton.style.width = '100%';
    saveSVGButton.style.backgroundColor = '#007bff';
    saveSVGButton.style.color = 'white';
    saveSVGButton.style.fontWeight = 'bold';
    saveSVGButton.addEventListener('click', exportSVG);
    controlsContainer.appendChild(saveSVGButton);

    // === GAUSSIAN DISTORTIONS ===
    createSectionHeader('Gaussian Distortions');

    // Gaussian random generation controls
    const gaussianRandomHeader = document.createElement('div');
    gaussianRandomHeader.textContent = 'Random Generation Parameters';
    gaussianRandomHeader.style.marginBottom = '8px';
    gaussianRandomHeader.style.fontWeight = 'bold';
    gaussianRandomHeader.style.fontSize = '11px';
    gaussianRandomHeader.style.color = '#666';
    controlsContainer.appendChild(gaussianRandomHeader);

    createSlider('Gaussian Count Min', PARAM_CONFIG.gaussianCountMin, gaussianCountMin, (v) => {
      gaussianCountMin = Math.floor(v);
    });
    createSlider('Gaussian Count Max', PARAM_CONFIG.gaussianCountMax, gaussianCountMax, (v) => {
      gaussianCountMax = Math.floor(v);
    });
    createDecimalSlider('Sigma Min', PARAM_CONFIG.gaussianSigmaMin, gaussianSigmaMin, (v) => {
      gaussianSigmaMin = v;
    });
    createDecimalSlider('Sigma Max', PARAM_CONFIG.gaussianSigmaMax, gaussianSigmaMax, (v) => {
      gaussianSigmaMax = v;
    });
    createDecimalSlider('Amplitude Min', PARAM_CONFIG.gaussianAmplitudeMin, gaussianAmplitudeMin, (v) => {
      gaussianAmplitudeMin = v;
    });
    createDecimalSlider('Amplitude Max', PARAM_CONFIG.gaussianAmplitudeMax, gaussianAmplitudeMax, (v) => {
      gaussianAmplitudeMax = v;
    });
    createSlider('Y From Min Range', PARAM_CONFIG.gaussianYFromMinRange, gaussianYFromMinRange, (v) => {
      gaussianYFromMinRange = Math.floor(v);
    });
    createSlider('Y From Max Range', PARAM_CONFIG.gaussianYFromMaxRange, gaussianYFromMaxRange, (v) => {
      gaussianYFromMaxRange = Math.floor(v);
    });

    // Regenerate Gaussians button
    const regenerateGaussiansBtn = document.createElement('button');
    regenerateGaussiansBtn.textContent = 'Regenerate Gaussians';
    regenerateGaussiansBtn.style.width = '100%';
    regenerateGaussiansBtn.style.padding = '8px';
    regenerateGaussiansBtn.style.marginBottom = '15px';
    regenerateGaussiansBtn.style.backgroundColor = '#17a2b8';
    regenerateGaussiansBtn.style.color = 'white';
    regenerateGaussiansBtn.style.border = 'none';
    regenerateGaussiansBtn.style.borderRadius = '4px';
    regenerateGaussiansBtn.style.cursor = 'pointer';
    regenerateGaussiansBtn.style.fontWeight = 'bold';
    regenerateGaussiansBtn.addEventListener('click', () => {
      gaussianList.length = 0; // Clear array
      gaussianList.push(...generateRandomGaussians()); // Add new random Gaussians
      renderGaussianControls();
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    controlsContainer.appendChild(regenerateGaussiansBtn);

    const gaussiansContainer = document.createElement('div');
    gaussiansContainer.id = 'gaussians-container';
    gaussiansContainer.style.marginBottom = '15px';
    controlsContainer.appendChild(gaussiansContainer);

    // Function to render all gaussian controls
    const renderGaussianControls = () => {
      gaussiansContainer.innerHTML = '';

      gaussianList.forEach((gaussian, index) => {
        const gaussianCard = document.createElement('div');
        gaussianCard.style.border = '1px solid #ddd';
        gaussianCard.style.borderRadius = '4px';
        gaussianCard.style.padding = '10px';
        gaussianCard.style.marginBottom = '10px';
        gaussianCard.style.backgroundColor = '#f9f9f9';

        // Header with index and delete button
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '8px';

        const title = document.createElement('div');
        title.textContent = `Gaussian ${index + 1}`;
        title.style.fontWeight = 'bold';
        title.style.fontSize = '12px';

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.padding = '4px 8px';
        deleteBtn.style.fontSize = '11px';
        deleteBtn.style.backgroundColor = '#dc3545';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '3px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', () => {
          gaussianList.splice(index, 1);
          renderGaussianControls();
          generateCirclePoints();
          drawCircleOnCanvas();
          drawDebugView();
        });

        header.appendChild(title);
        header.appendChild(deleteBtn);
        gaussianCard.appendChild(header);

        // Create a mini controls container for this gaussian
        const miniControlsContainer = document.createElement('div');
        gaussianCard.appendChild(miniControlsContainer);

        // Helper to create slider in mini container
        const createMiniSlider = (label: string, min: number, max: number, step: number, currentValue: number, setValue: (v: number) => void, decimals: number = 2) => {
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.gap = '10px';
          container.style.marginBottom = '6px';

          const labelElement = document.createElement('div');
          labelElement.textContent = label;
          labelElement.style.fontSize = '11px';
          labelElement.style.minWidth = '100px';
          labelElement.style.flexShrink = '0';

          const slider = document.createElement('input');
          slider.type = 'range';
          slider.min = min.toString();
          slider.max = max.toString();
          slider.step = step.toString();
          slider.value = currentValue.toString();
          slider.style.flex = '1';

          const value = document.createElement('div');
          value.textContent = currentValue.toFixed(decimals);
          value.style.fontSize = '11px';
          value.style.minWidth = '40px';
          value.style.textAlign = 'right';
          value.style.flexShrink = '0';

          slider.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const newValue = parseFloat(target.value);
            setValue(newValue);
            value.textContent = newValue.toFixed(decimals);
            generateCirclePoints();
            drawCircleOnCanvas();
            drawDebugView();
          });

          container.appendChild(labelElement);
          container.appendChild(slider);
          container.appendChild(value);
          miniControlsContainer.appendChild(container);
        };

        // Center Angle slider (0 to 2π)
        createMiniSlider('Center Angle', 0, Math.PI * 2, 0.1, gaussian.centerAngle,
          (v) => { gaussian.centerAngle = v; }, 2);

        // Y Remap From Min
        createMiniSlider('Y From Min', 0, 100, 1, gaussian.yRemapFrom[0],
          (v) => { gaussian.yRemapFrom[0] = v; }, 0);

        // Y Remap From Max
        createMiniSlider('Y From Max', 0, 100, 1, gaussian.yRemapFrom[1],
          (v) => { gaussian.yRemapFrom[1] = v; }, 0);

        // Sigma slider
        createMiniSlider('Sigma', 0.1, 3, 0.05, gaussian.sigma,
          (v) => { gaussian.sigma = v; }, 2);

        // Amplitude slider (logarithmic)
        // We use log10 scale: slider goes from -2 to 2, amplitude is 10^slider
        // This gives range from 0.01 to 100
        const amplitudeLogValue = Math.log10(gaussian.amplitude);

        const createLogAmplitudeSlider = () => {
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.gap = '10px';
          container.style.marginBottom = '6px';

          const labelElement = document.createElement('div');
          labelElement.textContent = 'Amplitude (log)';
          labelElement.style.fontSize = '11px';
          labelElement.style.minWidth = '100px';
          labelElement.style.flexShrink = '0';

          const slider = document.createElement('input');
          slider.type = 'range';
          slider.min = '-2';
          slider.max = '2';
          slider.step = '0.05';
          slider.value = amplitudeLogValue.toString();
          slider.style.flex = '1';

          const value = document.createElement('div');
          value.textContent = gaussian.amplitude.toFixed(2);
          value.style.fontSize = '11px';
          value.style.minWidth = '40px';
          value.style.textAlign = 'right';
          value.style.flexShrink = '0';

          slider.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const logValue = parseFloat(target.value);
            const actualAmplitude = Math.pow(10, logValue);
            gaussian.amplitude = actualAmplitude;
            value.textContent = actualAmplitude.toFixed(2);
            generateCirclePoints();
            drawCircleOnCanvas();
            drawDebugView();
          });

          container.appendChild(labelElement);
          container.appendChild(slider);
          container.appendChild(value);
          miniControlsContainer.appendChild(container);
        };

        createLogAmplitudeSlider();

        gaussiansContainer.appendChild(gaussianCard);
      });
    };

    // Add Gaussian button
    const addGaussianBtn = document.createElement('button');
    addGaussianBtn.textContent = 'Add Gaussian';
    addGaussianBtn.style.width = '100%';
    addGaussianBtn.style.padding = '8px';
    addGaussianBtn.style.marginBottom = '10px';
    addGaussianBtn.style.backgroundColor = '#28a745';
    addGaussianBtn.style.color = 'white';
    addGaussianBtn.style.border = 'none';
    addGaussianBtn.style.borderRadius = '4px';
    addGaussianBtn.style.cursor = 'pointer';
    addGaussianBtn.style.fontWeight = 'bold';
    addGaussianBtn.addEventListener('click', () => {
      gaussianList.push({
        centerAngle: 0,
        yRemapFrom: [0, 20],
        sigma: 1,
        amplitude: 1
      });
      renderGaussianControls();
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    controlsContainer.appendChild(addGaussianBtn);

    // Initial render
    renderGaussianControls();

    // Store reference for randomize both button
    renderGaussianControlsFunc = renderGaussianControls;

    // === PERLIN NOISE PARAMETERS ===
    createSectionHeader('Perlin Noise (Multi-scale)');

    // Seed control with randomize button
    const seedContainer = document.createElement('div');
    seedContainer.style.display = 'flex';
    seedContainer.style.alignItems = 'center';
    seedContainer.style.gap = '10px';
    seedContainer.style.marginBottom = '8px';

    const seedLabelElement = document.createElement('div');
    seedLabelElement.textContent = 'Seed';
    seedLabelElement.style.fontWeight = 'bold';
    seedLabelElement.style.fontSize = '12px';
    seedLabelElement.style.minWidth = '140px';
    seedLabelElement.style.flexShrink = '0';

    seedSliderElement = document.createElement('input');
    seedSliderElement.type = 'range';
    seedSliderElement.min = PARAM_CONFIG.seed.min.toString();
    seedSliderElement.max = PARAM_CONFIG.seed.max.toString();
    seedSliderElement.step = PARAM_CONFIG.seed.step.toString();
    seedSliderElement.value = seed.toString();
    seedSliderElement.style.flex = '1';

    seedValueElement = document.createElement('div');
    seedValueElement.textContent = seed.toFixed(0);
    seedValueElement.style.fontSize = '12px';
    seedValueElement.style.minWidth = '60px';
    seedValueElement.style.textAlign = 'right';
    seedValueElement.style.flexShrink = '0';

    const randomizeBtn = document.createElement('button');
    randomizeBtn.textContent = 'Random';
    randomizeBtn.style.padding = '4px 8px';
    randomizeBtn.style.fontSize = '11px';
    randomizeBtn.style.backgroundColor = '#6c757d';
    randomizeBtn.style.color = 'white';
    randomizeBtn.style.border = 'none';
    randomizeBtn.style.borderRadius = '3px';
    randomizeBtn.style.cursor = 'pointer';
    randomizeBtn.style.flexShrink = '0';

    seedSliderElement.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const newValue = parseFloat(target.value);
      seedValueElement.textContent = newValue.toFixed(0);
      updateSeed(newValue);
    });

    randomizeBtn.addEventListener('click', () => {
      const newSeed = Math.floor(Math.random() * 1000000);
      seedSliderElement.value = newSeed.toString();
      seedValueElement.textContent = newSeed.toFixed(0);
      updateSeed(newSeed);
    });

    seedContainer.appendChild(seedLabelElement);
    seedContainer.appendChild(seedSliderElement);
    seedContainer.appendChild(seedValueElement);
    seedContainer.appendChild(randomizeBtn);
    controlsContainer.appendChild(seedContainer);

    createSlider('Noise Octaves', PARAM_CONFIG.noiseOctaves, noiseOctaves, (v) => {
      noiseOctaves = Math.floor(v);
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });

    // Fine detail layer
    createDecimalSlider('Fine Freq', PARAM_CONFIG.fineDetailFreq, fineDetailFreq, (v) => {
      fineDetailFreq = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Fine Amp', PARAM_CONFIG.fineDetailAmp, fineDetailAmp, (v) => {
      fineDetailAmp = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Fine Ring Offset', PARAM_CONFIG.fineRingOffset, fineRingOffset, (v) => {
      fineRingOffset = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });

    // Medium detail layer
    createDecimalSlider('Medium Freq', PARAM_CONFIG.mediumDetailFreq, mediumDetailFreq, (v) => {
      mediumDetailFreq = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Medium Amp', PARAM_CONFIG.mediumDetailAmp, mediumDetailAmp, (v) => {
      mediumDetailAmp = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Medium Ring Offset', PARAM_CONFIG.mediumRingOffset, mediumRingOffset, (v) => {
      mediumRingOffset = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });

    // Coarse detail layer
    createDecimalSlider('Coarse Freq', PARAM_CONFIG.coarseDetailFreq, coarseDetailFreq, (v) => {
      coarseDetailFreq = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Coarse Amp', PARAM_CONFIG.coarseDetailAmp, coarseDetailAmp, (v) => {
      coarseDetailAmp = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Coarse Ring Offset', PARAM_CONFIG.coarseRingOffset, coarseRingOffset, (v) => {
      coarseRingOffset = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });

    // === SMOOTHING PARAMETERS ===
    createSectionHeader('Smoothing');

    createSlider('Smoothing Base', PARAM_CONFIG.smoothingBase, smoothingBase, (v) => {
      smoothingBase = Math.floor(v);
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createSlider('Smoothing Inner', PARAM_CONFIG.smoothingInner, smoothingInner, (v) => {
      smoothingInner = Math.floor(v);
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });
    createDecimalSlider('Smoothing Falloff', PARAM_CONFIG.smoothingFalloff, smoothingFalloff, (v) => {
      smoothingFalloff = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
    });

    // === WEATHER DATA MAPPING ===
    createSectionHeader('Weather Data Mapping');

    // Temperature controls
    createSlider('Temp Min (°C)', PARAM_CONFIG.tempMin, tempMin, (v) => {
      tempMin = Math.floor(v);
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
      drawFavorabilityGraph();
    });
    createSlider('Temp Max (°C)', PARAM_CONFIG.tempMax, tempMax, (v) => {
      tempMax = Math.floor(v);
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
      drawFavorabilityGraph();
    });
    createDecimalSlider('Temp Contribution', PARAM_CONFIG.tempContribution, tempContribution, (v) => {
      tempContribution = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
      drawFavorabilityGraph();
    });

    // Dew point controls
    createSlider('Dew Min (°C)', PARAM_CONFIG.dewMin, dewMin, (v) => {
      dewMin = Math.floor(v);
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
      drawFavorabilityGraph();
    });
    createSlider('Dew Max (°C)', PARAM_CONFIG.dewMax, dewMax, (v) => {
      dewMax = Math.floor(v);
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
      drawFavorabilityGraph();
    });
    createDecimalSlider('Dew Contribution', PARAM_CONFIG.dewContribution, dewContribution, (v) => {
      dewContribution = v;
      generateCirclePoints();
      drawCircleOnCanvas();
      drawDebugView();
      drawFavorabilityGraph();
    });

    // Add favorability graph container
    const graphTitle = document.createElement('div');
    graphTitle.textContent = 'Favorability & Weather Data';
    graphTitle.style.marginTop = '15px';
    graphTitle.style.marginBottom = '8px';
    graphTitle.style.fontWeight = 'bold';
    graphTitle.style.fontSize = '12px';
    controlsContainer.appendChild(graphTitle);

    const graphContainer = document.createElement('div');
    graphContainer.id = 'favorability-graph';
    graphContainer.style.marginBottom = '15px';
    controlsContainer.appendChild(graphContainer);

    // Draw initial graph
    drawFavorabilityGraph();

    // === LOAD WEATHER DATA ===
    createSectionHeader('Load Weather Data');

    // Load button
    const loadDataButton = document.createElement('button');
    loadDataButton.textContent = 'Load from Database';
    loadDataButton.style.width = '100%';
    loadDataButton.style.marginBottom = '10px';
    loadDataButton.style.padding = '8px';
    loadDataButton.style.backgroundColor = '#6c757d';
    loadDataButton.style.color = 'white';
    loadDataButton.style.border = 'none';
    loadDataButton.style.borderRadius = '4px';
    loadDataButton.style.cursor = 'pointer';
    loadDataButton.style.fontWeight = 'bold';

    const entriesContainer = document.createElement('div');
    entriesContainer.id = 'weather-entries-container';
    entriesContainer.style.marginBottom = '15px';

    loadDataButton.addEventListener('click', async () => {
      loadDataButton.disabled = true;
      loadDataButton.textContent = 'Loading...';

      const entries = await fetchSheetEntries();
      displaySheetEntries(entries, entriesContainer);

      loadDataButton.disabled = false;
      loadDataButton.textContent = 'Reload from Database';
    });

    loadDataButton.addEventListener('mouseenter', () => {
      if (!loadDataButton.disabled) {
        loadDataButton.style.backgroundColor = '#5a6268';
      }
    });

    loadDataButton.addEventListener('mouseleave', () => {
      if (!loadDataButton.disabled) {
        loadDataButton.style.backgroundColor = '#6c757d';
      }
    });

    controlsContainer.appendChild(loadDataButton);
    controlsContainer.appendChild(entriesContainer);

    // === DEBUG VIEW SETTINGS ===
    createSectionHeader('Debug View');

    // Checkbox for accumulating mode
    const debugCheckboxContainer = document.createElement('div');
    debugCheckboxContainer.style.marginBottom = '8px';

    const debugCheckbox = document.createElement('input');
    debugCheckbox.type = 'checkbox';
    debugCheckbox.id = 'debug-accumulating';
    debugCheckbox.checked = debugAccumulating;
    debugCheckbox.style.marginRight = '8px';

    const debugLabel = document.createElement('label');
    debugLabel.htmlFor = 'debug-accumulating';
    debugLabel.textContent = 'Show Accumulating Rings (vs. Individual Widths)';
    debugLabel.style.cursor = 'pointer';
    debugLabel.style.fontSize = '12px';

    debugCheckbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      debugAccumulating = target.checked;
      drawDebugView();
    });

    debugCheckboxContainer.appendChild(debugCheckbox);
    debugCheckboxContainer.appendChild(debugLabel);
    controlsContainer.appendChild(debugCheckboxContainer);

    controlsInitialized = true;
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  if (!isInitialized) {
    initializeCanvasAndSVG();
    setupControls();

    // Auto-load weather data from database
    const entries = await fetchSheetEntries();
    const entriesContainer = document.getElementById('weather-entries-container');
    if (entriesContainer) {
      displaySheetEntries(entries, entriesContainer);
    }
  }
});

// Handle case where DOM is already loaded
if (document.readyState !== 'loading' && !isInitialized) {
  initializeCanvasAndSVG();
  setupControls();

  // Auto-load weather data from database
  (async () => {
    const entries = await fetchSheetEntries();
    const entriesContainer = document.getElementById('weather-entries-container');
    if (entriesContainer) {
      displaySheetEntries(entries, entriesContainer);
    }
  })();
}
