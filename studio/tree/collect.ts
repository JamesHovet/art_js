export {};

import { fetchWeatherApi } from 'openmeteo';
import { PARAM_CONFIG, TreeParams, WeatherDataPoint, draw, CANVAS_WIDTH, CANVAS_HEIGHT } from './drawing';
import { saveEntry } from '../shared/sheets';
import { buildTextGroup } from '../shared/svgLabels';

// ===== INTERFACES =====

interface GeocodingResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: string[];
  class?: string;
  type?: string;
}

interface YearLocation {
  year: number;
  location: GeocodingResult | null;
}

// ===== GLOBAL STATE =====

let birthYear: number | null = null;
let birthLocation: GeocodingResult | null = null;
let yearLocations: YearLocation[] = [];
let searchDebounceTimer: number | null = null;
let currentEditingRow: number | null = null;

let currentWeatherData: WeatherDataPoint[] = [];
let currentParams: TreeParams = buildDefaultParams();
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let svgOverlay: SVGSVGElement | null = null;

const COLORS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
];
const locationColors = new Map<string, string>();

// ===== ABSTRACTION LAYER STATE =====

let unevenness = 0.5;
let coarseness = 0.5;
let useStrategyA = false; // Strategy C (amp=t², sigma=√t)
let dataBlend = 0.3; // 0=global reference window, 1=tight around data
const unevCurve = 0.3;   // power curve for unevenness slider: t^p, p<1 spreads effect toward low end
const coarseCurve = 0.35; // power curve for coarseness slider

// Anchors: .a = value when slider=0, .b = value when slider=1
const unevAnchors = {
  gaussianCountMin: { a: 2,    b: 5    },
  gaussianCountMax: { a: 4,    b: 11   },
  gaussianAmpMin:   { a: 0.60, b: 0.50 },
  gaussianAmpMax:   { a: 2.20, b: 2.80 },
  gaussianSigmaMin: { a: 2.10, b: 0.20 }, // inverted: high sigma = rounder blobs at low unevenness
  gaussianSigmaMax: { a: 2.45, b: 0.40 }, // inverted: high sigma = rounder blobs at low unevenness
  coarseAmp:        { a: 0.05, b: 0.90 },
  coarseFreq:       { a: 0.80, b: 2.80 },
};

// a=smooth(coarseness=0), b=coarse(coarseness=1)
const coarseAnchors = {
  smoothingBase:  { a: 14,  b: 1    },
  smoothingInner: { a: 30,  b: 30   },
  fineAmp:        { a: 0.1, b: 2.7  },
  fineFreq:       { a: 1.0, b: 11.8 },
};

// Maps TreeParams key → display element for live computed values
const computedDisplays = new Map<string, HTMLElement>();

// ===== ABSTRACTION FUNCTIONS =====

function lp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function curved(t: number, p: number): number {
  return Math.pow(t, p);
}

function applyUnevenness(t: number): void {
  const a = unevAnchors;
  // Strategy A: linear. Strategy C: amplitude=t², sigma=√t, count/coarse=linear.
  const tAmp   = useStrategyA ? t : t * t;
  const tSigma = useStrategyA ? t : Math.sqrt(t);

  currentParams.gaussianCountMin     = Math.round(lp(a.gaussianCountMin.a, a.gaussianCountMin.b, t));
  currentParams.gaussianCountMax     = Math.round(lp(a.gaussianCountMax.a, a.gaussianCountMax.b, t));
  currentParams.gaussianAmplitudeMin = lp(a.gaussianAmpMin.a, a.gaussianAmpMin.b, tAmp);
  currentParams.gaussianAmplitudeMax = lp(a.gaussianAmpMax.a, a.gaussianAmpMax.b, tAmp);
  currentParams.gaussianSigmaMin     = lp(a.gaussianSigmaMin.a, a.gaussianSigmaMin.b, tSigma);
  currentParams.gaussianSigmaMax     = lp(a.gaussianSigmaMax.a, a.gaussianSigmaMax.b, tSigma);
  currentParams.coarseDetailAmp      = lp(a.coarseAmp.a, a.coarseAmp.b, t);
  currentParams.coarseDetailFreq     = lp(a.coarseFreq.a, a.coarseFreq.b, t);

  updateComputedDisplays();
}

function applyCoarseness(s: number): void {
  const c = coarseAnchors;
  // Strategy A: linear. Strategy C: smoothingBase=s², fineAmp=√s, rest=linear.
  const s2    = useStrategyA ? s : s * s;
  const sSqrt = useStrategyA ? s : Math.sqrt(s);

  currentParams.smoothingBase  = Math.round(lp(c.smoothingBase.a, c.smoothingBase.b, s2));
  currentParams.smoothingInner = Math.round(lp(c.smoothingInner.a, c.smoothingInner.b, s));
  currentParams.fineDetailAmp  = lp(c.fineAmp.a, c.fineAmp.b, sSqrt);
  currentParams.fineDetailFreq = lp(c.fineFreq.a, c.fineFreq.b, s);

  updateComputedDisplays();
}

function updateComputedDisplays(): void {
  computedDisplays.forEach((el, key) => {
    const v = (currentParams as any)[key] as number;
    el.textContent = Number.isInteger(v) ? String(v) : v.toFixed(3);
  });
}

// Global reference windows — the "objective" scale
const GLOBAL_TEMP_MIN = -10;
const GLOBAL_TEMP_MAX = 30;
const GLOBAL_DEW_MIN = -20;
const GLOBAL_DEW_MAX = 20;

function autoSetWeatherMinMax(): void {
  // dataBlend=0: use global reference window (less within-data variation, more objective scale)
  // dataBlend=1: window fits the data tightly (maximises within-data variation)
  function computeRange(values: number[], gMin: number, gMax: number): [number, number] {
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const dMin = lp(gMin, dataMin, dataBlend);
    const dMax = lp(gMax, dataMax, dataBlend);
    if (dMax - dMin < 8) {
      const mid = (dMin + dMax) / 2;
      return [Math.round(mid - 4), Math.round(mid + 4)];
    }
    return [Math.round(dMin), Math.round(dMax)];
  }

  const temps = currentWeatherData
    .map(d => d.temperature_2m_mean)
    .filter((v): v is number => typeof v === 'number');
  const dews = currentWeatherData
    .map(d => d.dew_point_2m_mean)
    .filter((v): v is number => typeof v === 'number');

  if (temps.length > 0) {
    const [mn, mx] = computeRange(temps, GLOBAL_TEMP_MIN, GLOBAL_TEMP_MAX);
    currentParams.tempMin = mn;
    currentParams.tempMax = mx;
  }
  if (dews.length > 0) {
    const [mn, mx] = computeRange(dews, GLOBAL_DEW_MIN, GLOBAL_DEW_MAX);
    currentParams.dewMin = mn;
    currentParams.dewMax = mx;
  }
}

function buildDefaultParams(): TreeParams {
  return {
    scale: PARAM_CONFIG.scale.default,
    ringWidthFactor: PARAM_CONFIG.ringWidthFactor.default,
    numCircles: PARAM_CONFIG.numCircles.default,
    favorabilityContribution: PARAM_CONFIG.favorabilityContribution.default,
    gaussianContribution: PARAM_CONFIG.gaussianContribution.default,
    noiseContribution: PARAM_CONFIG.noiseContribution.default,
    tempMin: PARAM_CONFIG.tempMin.default,
    tempMax: PARAM_CONFIG.tempMax.default,
    tempContribution: PARAM_CONFIG.tempContribution.default,
    dewMin: PARAM_CONFIG.dewMin.default,
    dewMax: PARAM_CONFIG.dewMax.default,
    dewContribution: PARAM_CONFIG.dewContribution.default,
    fineDetailFreq: PARAM_CONFIG.fineDetailFreq.default,
    fineDetailAmp: PARAM_CONFIG.fineDetailAmp.default,
    mediumDetailFreq: PARAM_CONFIG.mediumDetailFreq.default,
    mediumDetailAmp: PARAM_CONFIG.mediumDetailAmp.default,
    coarseDetailFreq: PARAM_CONFIG.coarseDetailFreq.default,
    coarseDetailAmp: PARAM_CONFIG.coarseDetailAmp.default,
    fineRingOffset: PARAM_CONFIG.fineRingOffset.default,
    mediumRingOffset: PARAM_CONFIG.mediumRingOffset.default,
    coarseRingOffset: PARAM_CONFIG.coarseRingOffset.default,
    noiseOctaves: PARAM_CONFIG.noiseOctaves.default,
    smoothingBase: PARAM_CONFIG.smoothingBase.default,
    smoothingInner: PARAM_CONFIG.smoothingInner.default,
    smoothingFalloff: PARAM_CONFIG.smoothingFalloff.default,
    noiseSeed: PARAM_CONFIG.noiseSeed.default,
    gaussianSeed: PARAM_CONFIG.gaussianSeed.default,
    gaussianCountMin: PARAM_CONFIG.gaussianCountMin.default,
    gaussianCountMax: PARAM_CONFIG.gaussianCountMax.default,
    gaussianSigmaMin: PARAM_CONFIG.gaussianSigmaMin.default,
    gaussianSigmaMax: PARAM_CONFIG.gaussianSigmaMax.default,
    gaussianAmplitudeMin: PARAM_CONFIG.gaussianAmplitudeMin.default,
    gaussianAmplitudeMax: PARAM_CONFIG.gaussianAmplitudeMax.default,
    gaussianYFromMinRange: PARAM_CONFIG.gaussianYFromMinRange.default,
    gaussianYFromMaxRange: PARAM_CONFIG.gaussianYFromMaxRange.default,
  };
}

// ===== GEOCODING FUNCTIONS (verbatim from tree_timeline.ts) =====

async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (query.length < 2) return [];

  try {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&addressdetails=1&limit=15&featureType=city';
    const response = await fetch(url);
    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

function getLocationDisplayName(location: GeocodingResult): string {
  return location.display_name;
}

function getSimpleLocationName(location: GeocodingResult): string {
  if (location.address?.city) return location.address.city;
  if (location.address?.town) return location.address.town;
  if (location.address?.village) return location.address.village;
  if (location.address?.state) return location.address.state;
  if (location.address?.country) return location.address.country;

  const firstPart = location.display_name.split(',')[0].trim();
  return firstPart || location.display_name;
}

function getLocationKey(location: GeocodingResult): string {
  const lat = parseFloat(location.lat);
  const lon = parseFloat(location.lon);
  return lat.toFixed(4) + ',' + lon.toFixed(4);
}

function getColorForLocation(location: GeocodingResult): string {
  const key = getLocationKey(location);
  if (!locationColors.has(key)) {
    const colorIndex = locationColors.size % COLORS.length;
    locationColors.set(key, COLORS[colorIndex]);
  }
  return locationColors.get(key)!;
}

function generateYearsTable() {
  if (!birthYear || !birthLocation) return;

  const currentYear = 2025;
  yearLocations = [];

  for (let year = birthYear; year <= currentYear; year++) {
    yearLocations.push({ year, location: birthLocation });
  }

  renderTable();

  const tableSection = document.getElementById('table-section');
  if (tableSection) {
    tableSection.classList.remove('hidden');
  }
}

function renderTable() {
  const tbody = document.getElementById('years-tbody');
  if (!tbody) return;

  tbody.innerHTML = yearLocations.map((yearLoc, index) => {
    const location = yearLoc.location;
    const displayName = location ? getLocationDisplayName(location) : 'No location';
    const color = location ? getColorForLocation(location) : '#ccc';
    const age = yearLoc.year - birthYear!;

    return '<tr>' +
      '<td>' + yearLoc.year + ' (' + age + ')</td>' +
      '<td class="location-cell" data-row-index="' + index + '" style="border-left: 4px solid ' + color + ';">' +
        '<span class="location-name">' + displayName + '</span>' +
      '</td>' +
    '</tr>';
  }).join('');

  const locationCells = tbody.querySelectorAll('.location-cell');
  locationCells.forEach((cell) => {
    cell.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const rowIndex = parseInt(target.dataset.rowIndex || '0', 10);
      startInlineEdit(rowIndex, target);
    });
  });
}

function startInlineEdit(rowIndex: number, cell: HTMLElement) {
  if (currentEditingRow !== null) return;
  currentEditingRow = rowIndex;

  const currentLocation = yearLocations[rowIndex].location;
  const currentName = currentLocation ? getLocationDisplayName(currentLocation) : '';

  cell.innerHTML = '<input type="text" class="inline-search" value="' + currentName.replace(/"/g, '&quot;') + '" placeholder="Search for location...">';

  const input = cell.querySelector('.inline-search') as HTMLInputElement;
  input.focus();
  input.select();

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'search-results';
  resultsContainer.style.position = 'absolute';
  resultsContainer.style.zIndex = '1000';
  resultsContainer.style.width = cell.offsetWidth + 'px';
  cell.style.position = 'relative';
  cell.appendChild(resultsContainer);

  input.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value;

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    if (query.length >= 2) {
      resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
      resultsContainer.classList.remove('hidden');
    } else {
      resultsContainer.innerHTML = '';
      resultsContainer.classList.add('hidden');
    }

    searchDebounceTimer = window.setTimeout(async () => {
      const results = await searchLocations(query);
      displaySearchResults(results, resultsContainer, (location) => {
        updateLocationAndDownfill(rowIndex, location);
        currentEditingRow = null;
        renderTable();
      });
    }, 1000);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (currentEditingRow === rowIndex) {
        currentEditingRow = null;
        renderTable();
      }
    }, 200);
  });
}

function displaySearchResults(
  results: GeocodingResult[],
  container: HTMLElement,
  onSelect: (location: GeocodingResult) => void
) {
  if (results.length === 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.innerHTML = results.map((location, index) => {
    const displayName = getLocationDisplayName(location);
    return '<div class="search-result-item" data-index="' + index + '">' + displayName + '</div>';
  }).join('');

  container.classList.remove('hidden');

  const items = container.querySelectorAll('.search-result-item');
  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      onSelect(results[index]);
      container.innerHTML = '';
      container.classList.add('hidden');
    });
  });
}

function updateLocationAndDownfill(startIndex: number, newLocation: GeocodingResult) {
  const oldLocation = yearLocations[startIndex].location;
  const oldLocationKey = oldLocation ? getLocationKey(oldLocation) : null;

  yearLocations[startIndex].location = newLocation;

  for (let i = startIndex + 1; i < yearLocations.length; i++) {
    const currentLocation = yearLocations[i].location;
    const currentLocationKey = currentLocation ? getLocationKey(currentLocation) : null;

    if (currentLocationKey !== oldLocationKey) {
      break;
    }

    yearLocations[i].location = newLocation;
  }
}

// ===== WEATHER DATA FUNCTIONS (verbatim from tree_timeline.ts) =====

async function fetchWeatherData(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    const params = {
      latitude,
      longitude,
      start_date: startDate,
      end_date: endDate,
      daily: ['temperature_2m_mean', 'dew_point_2m_mean', 'relative_humidity_2m_mean', 'precipitation_sum'],
    };
    const url = 'https://archive-api.open-meteo.com/v1/archive';
    const responses = await fetchWeatherApi(url, params);

    const response = responses[0];
    const daily = response.daily()!;
    const utcOffsetSeconds = response.utcOffsetSeconds();

    const weatherData = {
      daily: {
        time: Array.from(
          { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
          (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
        ),
        temperature_2m_mean: daily.variables(0)!.valuesArray(),
        dew_point_2m_mean: daily.variables(1)!.valuesArray(),
        relative_humidity_2m_mean: daily.variables(2)!.valuesArray(),
        precipitation_sum: daily.variables(3)!.valuesArray(),
      },
    };

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

function calculateYearlyAverage(weatherData: any): {
  temperature_2m_mean: number;
  dew_point_2m_mean: number;
  relative_humidity_2m_mean: number;
  precipitation_sum: number;
} {
  let tempSum = 0, dewSum = 0, humiditySum = 0, precipSum = 0;
  let count = 0;

  for (let i = 0; i < weatherData.daily.time.length; i++) {
    tempSum += weatherData.daily.temperature_2m_mean[i] || 0;
    dewSum += weatherData.daily.dew_point_2m_mean[i] || 0;
    humiditySum += weatherData.daily.relative_humidity_2m_mean[i] || 0;
    precipSum += weatherData.daily.precipitation_sum[i] || 0;
    count++;
  }

  return {
    temperature_2m_mean: count > 0 ? tempSum / count : 0,
    dew_point_2m_mean: count > 0 ? dewSum / count : 0,
    relative_humidity_2m_mean: count > 0 ? humiditySum / count : 0,
    precipitation_sum: precipSum,
  };
}

// ===== PHASE 2 FUNCTIONS =====

function initCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  container.innerHTML = '';
  container.style.position = 'relative';

  const dpr = window.devicePixelRatio || 1;
  canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.aspectRatio = '1 / 1';
  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  container.appendChild(canvas);

  svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
  svgOverlay.setAttribute('viewBox', '0 0 ' + CANVAS_WIDTH + ' ' + CANVAS_HEIGHT);
  svgOverlay.style.position = 'absolute';
  svgOverlay.style.top = '0';
  svgOverlay.style.left = '0';
  svgOverlay.style.width = '100%';
  svgOverlay.style.height = '100%';
  svgOverlay.style.pointerEvents = 'none';
  container.appendChild(svgOverlay);
}

function updateSVGOverlay(): void {
  if (!svgOverlay) return;
  svgOverlay.innerHTML = '';

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '25');
  rect.setAttribute('y', '25');
  rect.setAttribute('width', String(CANVAS_WIDTH - 50));
  rect.setAttribute('height', String(CANVAS_HEIGHT - 75));
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', 'black');
  rect.setAttribute('stroke-width', '1');
  svgOverlay.appendChild(rect);

  if (currentWeatherData.length > 0) {
    const yearRange = currentWeatherData[0].year + '-' + currentWeatherData[currentWeatherData.length - 1].year;
    buildTextGroup(svgOverlay, yearRange, 395, CANVAS_HEIGHT - 15);
  }
}

function drawTree() {
  if (!ctx) return;
  draw(ctx, currentParams, currentWeatherData);
  updateSVGOverlay();
}

// ===== CONTROLS =====

function setupControls() {
  const container = document.getElementById('controls-container');
  if (!container) return;
  container.innerHTML = '';
  computedDisplays.clear();

  // Standard labeled slider (for main abstract sliders + contributions)
  function addSlider(
    labelText: string,
    getVal: () => number,
    setVal: (v: number) => void,
    min: number, max: number, step: number,
    isDecimal: boolean
  ) {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const lbl = document.createElement('label');
    lbl.textContent = labelText;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = getVal().toString();

    const valEl = document.createElement('div');
    valEl.className = 'val';
    valEl.textContent = isDecimal ? getVal().toFixed(2) : getVal().toFixed(0);

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      setVal(isDecimal ? v : Math.round(v));
      valEl.textContent = isDecimal ? v.toFixed(2) : v.toFixed(0);
    });

    row.appendChild(lbl);
    row.appendChild(slider);
    row.appendChild(valEl);
    container.appendChild(row);
    return slider;
  }

  // Dense dual-anchor row: label | 0:[slider][val] | 1:[slider][val] | =[computed]
  function addAnchorRow(
    label: string,
    paramKey: string,
    anchors: { a: number; b: number },
    sliderMin: number, sliderMax: number, sliderStep: number,
    isInt: boolean,
    onChange: () => void
  ) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:3px;font-size:11px;font-family:monospace;';

    const lbl = document.createElement('span');
    lbl.style.cssText = 'min-width:120px;flex-shrink:0;color:#333;';
    lbl.textContent = label;
    row.appendChild(lbl);

    function makeAnchorControl(which: 'a' | 'b') {
      const tag = document.createElement('span');
      tag.style.cssText = 'flex-shrink:0;color:#888;';
      tag.textContent = which === 'a' ? '0:' : '1:';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = sliderMin.toString();
      slider.max = sliderMax.toString();
      slider.step = sliderStep.toString();
      slider.value = anchors[which].toString();
      slider.style.cssText = 'flex:1;min-width:100px;';

      const val = document.createElement('span');
      val.style.cssText = 'min-width:30px;text-align:right;flex-shrink:0;';
      val.textContent = isInt ? String(Math.round(anchors[which])) : anchors[which].toFixed(2);

      slider.addEventListener('input', () => {
        anchors[which] = parseFloat(slider.value);
        val.textContent = isInt ? String(Math.round(anchors[which])) : anchors[which].toFixed(2);
        onChange();
      });

      row.appendChild(tag);
      row.appendChild(slider);
      row.appendChild(val);
    }

    makeAnchorControl('a');
    makeAnchorControl('b');

    const sep = document.createElement('span');
    sep.style.cssText = 'flex-shrink:0;color:#aaa;padding:0 2px;';
    sep.textContent = '=';
    row.appendChild(sep);

    const computed = document.createElement('span');
    computed.style.cssText = 'min-width:40px;text-align:right;flex-shrink:0;font-weight:bold;';
    computedDisplays.set(paramKey, computed);
    row.appendChild(computed);

    container.appendChild(row);
  }

  // Strategy locked to C (hidden) — amp=t², sigma=√t, smoothing=s², fineAmp=√s
  // const stratRow = ...; (hidden)

  // ===== UNEVENNESS =====
  const unevSlider = addSlider('Unevenness', () => unevenness, (v) => {
    unevenness = v;
    currentParams.gaussianSeed = Math.floor(Math.random() * 1000000);
    applyUnevenness(curved(v, unevCurve));
    drawTree();
  }, 0, 1, 0.01, true);


  // Unevenness anchors locked — keep code but don't display
  // const unevNote = ...; (hidden)
  // const unevOnChange = () => { applyUnevenness(unevenness); drawTree(); };
  // addAnchorRow('countMin', 'gaussianCountMin', unevAnchors.gaussianCountMin, 0, 12, 1, true, unevOnChange);
  // addAnchorRow('countMax', 'gaussianCountMax', unevAnchors.gaussianCountMax, 1, 15, 1, true, unevOnChange);
  // addAnchorRow('ampMin [t²/lin]', 'gaussianAmplitudeMin', unevAnchors.gaussianAmpMin, 0, 2, 0.05, false, unevOnChange);
  // addAnchorRow('ampMax [t²/lin]', 'gaussianAmplitudeMax', unevAnchors.gaussianAmpMax, 0, 5, 0.05, false, unevOnChange);
  // addAnchorRow('sigmaMin [√t/lin]', 'gaussianSigmaMin', unevAnchors.gaussianSigmaMin, 0.1, 3, 0.05, false, unevOnChange);
  // addAnchorRow('sigmaMax [√t/lin]', 'gaussianSigmaMax', unevAnchors.gaussianSigmaMax, 0.1, 3, 0.05, false, unevOnChange);
  // addAnchorRow('coarseAmp', 'coarseDetailAmp', unevAnchors.coarseAmp, 0, 2, 0.05, false, unevOnChange);
  // addAnchorRow('coarseFreq', 'coarseDetailFreq', unevAnchors.coarseFreq, 0.1, 5, 0.1, false, unevOnChange);

  // ===== COARSENESS =====
  const coarseSlider = addSlider('Coarseness', () => coarseness, (v) => {
    coarseness = v;
    applyCoarseness(curved(v, coarseCurve));
    drawTree();
  }, 0, 1, 0.01, true);


  // Coarseness anchors locked — keep code but don't display
  // const coarseOnChange = () => { applyCoarseness(coarseness); drawTree(); };
  // addAnchorRow('smoothBase [s²/lin]', 'smoothingBase', coarseAnchors.smoothingBase, 0, 20, 1, true, coarseOnChange);
  // addAnchorRow('smoothInner', 'smoothingInner', coarseAnchors.smoothingInner, 0, 30, 1, true, coarseOnChange);
  // addAnchorRow('fineAmp [√s/lin]', 'fineDetailAmp', coarseAnchors.fineAmp, 0, 5, 0.05, false, coarseOnChange);
  // addAnchorRow('fineFreq', 'fineDetailFreq', coarseAnchors.fineFreq, 0.5, 15, 0.1, false, coarseOnChange);

  // ===== CLIMATE INFLUENCE =====
  addSlider('Climate Influence', () => dataBlend, (v) => {
    dataBlend = v;
    autoSetWeatherMinMax();
    drawTree();
  }, 0, 1, 0.01, true);

  // Range info hidden — keep code but don't display
  // rangeNote: '0 = global reference window  |  1 = tight around data'
  // rangeInfoEl: 'temp: X° to Y°  dew: X° to Y°'

  // ===== RANDOMIZE =====
  const randParamsBtn = document.createElement('button');
  randParamsBtn.className = 'btn-block';
  randParamsBtn.style.marginTop = '16px';
  randParamsBtn.textContent = 'Randomize Parameters';
  randParamsBtn.addEventListener('click', () => {
    unevenness = Math.random();
    coarseness = Math.random();
    unevSlider.value = unevenness.toString();
    coarseSlider.value = coarseness.toString();
    currentParams.gaussianSeed = Math.floor(Math.random() * 1000000);
    applyUnevenness(curved(unevenness, unevCurve));
    applyCoarseness(curved(coarseness, coarseCurve));
    drawTree();
  });
  container.appendChild(randParamsBtn);

  const randBtn = document.createElement('button');
  randBtn.className = 'btn-block';
  randBtn.textContent = 'Replant Tree';
  randBtn.addEventListener('click', () => {
    currentParams.noiseSeed = Math.floor(Math.random() * 1000000);
    currentParams.gaussianSeed = Math.floor(Math.random() * 1000000);
    drawTree();
  });
  container.appendChild(randBtn);

  updateComputedDisplays();
}

function showPhase2(weatherData: WeatherDataPoint[]) {
  currentWeatherData = weatherData;
  currentParams.numCircles = weatherData.length;
  currentParams.gaussianYFromMaxRange = weatherData.length; // blobs can span the full ring count

  // Fixed/hidden params
  currentParams.ringWidthFactor = PARAM_CONFIG.ringWidthFactor.default;
  currentParams.favorabilityContribution = PARAM_CONFIG.favorabilityContribution.default;
  currentParams.gaussianContribution = PARAM_CONFIG.gaussianContribution.default;
  currentParams.noiseContribution = PARAM_CONFIG.noiseContribution.default;
  currentParams.tempContribution = PARAM_CONFIG.tempContribution.default;
  currentParams.dewContribution = PARAM_CONFIG.dewContribution.default;

  // Auto-scale: 90% of inner half-width
  currentParams.scale = Math.round(0.9 * (CANVAS_WIDTH - 50) / 2);

  // Auto weather ranges
  autoSetWeatherMinMax();

  // Apply current abstraction slider values
  applyUnevenness(curved(unevenness, unevCurve));
  applyCoarseness(curved(coarseness, coarseCurve));

  document.getElementById('phase1')!.style.display = 'none';
  document.getElementById('phase2')!.style.display = 'block';
  initCanvas();
  setupControls();
  drawTree();
}

async function generateWeatherDataAndShowPhase2() {
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const statusDiv = document.getElementById('status');

  if (!generateBtn || !statusDiv) return;

  if (yearLocations.length === 0) {
    statusDiv.textContent = 'Please enter your birth year and birth location first.';
    statusDiv.classList.remove('hidden');
    return;
  }

  generateBtn.disabled = true;
  statusDiv.textContent = 'Gathering weather data...';
  statusDiv.classList.remove('hidden');

  const weatherResults: WeatherDataPoint[] = [];

  try {
    for (let i = 0; i < yearLocations.length; i++) {
      const yearLoc = yearLocations[i];
      const location = yearLoc.location;

      if (!location) {
        weatherResults.push({
          year: yearLoc.year,
          location: 'N/A',
          latitude: 0,
          longitude: 0,
          temperature_2m_mean: 'N/A',
          dew_point_2m_mean: 'N/A',
          relative_humidity_2m_mean: 'N/A',
          precipitation_sum: 'N/A',
        });
        continue;
      }

      statusDiv.textContent = 'Fetching ' + yearLoc.year + ' (' + (i + 1) + '/' + yearLocations.length + ')...';

      const startDate = yearLoc.year + '-01-01';
      const endDate = yearLoc.year + '-12-31';

      const weatherData = await fetchWeatherData(
        parseFloat(location.lat),
        parseFloat(location.lon),
        startDate,
        endDate
      );

      if (weatherData) {
        const averages = calculateYearlyAverage(weatherData);
        weatherResults.push({
          year: yearLoc.year,
          location: getSimpleLocationName(location),
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          temperature_2m_mean: averages.temperature_2m_mean,
          dew_point_2m_mean: averages.dew_point_2m_mean,
          relative_humidity_2m_mean: averages.relative_humidity_2m_mean,
          precipitation_sum: averages.precipitation_sum,
        });
      } else {
        console.error('Failed to fetch weather data for ' + yearLoc.year);
        weatherResults.push({
          year: yearLoc.year,
          location: getSimpleLocationName(location),
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          temperature_2m_mean: 'N/A',
          dew_point_2m_mean: 'N/A',
          relative_humidity_2m_mean: 'N/A',
          precipitation_sum: 'N/A',
        });
      }
    }

    statusDiv.classList.add('hidden');
    showPhase2(weatherResults);

  } catch (error) {
    console.error('Error generating weather data:', error);
    statusDiv.textContent = 'Something went wrong. Please try again.';
    statusDiv.classList.remove('hidden');
  } finally {
    generateBtn.disabled = false;
  }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  const birthYearInput = document.getElementById('birth-year') as HTMLInputElement;
  const birthLocationInput = document.getElementById('birth-location') as HTMLInputElement;
  const birthLocationResults = document.getElementById('birth-location-results');
  const generateBtn = document.getElementById('generate-btn');
  const finalSubmitBtn = document.getElementById('final-submit-btn');
  const finalStatus = document.getElementById('final-status');

  if (birthYearInput) {
    birthYearInput.addEventListener('change', (e) => {
      const year = parseInt((e.target as HTMLInputElement).value, 10);
      if (year >= 1900 && year <= 2025) {
        birthYear = year;
        if (birthLocation) generateYearsTable();
      }
    });
  }

  if (birthLocationInput && birthLocationResults) {
    birthLocationInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      if (query.length >= 2) {
        birthLocationResults.innerHTML = '<div class="search-loading">Searching...</div>';
        birthLocationResults.classList.remove('hidden');
      } else {
        birthLocationResults.innerHTML = '';
        birthLocationResults.classList.add('hidden');
      }
      searchDebounceTimer = window.setTimeout(async () => {
        const results = await searchLocations(query);
        displaySearchResults(results, birthLocationResults, (location) => {
          birthLocation = location;
          birthLocationInput.value = getLocationDisplayName(location);
          if (birthYear) generateYearsTable();
        });
      }, 1000);
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', generateWeatherDataAndShowPhase2);
  }

  if (finalSubmitBtn && finalStatus) {
    finalSubmitBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('final-name-input') as HTMLInputElement;
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        finalStatus.textContent = 'Please enter your name.';
        return;
      }
      (finalSubmitBtn as HTMLButtonElement).disabled = true;
      finalStatus.textContent = 'Saving...';
      try {
        await saveEntry('Tree', name, { params: currentParams, weatherData: currentWeatherData });
        finalStatus.textContent = 'Saved! Thank you, ' + name + '.';
      } catch (e) {
        finalStatus.textContent = 'Something went wrong. Please try again.';
      } finally {
        (finalSubmitBtn as HTMLButtonElement).disabled = false;
      }
    });
  }
});
