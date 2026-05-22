import {Matrix4, Vector3} from "threejs-math";
import {getLetterOffset, getLetterSVGPath, letterSvgPaths} from "../../shared/letterSvgPaths";

console.log(letterSvgPaths);

// Parameter configuration constants
const PARAM_CONFIG = {
  param1: {
    default: 7.5,
    min: 1,
    max: 10,
    step: 0.1
  },
  param2: {
    default: 1.0,
    min: 0,
    max: 2,
    step: 0.01
  },
  param3: {
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01
  },
  param4: {
    default: 7.5,
    min: 1,
    max: 10,
    step: 0.1
  },
  param5: {
    default: 1.0,
    min: 0,
    max: 2,
    step: 0.01
  },
  param6: {
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01
  }
};

// Scroll sensitivity for sliders (higher values = more sensitive)
const SCROLL_SENSITIVITY = 0.1;

// Spiral parameters
let param1 = PARAM_CONFIG.param1.default;
let param2 = PARAM_CONFIG.param2.default;
let param3 = PARAM_CONFIG.param3.default;
let param4 = PARAM_CONFIG.param4.default;
let param5 = PARAM_CONFIG.param5.default;
let param6 = PARAM_CONFIG.param6.default;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let svgElement: SVGElement;
let isInitialized = false;
let controlsInitialized = false;

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 576;

function initializeCanvasAndSVG() {
  if (isInitialized) return;

  const spiralContainer = document.getElementById('spiral-container');
  if (!spiralContainer) {
    console.error('spiral-container element not found');
    return;
  }

  // Clear container first
  spiralContainer.innerHTML = '';

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
  spiralContainer.appendChild(canvas);
  spiralContainer.appendChild(svgElement);

  // Draw initial text on SVG
  drawTextOnSVG();

  // Draw initial spiral on canvas
  drawSpiralOnCanvas();

  isInitialized = true;
}

function transformPoint(t: number, totalT: number, c: number, noiseOffset: number, iteration: number): Vector3 {
  let r = t * 0.015;
  let x = r * Math.cos(t);
  let y = r * Math.sin(t);

  let z = Math.cos(param1 * r * Math.cos(t + Math.PI * param2)) * param3
    + Math.sin(param4 * r * Math.sin(t + Math.PI * param5)) * param6;

  let worldSpaceCoordinate = new Vector3(x, y, z);

  let scale = new Matrix4();
  scale.scale(new Vector3(60, 60, 1));

  let rotationX = new Matrix4();
  rotationX.makeRotationX(Math.PI / 4); // Fixed rotation for now

  let rotationZ = new Matrix4();
  rotationZ.makeRotationZ(-Math.PI / 2);

  let translation = new Matrix4();
  translation.makeTranslation(CANVAS_WIDTH / 2, 25 + ((CANVAS_HEIGHT - 75) / 2), 0);

  return worldSpaceCoordinate.clone()
    .applyMatrix4(rotationZ)
    .applyMatrix4(rotationX)
    .applyMatrix4(scale)
    .applyMatrix4(translation);
}

function drawSpiralOnCanvas() {
  console.time("canvas draw");

  // Clear canvas completely
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Set canvas styles
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.5;
  ctx.fillStyle = 'none';

  let numCyclesOfTwoPi = 40;
  let numPointsPerCycle = 500;

  // Draw spiral only (no border on canvas)
  ctx.beginPath();
  let isFirstPoint = true;

  for (let c = 0; c < numCyclesOfTwoPi; c++) {
    for (let i = 0; i < numPointsPerCycle; i++) {
      let t = (c * Math.PI * 2) + (i / numPointsPerCycle) * Math.PI * 2;
      let screenSpaceCoordinate = transformPoint(t, numCyclesOfTwoPi * Math.PI * 2, c, 2, 1);

      if (isFirstPoint) {
        ctx.moveTo(screenSpaceCoordinate.x, screenSpaceCoordinate.y);
        isFirstPoint = false;
      } else {
        ctx.lineTo(screenSpaceCoordinate.x, screenSpaceCoordinate.y);
      }
    }
  }

  ctx.stroke();
  console.timeEnd("canvas draw");
}

function drawSpiralOnSVG(): string {
  let numCyclesOfTwoPi = 40;
  let numPointsPerCycle = 1000;

  let pathData = '';
  let isFirstPoint = true;

  for (let c = 0; c < numCyclesOfTwoPi; c++) {
    for (let i = 0; i < numPointsPerCycle; i++) {
      let t = (c * Math.PI * 2) + (i / numPointsPerCycle) * Math.PI * 2;
      let screenSpaceCoordinate = transformPoint(t, numCyclesOfTwoPi * Math.PI * 2, c, 2, 1);

      if (isFirstPoint) {
        pathData += `M ${screenSpaceCoordinate.x} ${screenSpaceCoordinate.y} `;
        isFirstPoint = false;
      } else {
        pathData += `L ${screenSpaceCoordinate.x} ${screenSpaceCoordinate.y} `;
      }
    }
  }

  return pathData;
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
  let stringToWrite = "JAMES HOVET";

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

  // Now draw a second set of text on the right side
  let stringToWriteTwo = "VERCI 2025";

  let textGroupRight = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroupRight.setAttribute("transform", "translate(377, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

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

function exportSVG() {
  console.time("svg export");

  // Create a new SVG for export that includes both spiral and text
  const exportSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  exportSVG.setAttribute('width', CANVAS_WIDTH.toString());
  exportSVG.setAttribute('height', CANVAS_HEIGHT.toString());
  exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

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

  // Add spiral path
  const spiralPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  spiralPath.setAttribute("d", drawSpiralOnSVG());
  spiralPath.setAttribute("fill", "none");
  spiralPath.setAttribute("stroke", "black");
  spiralPath.setAttribute("stroke-width", "0.5");
  exportSVG.appendChild(spiralPath);

  // // Add text (copy from existing SVG)
  // const textGroup = svgElement.querySelector('g:last-child');
  // if (textGroup) {
  //   exportSVG.appendChild(textGroup.cloneNode(true));
  // }

  // Create text group
  let textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroup.setAttribute("transform", "translate(23.5, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

  const distanceBetweenLettersInOriginalFileSpace = 90;
  let stringToWrite = "JAMES HOVET";

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
  let stringToWriteTwo = "VERCI 2025";

  let textGroupRight = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroupRight.setAttribute("transform", "translate(377, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

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
  downloadLink.download = 'spiral.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(svgUrl);

  console.timeEnd("svg export");
}

function setupControls() {
  if (controlsInitialized) return; // Prevent duplicate setup

  const controlsContainer = document.getElementById('controls-container');
  if (controlsContainer) {
    // Clear existing controls
    controlsContainer.innerHTML = '';

    // Helper function to create a slider
    const createSlider = (paramName: string, paramConfig: any, currentValue: number, setValue: (value: number) => void) => {
      const container = document.createElement('div');
      container.style.marginBottom = '10px';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = paramConfig.min.toString();
      slider.max = paramConfig.max.toString();
      slider.step = paramConfig.step.toString();
      slider.value = currentValue.toString();
      slider.style.width = '100%';
      slider.style.marginBottom = '5px';

      const value = document.createElement('div');
      value.textContent = currentValue.toFixed(2);
      value.style.textAlign = 'right';
      value.style.fontSize = '14px';

      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const newValue = parseFloat(target.value);
        setValue(newValue);
        value.textContent = newValue.toFixed(2);
        drawSpiralOnCanvas(); // Redraw canvas only
      });

      // Scroll wheel support
      slider.addEventListener('wheel', (e) => {
        e.preventDefault();
        const currentSliderValue = parseFloat(slider.value);
        const delta = -Math.sign(e.deltaY) * paramConfig.step * SCROLL_SENSITIVITY * 10;
        const newValue = Math.min(Math.max(currentSliderValue + delta, paramConfig.min), paramConfig.max);
        setValue(newValue);
        slider.value = newValue.toString();
        value.textContent = newValue.toFixed(2);
        drawSpiralOnCanvas(); // Redraw canvas only
      });

      container.appendChild(slider);
      container.appendChild(value);
      controlsContainer.appendChild(container);

      return { slider, value };
    };

    // Create all 6 sliders
    const param1Slider = createSlider('param1', PARAM_CONFIG.param1, param1, (v) => param1 = v);
    const param2Slider = createSlider('param2', PARAM_CONFIG.param2, param2, (v) => param2 = v);
    const param3Slider = createSlider('param3', PARAM_CONFIG.param3, param3, (v) => param3 = v);
    const param4Slider = createSlider('param4', PARAM_CONFIG.param4, param4, (v) => param4 = v);
    const param5Slider = createSlider('param5', PARAM_CONFIG.param5, param5, (v) => param5 = v);
    const param6Slider = createSlider('param6', PARAM_CONFIG.param6, param6, (v) => param6 = v);

    // Randomize parameters button
    const randomizeButton = document.createElement('button');
    randomizeButton.textContent = 'Randomize Parameters';
    randomizeButton.style.marginBottom = '15px';
    randomizeButton.style.width = '100%';
    randomizeButton.addEventListener('click', () => {
      // Randomize all parameters
      param1 = Math.random() * (PARAM_CONFIG.param1.max - PARAM_CONFIG.param1.min) + PARAM_CONFIG.param1.min;
      param2 = Math.random() * (PARAM_CONFIG.param2.max - PARAM_CONFIG.param2.min) + PARAM_CONFIG.param2.min;
      param3 = Math.random() * (PARAM_CONFIG.param3.max - PARAM_CONFIG.param3.min) + PARAM_CONFIG.param3.min;
      param4 = Math.random() * (PARAM_CONFIG.param4.max - PARAM_CONFIG.param4.min) + PARAM_CONFIG.param4.min;
      param5 = Math.random() * (PARAM_CONFIG.param5.max - PARAM_CONFIG.param5.min) + PARAM_CONFIG.param5.min;
      param6 = Math.random() * (PARAM_CONFIG.param6.max - PARAM_CONFIG.param6.min) + PARAM_CONFIG.param6.min;

      // Update slider values and displays
      param1Slider.slider.value = param1.toString();
      param1Slider.value.textContent = param1.toFixed(2);
      param2Slider.slider.value = param2.toString();
      param2Slider.value.textContent = param2.toFixed(2);
      param3Slider.slider.value = param3.toString();
      param3Slider.value.textContent = param3.toFixed(2);
      param4Slider.slider.value = param4.toString();
      param4Slider.value.textContent = param4.toFixed(2);
      param5Slider.slider.value = param5.toString();
      param5Slider.value.textContent = param5.toFixed(2);
      param6Slider.slider.value = param6.toString();
      param6Slider.value.textContent = param6.toFixed(2);

      drawSpiralOnCanvas(); // Redraw canvas only
    });
    controlsContainer.appendChild(randomizeButton);

    // Save SVG button
    const saveSVGButton = document.createElement('button');
    saveSVGButton.id = 'saveSVG';
    saveSVGButton.textContent = 'Save SVG';
    saveSVGButton.style.marginBottom = '15px';
    saveSVGButton.style.width = '100%';
    saveSVGButton.style.backgroundColor = '#007bff';
    saveSVGButton.style.color = 'white';
    saveSVGButton.style.fontWeight = 'bold';
    saveSVGButton.addEventListener('click', exportSVG);
    controlsContainer.appendChild(saveSVGButton);

    controlsInitialized = true;
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (!isInitialized) {
    initializeCanvasAndSVG();
    setupControls();
  }
});

// Handle case where DOM is already loaded
if (document.readyState !== 'loading' && !isInitialized) {
  initializeCanvasAndSVG();
  setupControls();
}
