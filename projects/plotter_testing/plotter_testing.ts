export {};

// p5.axidraw is loaded as a plain <script> tag and exposes window.axidraw
declare const axidraw: { AxiDraw: new () => any };

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const MM_TO_PX = 2; // 2px per mm → 150mm × 150mm visible in 300px canvas

// Physical page width in mm — used by the coordinate transform.
// Home (0,0) is top-right. Plotter X = page Y (down), Plotter Y = page X from right.
const PAGE_WIDTH_MM = 210; // A4 landscape width — adjust to match your paper

// Convert drawing space (top-left origin, x→right, y→down) to plotter space.
function toPlotter(x: number, y: number): { x: number; y: number } {
  return { x: y, y: PAGE_WIDTH_MM - x };
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let isInitialized = false;
let controlsInitialized = false;

function initializeCanvas() {
  if (isInitialized) return;

  const container = document.getElementById('plotter_testing-container');
  if (!container) return;

  container.innerHTML = '';

  const dpr = window.devicePixelRatio || 1;
  canvas = document.createElement('canvas');
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  container.appendChild(canvas);
  draw();
  isInitialized = true;
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Grid dots at 10mm intervals
  ctx.fillStyle = '#ccc';
  for (let x = 0; x <= 150; x += 10) {
    for (let y = 0; y <= 150; y += 10) {
      ctx.beginPath();
      ctx.arc(x * MM_TO_PX, y * MM_TO_PX, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Planned line
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(LINE_START_MM.x * MM_TO_PX, LINE_START_MM.y * MM_TO_PX);
  ctx.lineTo(LINE_END_MM.x * MM_TO_PX, LINE_END_MM.y * MM_TO_PX);
  ctx.stroke();

  // Start dot (red)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(LINE_START_MM.x * MM_TO_PX, LINE_START_MM.y * MM_TO_PX, 3, 0, Math.PI * 2);
  ctx.fill();

  // End dot (blue)
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(LINE_END_MM.x * MM_TO_PX, LINE_END_MM.y * MM_TO_PX, 3, 0, Math.PI * 2);
  ctx.fill();

  // Coordinate labels
  ctx.fillStyle = '#555';
  ctx.font = '10px monospace';
  ctx.fillText(`(${LINE_START_MM.x}, ${LINE_START_MM.y}) mm`, LINE_START_MM.x * MM_TO_PX + 5, LINE_START_MM.y * MM_TO_PX - 5);
  ctx.fillText(`(${LINE_END_MM.x}, ${LINE_END_MM.y}) mm`, LINE_END_MM.x * MM_TO_PX - 35, LINE_END_MM.y * MM_TO_PX + 16);
}

function setStatus(msg: string, isError = false) {
  const el = document.getElementById('status');
  if (el) {
    el.textContent = msg;
    el.style.color = isError ? '#dc2626' : '#333';
  }
}

const LINE_START_MM = { x: 10, y: 140 };
const LINE_END_MM = { x: 80, y: 140 };
const Y_DELTA_MM = 20;
const base_wait_time_seconds = 1;

function sleep(milliseconds: number): Promise<void> {
  console.log(`Sleeping for ${milliseconds} ms; current time is ${new Date().toLocaleTimeString()}.`);
  return new Promise(resolve => setTimeout(() => {
    console.log(`Done sleeping for ${milliseconds} ms; current time is ${new Date().toLocaleTimeString()}.`);
    resolve();
  }, milliseconds));
}

function setupControls() {
  if (controlsInitialized) return;

  const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
  const drawBtn = document.getElementById('draw-btn') as HTMLButtonElement;

  connectBtn?.addEventListener('click', async () => {
    setStatus('Opening serial port dialog...');
    connectBtn.disabled = true;
    try {
      const axi = new axidraw.AxiDraw();
      await axi.connect();
      setStatus('Connected. Click "Draw Line" to plot.');
      drawBtn.disabled = false;

      drawBtn.addEventListener('click', async () => {
        drawBtn.disabled = true;
        setStatus('Drawing...');

        axi.penUp();


        for (var i = 0; i < 6; i++) {
          try {
            const start = toPlotter(LINE_START_MM.x, LINE_START_MM.y + Y_DELTA_MM * i);
            const end = toPlotter(LINE_END_MM.x, LINE_END_MM.y + Y_DELTA_MM * i);
            await axi.penUp();
            await axi.moveTo(start.x, start.y);
            await axi.penDown();
            await sleep(1500);
            await axi.penUp();
            await axi.moveTo(end.x, end.y);
            await axi.penDown();
            await axi.penUp();
            await sleep(base_wait_time_seconds * 1000 * i);
          } catch (err: any) {
            setStatus('Error while drawing: ' + err.message, true);
            drawBtn.disabled = false;
          }
        }

        await axi.moveTo(0, 0); // home is always plotter (0,0)
        await axi.disable();
        setStatus('Done. Motors disabled, head returned to origin.');
      }, { once: true });
    } catch (err: any) {
      setStatus('Connection failed: ' + err.message, true);
      connectBtn.disabled = false;
    }
  });

  controlsInitialized = true;
}

document.addEventListener('DOMContentLoaded', () => {
  initializeCanvas();
  setupControls();
});

if (document.readyState !== 'loading' && !isInitialized) {
  initializeCanvas();
  setupControls();
}
