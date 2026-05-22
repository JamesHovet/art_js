import p5 from 'p5';
// @ts-ignore
import init, {p5SVG} from "p5.js-svg";

// @ts-ignore
init(p5);

console.log("p5 with svg:", p5);

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 576;

export const messySketch = (p: p5) => {
  let numPoints = 100;
  let isDebugView = false;

  p.setup = () => {
    // @ts-ignore
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, p.SVG);

    // @ts-ignore
    window.mainProcessing = p;

    setupControls();
  };

  // Helper function to create sliders
  const createSlider = (container: HTMLElement, label: string, value: number, min: number, max: number, step: number = 1, onChange: (value: number) => void) => {
    const sliderContainer = document.createElement('div');
    sliderContainer.style.marginBottom = '15px';

    const labelElement = document.createElement('div');
    labelElement.textContent = `${label}:`;
    labelElement.style.marginBottom = '5px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    slider.style.width = '100%';

    const valueDisplay = document.createElement('div');
    valueDisplay.textContent = value.toString();
    valueDisplay.style.fontSize = '14px';
    valueDisplay.style.color = '#666';

    slider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const newValue = step === 1 ? parseInt(target.value) : parseFloat(target.value);
      valueDisplay.textContent = newValue.toString();
      onChange(newValue);
    });

    sliderContainer.appendChild(labelElement);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    container.appendChild(sliderContainer);
  };

  // Helper function to create checkboxes
  const createCheckbox = (container: HTMLElement, label: string, checked: boolean, onChange: (checked: boolean) => void) => {
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.marginBottom = '15px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.style.marginRight = '8px';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.textContent = label;
    checkboxLabel.style.cursor = 'pointer';

    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      onChange(target.checked);
    });

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkboxLabel);
    container.appendChild(checkboxContainer);
  };

  const setupControls = () => {
    const controlsContainer = document.getElementById('controls-container');
    if (controlsContainer) {
      controlsContainer.innerHTML = '';

      // Number of points slider
      createSlider(controlsContainer, 'Number of Points', numPoints, 10, 300, 1, (value) => {
        numPoints = value;
        p.redraw();
      });

      // Debug view checkbox
      createCheckbox(controlsContainer, 'Debug View', isDebugView, (checked) => {
        isDebugView = checked;
        p.redraw();
      });

      // Regenerate button
      const regenerateButton = document.createElement('button');
      regenerateButton.textContent = 'Regenerate';
      regenerateButton.style.marginBottom = '15px';
      regenerateButton.style.width = '100%';
      regenerateButton.addEventListener('click', () => {
        p.redraw();
      });
      controlsContainer.appendChild(regenerateButton);

      // Save SVG button
      const saveSVGButton = document.createElement('button');
      saveSVGButton.id = 'saveSVG';
      saveSVGButton.textContent = 'Save SVG';
      saveSVGButton.style.marginBottom = '15px';
      saveSVGButton.style.width = '100%';
      saveSVGButton.style.backgroundColor = '#007bff';
      saveSVGButton.style.color = 'white';
      saveSVGButton.style.fontWeight = 'bold';
      saveSVGButton.addEventListener('click', () => {
        // @ts-ignore
        p.saveSVG();
      });
      controlsContainer.appendChild(saveSVGButton);
    }
  };

  let ridges = [
    {x: 67, y: 57, length: 508 - 67},
    {x: 67, y: 140, length: 233 - 67},
    {x: 67, y: 241, length: 183 - 67},
    {x: 183, y: 388, length: 395 - 183},
    {x: 395, y: 440, length: 460 - 395},
    {x: 67, y: 500, length: 508 - 67},
  ]

  p.draw = () => {
    console.time("draw");

    // Clear the canvas
    p.clear(255, 255, 255, 0);

    p.noFill();

    // Draw ridges if debug view is enabled
    if (isDebugView) {
      p.push();
      for (let ridge of ridges) {
        p.stroke(0);
        p.line(ridge.x, ridge.y, ridge.x + ridge.length, ridge.y);
      }
      p.pop();
    }

    let x_coordinates = [];
    // Evenly space out numPoints x coordinates between the leftmost and rightmost ridges at the top (y=57)
    let leftmost = ridges[0].x;
    let rightmost = ridges[0].x + ridges[0].length;
    for (let i = 0; i < numPoints; i++) {
      let x = leftmost + (i / (numPoints - 1)) * (rightmost - leftmost);
      // Add some random jitter to each x coordinate, up to +/- 10 pixels
      x += p.random(-6, 6);
      // Clamp the x coordinate to be within the leftmost and rightmost ridges
      x = p.constrain(x, leftmost, rightmost);
      x_coordinates.push(x);
    }

    // sort the x coordinates left to right
    x_coordinates.sort((a, b) => a - b);

    // For each x coordinate, draw a 1 pixel line downwards, then find the ridge below it and draw another 1pixel vertical line there and then repeat until we reach the bottom ridge. We are not drawing lines between ridges, just drawing small lines on each ridge. Draw each x coordinate in a different random color to distinguish them. The x coordinate never changes within the loop.
    p.strokeWeight(3);
    for (let x of x_coordinates) {
      let current_y = ridges[0].y;
      p.stroke(p.random(100, 255), p.random(100, 255), p.random(100, 255), 255);
      p.line(x, current_y, x, current_y + 1);
      for (let i = 1; i < ridges.length; i++) {
        let ridge = ridges[i];
        if (x >= ridge.x && x <= ridge.x + ridge.length) {
          current_y = ridge.y;
          p.line(x, current_y, x, current_y + 1);
        }
      }
      // Then draw the original top line again
      p.line(x, ridges[0].y, x, ridges[0].y + 1);
    }


    p.noLoop();
    console.timeEnd("draw");
  };
};

// Ensure the container exists before creating the p5 instance
const messyContainer = document.getElementById('messy-container');
if (messyContainer) {
  const messyP5 = new p5(messySketch, messyContainer);
  console.log("p5 instance created for messy:", messyP5);
} else {
  console.error('messy-container element not found');
}
