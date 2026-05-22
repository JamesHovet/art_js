import p5 from 'p5';
// @ts-ignore
import init, {p5SVG} from "p5.js-svg";
import {getLetterOffset, getLetterSVGPath} from "../../shared/letterSvgPaths";

// @ts-ignore
init(p5);

console.log("p5 with svg:", p5);

// Parameter configuration constants
const PARAM_CONFIG = {
  fontSize: 550,
  numLines: {
    default: 3000,
    min: 1500,
    max: 7000
  },
  lineLength: {
    default: 5,
    min: 1,
    max: 15,
    step: 0.05
  },
  gaussianStdDev: {
    default: 0.3,
    min: 0.1,
    max: 1.0,
    step: 0.01
  }
};

// Scroll sensitivity for sliders (higher values = more sensitive)
const SCROLL_SENSITIVITY = 0.05;

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 576;

function drawTextOnSVG() {
  // Get the SVG element from p5.js
  const svgElement = document.querySelector('#letters-container svg g');
  if (!svgElement) {
    console.error('SVG element not found');
    return;
  }

  // Create text group for left side text
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

  // Create text group for right side text
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

export const lettersSketch = (p: p5) => {
  let fontSize = PARAM_CONFIG.fontSize;
  let currentLetter = 'A';
  let isBold = false;
  let walkAbandoned = false;

  // Random walk parameters
  let numLines = PARAM_CONFIG.numLines.default;
  let lineLength = PARAM_CONFIG.lineLength.default;
  let gaussianStdDev = PARAM_CONFIG.gaussianStdDev.default;
  let currentDirection = 0;
  let currentX = 288;
  let currentY = 288;
  let walkStarted = false;

  p.setup = () => {
    // @ts-ignore
    p.createCanvas(576, 576, p.SVG);

    // @ts-ignore
    window.mainProcessing = p;

    setupControls();
    setupKeyboardInput();
  };

  const setupKeyboardInput = () => {
    document.addEventListener('keydown', (event) => {
      const key = event.key.toUpperCase();

      if (/^[A-Z0-9]$/.test(key)) {
        currentLetter = key;
        resetWalk();
        updateLetterDisplay();
      }
    });
  };

  const updateLetterDisplay = () => {
    const letterDisplay = document.getElementById('current-letter-display');
    if (letterDisplay) {
      letterDisplay.textContent = `Letter: ${currentLetter}`;
    }
  };

  const setupControls = () => {
    const controlsContainer = document.getElementById('controls-container');
    if (controlsContainer) {
      // Current letter display
      const letterDisplay = document.createElement('div');
      letterDisplay.id = 'current-letter-display';
      letterDisplay.textContent = `Letter: ${currentLetter}`;
      letterDisplay.style.marginBottom = '15px';
      letterDisplay.style.fontSize = '16px';
      letterDisplay.style.fontWeight = 'bold';
      controlsContainer.appendChild(letterDisplay);

      // // Bold weight toggle
      // const boldContainer = document.createElement('div');
      // boldContainer.style.marginBottom = '15px';
      //
      // const boldCheckbox = document.createElement('input');
      // boldCheckbox.type = 'checkbox';
      // boldCheckbox.checked = isBold;
      // boldCheckbox.style.marginRight = '8px';
      //
      // const boldLabel = document.createElement('label');
      // boldLabel.textContent = 'Bold Weight';
      // boldLabel.style.cursor = 'pointer';
      //
      // boldCheckbox.addEventListener('change', (e) => {
      //   const target = e.target as HTMLInputElement;
      //   isBold = target.checked;
      //   resetWalk();
      // });
      //
      // boldContainer.appendChild(boldCheckbox);
      // boldContainer.appendChild(boldLabel);
      // controlsContainer.appendChild(boldContainer);

      // Number of lines control
      const numLinesContainer = document.createElement('div');
      numLinesContainer.style.marginBottom = '10px';

      const numLinesLabel = document.createElement('div');
      numLinesLabel.textContent = 'Lines:';
      numLinesLabel.style.marginBottom = '5px';

      const numLinesSlider = document.createElement('input');
      numLinesSlider.type = 'range';
      numLinesSlider.min = PARAM_CONFIG.numLines.min.toString();
      numLinesSlider.max = PARAM_CONFIG.numLines.max.toString();
      numLinesSlider.value = numLines.toString();
      numLinesSlider.style.width = '100%';

      const numLinesValue = document.createElement('div');
      numLinesValue.textContent = numLines.toString();

      numLinesSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        numLines = parseInt(target.value);
        numLinesValue.textContent = numLines.toString();
        resetWalk();
      });

      // Scroll wheel support for number of lines
      numLinesSlider.addEventListener('wheel', (e) => {
        e.preventDefault();
        const currentSliderValue = parseInt(numLinesSlider.value);
        const delta = -e.deltaY * SCROLL_SENSITIVITY * 10; // Use actual deltaY value
        const newValue = Math.min(Math.max(currentSliderValue + delta, PARAM_CONFIG.numLines.min), PARAM_CONFIG.numLines.max);
        numLines = Math.round(newValue);
        numLinesSlider.value = numLines.toString();
        numLinesValue.textContent = numLines.toString();
        resetWalk();
      });

      numLinesContainer.appendChild(numLinesLabel);
      numLinesContainer.appendChild(numLinesSlider);
      numLinesContainer.appendChild(numLinesValue);
      controlsContainer.appendChild(numLinesContainer);

      // Line length control
      const lineLengthContainer = document.createElement('div');
      lineLengthContainer.style.marginBottom = '10px';

      const lineLengthLabel = document.createElement('div');
      lineLengthLabel.textContent = 'Line Length:';
      lineLengthLabel.style.marginBottom = '5px';

      const lineLengthSlider = document.createElement('input');
      lineLengthSlider.type = 'range';
      lineLengthSlider.min = PARAM_CONFIG.lineLength.min.toString();
      lineLengthSlider.max = PARAM_CONFIG.lineLength.max.toString();
      lineLengthSlider.step = PARAM_CONFIG.lineLength.step.toString();
      lineLengthSlider.value = lineLength.toString();
      lineLengthSlider.style.width = '100%';

      const lineLengthValue = document.createElement('div');
      lineLengthValue.textContent = lineLength.toString();

      lineLengthSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        lineLength = parseFloat(target.value);
        lineLengthValue.textContent = lineLength.toString();
        resetWalk();
      });

      // Scroll wheel support for line length
      lineLengthSlider.addEventListener('wheel', (e) => {
        e.preventDefault();
        const currentSliderValue = parseFloat(lineLengthSlider.value);
        const delta = -e.deltaY * SCROLL_SENSITIVITY; // Use actual deltaY value
        const newValue = Math.min(Math.max(currentSliderValue + delta, PARAM_CONFIG.lineLength.min), PARAM_CONFIG.lineLength.max);
        lineLength = newValue;
        lineLengthSlider.value = lineLength.toString();
        lineLengthValue.textContent = lineLength.toFixed(1);
        resetWalk();
      });

      lineLengthContainer.appendChild(lineLengthLabel);
      lineLengthContainer.appendChild(lineLengthSlider);
      lineLengthContainer.appendChild(lineLengthValue);
      controlsContainer.appendChild(lineLengthContainer);

      // Direction variance control
      const gaussianContainer = document.createElement('div');
      gaussianContainer.style.marginBottom = '15px';

      const gaussianLabel = document.createElement('div');
      gaussianLabel.textContent = 'Direction Variance:';
      gaussianLabel.style.marginBottom = '5px';

      const gaussianSlider = document.createElement('input');
      gaussianSlider.type = 'range';
      gaussianSlider.min = PARAM_CONFIG.gaussianStdDev.min.toString();
      gaussianSlider.max = PARAM_CONFIG.gaussianStdDev.max.toString();
      gaussianSlider.step = PARAM_CONFIG.gaussianStdDev.step.toString();
      gaussianSlider.value = gaussianStdDev.toString();
      gaussianSlider.style.width = '100%';

      const gaussianValue = document.createElement('div');
      gaussianValue.textContent = gaussianStdDev.toString();

      gaussianSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        gaussianStdDev = parseFloat(target.value);
        gaussianValue.textContent = gaussianStdDev.toString();
        resetWalk();
      });

      // Scroll wheel support for direction variance
      gaussianSlider.addEventListener('wheel', (e) => {
        e.preventDefault();
        const currentSliderValue = parseFloat(gaussianSlider.value);
        const delta = -e.deltaY * SCROLL_SENSITIVITY * 0.1; // Use actual deltaY value
        const newValue = Math.min(Math.max(currentSliderValue + delta, PARAM_CONFIG.gaussianStdDev.min), PARAM_CONFIG.gaussianStdDev.max);
        gaussianStdDev = newValue;
        gaussianSlider.value = gaussianStdDev.toString();
        gaussianValue.textContent = gaussianStdDev.toFixed(2);
        resetWalk();
      });

      gaussianContainer.appendChild(gaussianLabel);
      gaussianContainer.appendChild(gaussianSlider);
      gaussianContainer.appendChild(gaussianValue);
      controlsContainer.appendChild(gaussianContainer);

      // Reset button
      const resetButton = document.createElement('button');
      resetButton.textContent = 'Regenerate';
      resetButton.style.marginBottom = '15px';
      resetButton.style.width = '100%';
      resetButton.addEventListener('click', resetWalk);
      controlsContainer.appendChild(resetButton);

      // Randomize parameters button
      const randomizeButton = document.createElement('button');
      randomizeButton.textContent = 'Randomize Parameters';
      randomizeButton.style.marginBottom = '15px';
      randomizeButton.style.width = '100%';
      randomizeButton.addEventListener('click', () => {
        // Randomize number of lines
        numLines = Math.floor(p.random(PARAM_CONFIG.numLines.min, PARAM_CONFIG.numLines.max));
        numLinesSlider.value = numLines.toString();
        numLinesValue.textContent = numLines.toString();

        // Randomize line length
        lineLength = p.random(PARAM_CONFIG.lineLength.min, PARAM_CONFIG.lineLength.max);
        lineLengthSlider.value = lineLength.toString();
        lineLengthValue.textContent = lineLength.toFixed(1);

        // Randomize direction variance
        gaussianStdDev = p.random(PARAM_CONFIG.gaussianStdDev.min, PARAM_CONFIG.gaussianStdDev.max);
        gaussianSlider.value = gaussianStdDev.toString();
        gaussianValue.textContent = gaussianStdDev.toFixed(2);

        // Reset the walk with new parameters
        resetWalk();
      });
      controlsContainer.appendChild(randomizeButton);

      // Save SVG button
      const saveSVGButton = document.createElement('button');
      saveSVGButton.id = 'saveSVG';
      saveSVGButton.textContent = 'Save SVG';
      saveSVGButton.style.marginBottom = '15px';
      saveSVGButton.style.width = '100%';
      saveSVGButton.style.backgroundColor = 'blue';
      saveSVGButton.style.color = 'white';
      saveSVGButton.style.fontWeight = 'bold';
      saveSVGButton.addEventListener('click', () => {
        // @ts-ignore
        p.saveSVG();
      });
      controlsContainer.appendChild(saveSVGButton);

      // Warning display
      const warningContainer = document.createElement('div');
      warningContainer.id = 'walk-warning';
      warningContainer.style.color = 'red';
      warningContainer.style.fontWeight = 'bold';
      warningContainer.style.display = 'none';
      controlsContainer.appendChild(warningContainer);
    }
  };

  const resetWalk = () => {
    walkStarted = false;
    walkAbandoned = false;
    currentDirection = p.random(0, p.TWO_PI);
    updateWarningDisplay();
    p.redraw();
  };

  const updateWarningDisplay = () => {
    const warningElement = document.getElementById('walk-warning');
    if (warningElement) {
      if (walkAbandoned) {
        warningElement.style.display = 'block';
      } else {
        warningElement.style.display = 'none';
      }
    }
  };

  // Create a virtual canvas for pixel sampling
  let virtualCanvas: HTMLCanvasElement;
  let virtualCtx: CanvasRenderingContext2D;

  const createVirtualCanvas = () => {
    virtualCanvas = document.createElement('canvas');
    virtualCanvas.width = 576;
    virtualCanvas.height = 576;
    virtualCtx = virtualCanvas.getContext('2d')!;
  };

  const drawLetterToVirtualCanvas = () => {
    if (!virtualCtx) createVirtualCanvas();

    virtualCtx.fillStyle = '#f5f5f5';
    virtualCtx.fillRect(0, 0, 576, 576);

    virtualCtx.fillStyle = 'black';
    virtualCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px Times New Roman, serif`;
    virtualCtx.textAlign = 'center';
    virtualCtx.textBaseline = 'middle';

    let letterCenterY = 50 + ((576 - 75) / 2);
    virtualCtx.fillText(currentLetter, 576 / 2, letterCenterY);
  };

  const isPointInLetter = (x: number, y: number): boolean => {
    if (!virtualCtx || x < 0 || y < 0 || x >= 576 || y >= 576) {
      return false;
    }

    const imageData = virtualCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];
    const brightness = (r + g + b) / 3;

    return brightness < 128;
  };

  const findRandomPointInLetter = (): { x: number, y: number } => {
    let attempts = 0;
    const maxAttempts = 10000;

    while (attempts < maxAttempts) {
      const x = p.random(0, p.width);
      const y = p.random(0, p.height);

      if (isPointInLetter(x, y)) {
        return { x, y };
      }
      attempts++;
    }

    return { x: p.width / 2, y: p.height / 2 };
  };

  const findValidNextPoint = (startX: number, startY: number, direction: number, length: number): { x: number, y: number, finalDirection: number } => {
    let attempts = 0;
    const maxAttempts = 1000;
    let currentDirection = direction;

    while (attempts < maxAttempts) {
      const endX = startX + Math.cos(currentDirection) * length;
      const endY = startY + Math.sin(currentDirection) * length;

      if (isPointInLetter(endX, endY)) {
        return { x: endX, y: endY, finalDirection: currentDirection };
      }

      currentDirection += p.randomGaussian(0, gaussianStdDev);
      attempts++;
    }

    return { x: startX, y: startY, finalDirection: currentDirection };
  };

  p.draw = () => {
    console.time("draw");

    // Clear the previous SVG content
    p.clear(255, 255, 255, 0);

    // Draw border rectangle
    p.stroke(0);
    p.strokeWeight(1);
    p.noFill();
    p.rect(25, 25, p.width - 50, p.height - 75);

    // Draw letter to virtual canvas for pixel sampling
    drawLetterToVirtualCanvas();

    // Initialize the walk if not started
    if (!walkStarted) {
      const startPoint = findRandomPointInLetter();
      currentX = startPoint.x;
      currentY = startPoint.y;
      currentDirection = p.random(0, p.TWO_PI);
      walkStarted = true;
    }

    // Draw the random walk as a single path
    p.stroke(0);
    p.strokeWeight(0.5);
    p.noFill();

    p.beginShape();
    p.vertex(currentX, currentY); // Start the path at the current position

    for (let i = 0; i < numLines; i++) {
      currentDirection += p.randomGaussian(0, gaussianStdDev);

      const nextPoint = findValidNextPoint(currentX, currentY, currentDirection, lineLength);

      if (nextPoint.x !== currentX || nextPoint.y !== currentY) {
        // Add vertex to the path instead of drawing individual lines
        p.vertex(nextPoint.x, nextPoint.y);

        // Update current position and direction
        currentX = nextPoint.x;
        currentY = nextPoint.y;
        currentDirection = nextPoint.finalDirection;
      } else {
        walkAbandoned = true;
        const warningElement = document.getElementById('walk-warning');
        if (warningElement) {
          warningElement.style.display = 'block';
          warningElement.textContent = `⚠️ Abandoned after ${i} lines (out of ${numLines})`;
        }
        break;
      }
    }

    p.endShape(); // Complete the path

    drawTextOnSVG();

    p.noLoop();
    console.timeEnd("draw");
  }

}

// Ensure the container exists before creating the p5 instance
const lettersContainer = document.getElementById('letters-container');
if (lettersContainer) {
  const lettersP5 = new p5(lettersSketch, lettersContainer);
  console.log("p5 instance created for letters:", lettersP5);
} else {
  console.error('letters-container element not found');
}
