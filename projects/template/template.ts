import {getLetterOffset, getLetterSVGPath} from "../../shared/letterSvgPaths";

// Parameter configuration constants
const PARAM_CONFIG = {
  gridSize: {
    default: 8,
    min: 2,
    max: 20,
    step: 1
  },
  // Add more parameters as needed
};

// Parameters
let gridSize = PARAM_CONFIG.gridSize.default;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let svgElement: SVGElement;
let isInitialized = false;
let controlsInitialized = false;

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 576;

function initializeCanvasAndSVG() {
  if (isInitialized) return;

  const templateContainer = document.getElementById('template-container');
  if (!templateContainer) {
    console.error('template-container element not found');
    return;
  }

  // Clear container first
  templateContainer.innerHTML = '';

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
  templateContainer.appendChild(canvas);
  templateContainer.appendChild(svgElement);

  // Draw initial text and border on SVG
  drawTextOnSVG();

  // Draw initial shape on canvas
  drawShapeOnCanvas();

  isInitialized = true;
}

function drawShapeOnCanvas() {
  console.time("canvas draw");

  // Clear canvas completely
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Set canvas styles
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'none';

  // Calculate grid dimensions based on border rectangle
  const borderX = 25;
  const borderY = 25;
  const borderWidth = CANVAS_WIDTH - 50;
  const borderHeight = CANVAS_HEIGHT - 75;

  const cellWidth = borderWidth / gridSize;
  const cellHeight = borderHeight / gridSize;

  // Draw a simple grid
  ctx.beginPath();

  // Vertical lines
  for (let i = 0; i <= gridSize; i++) {
    const x = borderX + i * cellWidth;
    ctx.moveTo(x, borderY);
    ctx.lineTo(x, borderY + borderHeight);
  }

  // Horizontal lines
  for (let i = 0; i <= gridSize; i++) {
    const y = borderY + i * cellHeight;
    ctx.moveTo(borderX, y);
    ctx.lineTo(borderX + borderWidth, y);
  }

  ctx.stroke();
  console.timeEnd("canvas draw");
}

function drawShapeOnSVG(): string {
  // Calculate grid dimensions based on border rectangle
  const borderX = 25;
  const borderY = 25;
  const borderWidth = CANVAS_WIDTH - 50;
  const borderHeight = CANVAS_HEIGHT - 75;

  const cellWidth = borderWidth / gridSize;
  const cellHeight = borderHeight / gridSize;

  let pathData = '';

  // Vertical lines
  for (let i = 0; i <= gridSize; i++) {
    const x = borderX + i * cellWidth;
    pathData += `M ${x} ${borderY} L ${x} ${borderY + borderHeight} `;
  }

  // Horizontal lines
  for (let i = 0; i <= gridSize; i++) {
    const y = borderY + i * cellHeight;
    pathData += `M ${borderX} ${y} L ${borderX + borderWidth} ${y} `;
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

  // Right side text (year or other info)
  let stringToWriteTwo = "2025";

  let textGroupRight = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroupRight.setAttribute("transform", "translate(450, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

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

  // Create a new SVG for export that includes both shape and text
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

  // Add shape path
  const shapePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shapePath.setAttribute("d", drawShapeOnSVG());
  shapePath.setAttribute("fill", "none");
  shapePath.setAttribute("stroke", "black");
  shapePath.setAttribute("stroke-width", "1");
  exportSVG.appendChild(shapePath);

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

  // Right side text
  let stringToWriteTwo = "2025";

  let textGroupRight = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroupRight.setAttribute("transform", "translate(450, " + (CANVAS_HEIGHT - 15) + "), scale(0.2)");

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
  downloadLink.download = 'template.svg';
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

      const label = document.createElement('div');
      label.textContent = paramName;
      label.style.marginBottom = '5px';
      label.style.fontWeight = 'bold';
      label.style.fontSize = '14px';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = paramConfig.min.toString();
      slider.max = paramConfig.max.toString();
      slider.step = paramConfig.step.toString();
      slider.value = currentValue.toString();
      slider.style.width = '100%';
      slider.style.marginBottom = '5px';

      const value = document.createElement('div');
      value.textContent = currentValue.toFixed(0);
      value.style.textAlign = 'right';
      value.style.fontSize = '14px';

      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const newValue = parseFloat(target.value);
        setValue(newValue);
        value.textContent = newValue.toFixed(0);
        drawShapeOnCanvas(); // Redraw canvas only
      });

      container.appendChild(label);
      container.appendChild(slider);
      container.appendChild(value);
      controlsContainer.appendChild(container);

      return { slider, value };
    };

    // Create slider for grid size
    createSlider('Grid Size', PARAM_CONFIG.gridSize, gridSize, (v) => gridSize = Math.floor(v));

    // Save SVG button
    const saveSVGButton = document.createElement('button');
    saveSVGButton.id = 'saveSVG';
    saveSVGButton.textContent = 'Save SVG';
    saveSVGButton.style.marginTop = '20px';
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
