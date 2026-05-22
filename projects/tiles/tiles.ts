import {
  Vector3,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  GridHelper,
  Clock,
  Matrix4,
  Euler,
  Vector2
} from 'three';

import {MapControls} from 'three/examples/jsm/controls/MapControls';
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js';

import {Loader3DTiles, PointCloudColoring} from 'three-loader-3dtiles'
import {MapView, OpenStreetMapsProvider} from 'geo-three'
// import { TweenMax } from 'gsap'

import Stats from 'three/examples/jsm/libs/stats.module.js';
import StatsWidget from '@probe.gl/stats-widget';

const canvasParent = document.querySelector('#canvas-parent');
const statsParent = document.querySelector('#stats-widget')

const scene = new Scene();
const camera = new PerspectiveCamera(
  45,
  1,
  10,
  100000,
);

const renderer = new WebGLRenderer();
//@ts-ignore
renderer.preserveDrawingBuffer = true;

const clock = new Clock()
//@ts-ignore
const controls = new MapControls(camera, canvasParent);
controls.listenToKeyEvents(window);

canvasParent.appendChild(renderer.domElement);

const threeJsStats = new Stats();
threeJsStats.domElement.style.position = 'absolute';
threeJsStats.domElement.style.top = '10px';
threeJsStats.domElement.style.left = '10px';

canvasParent.appendChild(threeJsStats.domElement);

const queryParams = new URLSearchParams(document.location.search);

const copyrightElement = document.getElementById('copyright');

loadTileset();

// Default is Tokyo Tower
const demoLat = queryParams.get('lat') ?? 40.7483591;
const demoLong = queryParams.get('long') ?? -73.9857368;
const demoHeight = queryParams.get('height') ?? 100;

const guiParams = {
  'lat': demoLat,
  'long': demoLong,
  'height': demoHeight,
  'googleApiKey': queryParams.get('googleApiKey') ?? '',
  'reload': setQueryParams,
};

function setQueryParams() {
  if (window.location.hostname !== 'nytimes.github.io') {
    queryParams.set('googleApiKey', guiParams.googleApiKey);
  }
//@ts-ignore
  queryParams.set('lat', guiParams.lat);
//@ts-ignore
  queryParams.set('long', guiParams.long);
//@ts-ignore
  queryParams.set('height', guiParams.height);
  window.history.replaceState({}, '', '?' + queryParams.toString());
  window.location.reload();
}

let tilesRuntime = undefined;
let tilesModel = undefined;
let statsRuntime = undefined;

async function loadTileset() {
  const result = await Loader3DTiles.load(
    {
      url:
        "https://tile.googleapis.com/v1/3dtiles/root.json",
      viewport: getViewport(),
      options: {
        googleApiKey: 'AIzaSyAqfpVd74wvABY7YkRBSKNhzlYHFH9ws3Q',
        dracoDecoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco',
        basisTranscoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis',
        pointCloudColoring: PointCloudColoring.RGB,
//@ts-ignore
        maximumScreenSpaceError: queryParams.get('sse') ?? 48
      }
    }
  );

  const {model, runtime} = result;

  tilesRuntime = runtime;
  runtime.setDebug(true);
  runtime.showTiles(true);
  tilesModel = model;

  onWindowResize();

  scene.add(model);
  scene.add(runtime.getTileBoxes());

//@ts-ignore
  statsRuntime = new StatsWidget(runtime.getStats(), {container: statsParent});
//@ts-ignore
  statsParent.style.visibility = 'visible';

  // Tokyo tower
  runtime.orientToGeocoord({
    lat: Number(demoLat),
    long: Number(demoLong),
    height: Number(demoHeight)
  });

  camera.translateY(1000);
  controls.update();
}

function render(t) {
  const dt = clock.getDelta()
  controls.update();
  if (tilesRuntime) {
    tilesRuntime.update(dt, camera);
  }
  if (statsRuntime) {
    statsRuntime.update();
  }
  renderer.render(scene, camera);
  threeJsStats.update();
  copyrightElement.innerHTML = tilesRuntime?.getDataAttributions() ?? '';
  window.requestAnimationFrame(render);

}

onWindowResize();

function onWindowResize() {
  renderer.setSize(canvasParent.clientWidth, canvasParent.clientHeight);
  tilesRuntime?.setViewport(getViewport());
  camera.aspect = canvasParent.clientWidth / canvasParent.clientHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', onWindowResize)

function getViewport() {
  return {
    width: canvasParent.clientWidth,
    height: canvasParent.clientHeight,
    devicePixelRatio: window.devicePixelRatio
  }
}

// GUI
const gui = new GUI()
  .title("Query params");
//@ts-ignore
gui.width = 300;
//@ts-ignore
gui.add(guiParams, 'lat')
//@ts-ignore
gui.add(guiParams, 'long')
//@ts-ignore
gui.add(guiParams, 'height')
gui.add(guiParams, 'reload');
gui.open();


//@ts-ignore
render();

