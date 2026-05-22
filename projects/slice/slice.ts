import p5 from 'p5';
// @ts-ignore
import init, {p5SVG} from "p5.js-svg";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { intersectTriangleWithPlane, PlaneDefinition, TriangleDefinition, IntersectionResult } from './trianglePlaneIntersection';
import {
  joinLineSegmentsIntoPolygons,
  LineSegment,
  Polygon
} from './polygonUtils';

// @ts-ignore
init(p5);

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 576;

// Model transformation constants
const MODEL_TRANSLATION_X = 0;
const MODEL_TRANSLATION_Y = 0;
const MODEL_TRANSLATION_Z = 0;

// Projection constants
const ORTHOGRAPHIC_SCALE = 100;

// Export for testing - re-export from utility module
export { intersectTriangleWithPlane, PlaneDefinition, TriangleDefinition, IntersectionResult };

export const sliceSketch = (p: p5) => {
  let triangles: Array<{
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3
  }> = [];

  let currentPlane: PlaneDefinition | null = null;
  let showWireframe = false;
  let useColorFill = true;

  // Function to update triangles from external source
  const updateTriangles = (newTriangles: typeof triangles) => {
    triangles = newTriangles;
    // Note: No automatic redraw - SVG will be redrawn only when "Redraw SVG" button is pressed
  };

  // Function to update plane parameters from external source
  const updatePlane = (plane: PlaneDefinition) => {
    currentPlane = plane;
    p.redraw();
  };

  // Function to toggle wireframe rendering
  const toggleWireframe = (enabled: boolean) => {
    showWireframe = enabled;
    // Note: No automatic redraw - SVG will be redrawn only when "Redraw SVG" button is pressed
  };

  // Function to toggle color fill rendering
  const toggleColorFill = (enabled: boolean) => {
    useColorFill = enabled;
    // Note: No automatic redraw - SVG will be redrawn only when "Redraw SVG" button is pressed
  };

  // Function to save SVG
  const saveSVG = () => {
    // @ts-ignore
    p.saveSVG();
  };

  // Make functions available globally
  // @ts-ignore
  window.updateTriangles = updateTriangles;
  // @ts-ignore
  window.updatePlane = updatePlane;
  // @ts-ignore
  window.toggleWireframe = toggleWireframe;
  // @ts-ignore
  window.toggleColorFill = toggleColorFill;
  // @ts-ignore
  window.saveSVG = saveSVG;

  p.setup = () => {
    // @ts-ignore
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, p.SVG);

    // @ts-ignore
    window.mainProcessing = p;
  }

  // Project 3D point to 2D using orthographic projection
  const project3DTo2D = (point: THREE.Vector3) => {
    // Apply the same transformations as in Three.js
    const transformedPoint = point.clone();

    // Get current object scale, rotation and translation from controls
    const scale = parseFloat((document.getElementById('object-scale') as HTMLInputElement)?.value || '0.0066');

    // Apply scale
    transformedPoint.multiplyScalar(scale);
    const rotX = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-x') as HTMLInputElement)?.value || '0'));
    const rotY = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-y') as HTMLInputElement)?.value || '0'));
    const rotZ = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-z') as HTMLInputElement)?.value || '0'));
    const transX = parseFloat((document.getElementById('object-translation-x') as HTMLInputElement)?.value || '0');
    const transY = parseFloat((document.getElementById('object-translation-y') as HTMLInputElement)?.value || '0');

    // Apply rotation
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(rotX, rotY, rotZ)
    );
    transformedPoint.applyMatrix4(rotationMatrix);

    // Apply translation
    transformedPoint.add(new THREE.Vector3(transX, transY, MODEL_TRANSLATION_Z));

    // Orthographic projection - no perspective distortion
    const x = transformedPoint.x * ORTHOGRAPHIC_SCALE + CANVAS_WIDTH / 2;
    const y = -transformedPoint.y * ORTHOGRAPHIC_SCALE + CANVAS_HEIGHT / 2;

    return { x, y };
  };

  // Timing function for intersection calculations
  const calculateIntersectionsWithTiming = (triangles: Array<{v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3}>, plane: PlaneDefinition) => {
    const startTime = performance.now();
    let intersectionCount = 0;
    const intersectionLines: Array<{start: THREE.Vector3, end: THREE.Vector3}> = [];

    // Get current object scale, rotation and translation from controls
    const scale = parseFloat((document.getElementById('object-scale') as HTMLInputElement)?.value || '0.0066');
    const rotX = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-x') as HTMLInputElement)?.value || '90'));
    const rotY = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-y') as HTMLInputElement)?.value || '0'));
    const rotZ = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-z') as HTMLInputElement)?.value || '0'));
    const transX = parseFloat((document.getElementById('object-translation-x') as HTMLInputElement)?.value || '0');
    const transY = parseFloat((document.getElementById('object-translation-y') as HTMLInputElement)?.value || '0');

    for (const triangle of triangles) {
      // Apply transformations to get post-transformed triangle
      const transformedTriangle: TriangleDefinition = {
        v1: triangle.v1.clone(),
        v2: triangle.v2.clone(),
        v3: triangle.v3.clone()
      };

      // Apply scale
      transformedTriangle.v1.multiplyScalar(scale);
      transformedTriangle.v2.multiplyScalar(scale);
      transformedTriangle.v3.multiplyScalar(scale);

      // Apply rotation matrix
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(rotX, rotY, rotZ)
      );
      transformedTriangle.v1.applyMatrix4(rotationMatrix);
      transformedTriangle.v2.applyMatrix4(rotationMatrix);
      transformedTriangle.v3.applyMatrix4(rotationMatrix);

      // Apply translation
      transformedTriangle.v1.add(new THREE.Vector3(transX, transY, MODEL_TRANSLATION_Z));
      transformedTriangle.v2.add(new THREE.Vector3(transX, transY, MODEL_TRANSLATION_Z));
      transformedTriangle.v3.add(new THREE.Vector3(transX, transY, MODEL_TRANSLATION_Z));

      // Calculate intersection
      const intersectionResult = intersectTriangleWithPlane(transformedTriangle, plane);

      if (intersectionResult.hasIntersection && intersectionResult.intersectionLine) {
        intersectionCount++;
        intersectionLines.push({
          start: intersectionResult.intersectionLine.start,
          end: intersectionResult.intersectionLine.end
        });
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Intersection calculation timing:
    - Total triangles: ${triangles.length}
    - Intersecting triangles: ${intersectionCount}
    - Calculation time: ${duration.toFixed(2)}ms
    - Average per triangle: ${(duration / triangles.length).toFixed(4)}ms`);

    return intersectionLines;
  };

  p.draw = () => {
    p.clear(255, 255, 255, 0);

    p.stroke(0);
    p.strokeWeight(1);
    p.noFill();

    // Draw the triangles as wireframes
    if (triangles.length > 0) {
      // Get current slice parameters
      const numSlices = parseInt((document.getElementById('num-slices') as HTMLInputElement).value);
      const sliceDepth = parseFloat((document.getElementById('slice-depth') as HTMLInputElement).value);

      // Calculate polygons organized by slice if base plane exists
      let polygonsBySlice: Polygon[][] = [];

      if (currentPlane && numSlices > 0) {
        // Planes are always horizontal (facing Z direction)
        const baseNormal = new THREE.Vector3(0, 0, 1);
        const baseZ = parseFloat((document.getElementById('plane-z-height') as HTMLInputElement)?.value || '2');

        // Generate polygons for each slice separately (back to front for proper rendering)
        for (let i = numSlices - 1; i >= 0; i--) {
          const t = numSlices > 1 ? i / (numSlices - 1) : 0; // Interpolation factor from 0 to 1
          const offset = -sliceDepth * t; // Negative direction

          // Create plane definition for this slice
          const slicePlane: PlaneDefinition = {
            point: new THREE.Vector3(0, 0, baseZ + offset),
            normal: baseNormal.clone()
          };

          // Calculate intersections for this plane
          const intersectionLines = calculateIntersectionsWithTiming(triangles, slicePlane);

          // Convert intersection lines to LineSegment format for polygon formation
          const lineSegments: LineSegment[] = intersectionLines.map(line => ({
            start: line.start,
            end: line.end
          }));

          // // draw line segments for debugging
          // p.stroke(0, 0, 255); // Blue for intersection lines
          // p.strokeWeight(2);
          // for (const segment of lineSegments) {
          //   const p1 = project3DTo2D(segment.start);
          //   const p2 = project3DTo2D(segment.end);
          //   p.line(p1.x, p1.y, p2.x, p2.y);
          // }

          // Form polygons from line segments for this slice
          const polygonResult = joinLineSegmentsIntoPolygons(lineSegments);
          polygonsBySlice.push(polygonResult.polygons);
        }

        console.log('Polygons by slice:', polygonsBySlice);

        // Helper function to generate distinct colors for each slice
        const getSliceColor = (sliceIndex: number, totalSlices: number) => {
          // Generate colors across the HSB spectrum
          const hue = (sliceIndex * 360) / totalSlices;
          const saturation = 80; // Keep saturation high for vivid colors
          const brightness = 90; // Keep brightness high for visibility

          // Convert HSB to RGB for p5.js
          p.colorMode(p.HSB, 360, 100, 100);
          const color = p.color(hue, saturation, brightness);
          p.colorMode(p.RGB, 255); // Reset to RGB mode
          return color;
        };

        // Get screen space distribution parameters
        const bottomScreenY = parseFloat((document.getElementById('bottom-screen-y') as HTMLInputElement)?.value || '0.9');
        const topScreenY = parseFloat((document.getElementById('top-screen-y') as HTMLInputElement)?.value || '0.1');
        const leftScreenX = parseFloat((document.getElementById('left-screen-x') as HTMLInputElement)?.value || '0.1');
        const rightScreenX = parseFloat((document.getElementById('right-screen-x') as HTMLInputElement)?.value || '0.9');

        // Draw polygons for each slice with different colors (already in back-to-front order)
        polygonsBySlice.forEach((slicePolygons, sliceIndex) => {
          // Start a new SVG group for this slice
          p.push();

          const sliceColor = getSliceColor(sliceIndex, polygonsBySlice.length);

          // Calculate vertical and horizontal offsets for this slice
          // Drawing order: sliceIndex 0 (furthest from camera) drawn first -> should be at TOP (lower Y) and LEFT (lower X)
          // Drawing order: sliceIndex (numSlices-1) (closest to camera) drawn last -> should be at BOTTOM (higher Y) and RIGHT (higher X)
          const totalSlices = polygonsBySlice.length;
          const t = totalSlices > 1 ? sliceIndex / (totalSlices - 1) : 0; // 0 to 1

          // Vertical offset calculation
          const targetScreenY = topScreenY + t * (bottomScreenY - topScreenY); // Interpolate from top to bottom
          const yOffset = (targetScreenY - 0.5) * CANVAS_HEIGHT; // Convert ratio to pixel offset, centered around middle

          // Horizontal offset calculation
          const targetScreenX = leftScreenX + t * (rightScreenX - leftScreenX); // Interpolate from left to right
          const xOffset = (targetScreenX - 0.5) * CANVAS_WIDTH; // Convert ratio to pixel offset, centered around middle

          slicePolygons.forEach(polygon => {
            if (polygon.vertices.length >= 3) {
              // Set fill and stroke based on color fill toggle
              if (useColorFill) {
                p.fill(sliceColor);
                p.strokeWeight(1);
              } else {
                p.fill(255, 255, 255); // White fill
                p.strokeWeight(0.5); // Half thickness stroke
              }
              p.stroke(0, 0, 0);

              // Draw polygon
              p.beginShape();
              polygon.vertices.forEach(vertex => {
                const projected = {
                  x: vertex.x * ORTHOGRAPHIC_SCALE + CANVAS_WIDTH / 2 + xOffset, // Apply horizontal offset
                  y: -vertex.y * ORTHOGRAPHIC_SCALE + CANVAS_HEIGHT / 2 + yOffset // Apply vertical offset
                }
                p.vertex(projected.x, projected.y);
              });
              p.endShape(p.CLOSE);
            }
          });

          // End the SVG group for this slice
          p.pop();
        });
      }
    } else {
      // Draw placeholder shapes while waiting for triangles
      p.ellipse(p.width / 2, p.height / 2, 200, 200);
      p.rect(100, 100, 150, 100);
      p.line(0, 0, p.width, p.height);
    }

    p.noLoop();
  }
}

// Three.js setup
const setupThreeJS = () => {
  const container = document.getElementById('threejs-container');
  if (!container) {
    console.error("Three.js container not found");
    return;
  }

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Camera setup - Orthographic camera
  const frustumSize = 10;
  const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
  const camera = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  container.appendChild(renderer.domElement);

  // Create OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 3;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI;

  // Add lighting for better visualization of the OBJ model
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // Add axis helper at origin (RGB for XYZ)
  const axesHelper = new THREE.AxesHelper(2); // Size of 2 units
  scene.add(axesHelper);

  // Create infinite planes (multiple planes based on numSlices)
  const planes: THREE.Mesh[] = [];
  const createPlanes = () => {
    // Clear existing planes
    planes.forEach(plane => scene.remove(plane));
    planes.length = 0;

    // Get current numSlices value
    const numSlices = parseInt((document.getElementById('num-slices') as HTMLInputElement).value);

    // Create the specified number of planes
    for (let i = 0; i < numSlices; i++) {
      const planeGeometry = new THREE.PlaneGeometry(100, 100); // Large plane
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      planes.push(plane);
      scene.add(plane);
    }
  };

  // Initialize with default number of planes
  createPlanes();

  // Update plane positions based on numSlices and sliceDepth
  const updatePlanePositions = () => {
    const baseZ = parseFloat((document.getElementById('plane-z-height') as HTMLInputElement)?.value || '2');
    const sliceDepth = parseFloat((document.getElementById('slice-depth') as HTMLInputElement).value);
    const numSlices = planes.length;

    // Planes are always horizontal (facing Z direction), no rotation
    const normal = new THREE.Vector3(0, 0, 1); // Fixed plane normal (facing Z)

    // Position each plane
    for (let i = 0; i < numSlices; i++) {
      const plane = planes[i];

      // No rotation - planes are always horizontal
      plane.rotation.set(0, 0, 0);

      // Calculate offset along the negative Z direction
      const t = numSlices > 1 ? i / (numSlices - 1) : 0; // Interpolation factor from 0 to 1
      const offset = -sliceDepth * t; // Negative direction

      // Set position: base Z position + offset
      plane.position.set(0, 0, baseZ + offset);
    }
  };

  // Plane control functions
  const updatePlanePosition = () => {
    updatePlanePositions();
  };

  const updatePlaneRotation = () => {
    updatePlanePositions();
  };


  // Function to get current plane definition from Three.js plane
  const getCurrentPlaneDefinition = () => {
    // Get plane position from Three.js plane
    const position = planes[0].position.clone();

    // Planes are always horizontal (facing Z direction)
    const normal = new THREE.Vector3(0, 0, 1); // Fixed plane normal (facing Z)

    return {
      point: position,
      normal: normal
    };
  };

  // Update both Three.js planes and p5.js plane when sliders change
  const updatePlaneAndNotify = () => {
    updatePlanePosition();
    updatePlaneRotation();

    // Get current plane definition and send to p5.js
    const currentPlaneDefinition = getCurrentPlaneDefinition();
    // @ts-ignore
    if (window.updatePlane) {
      // @ts-ignore
      window.updatePlane(currentPlaneDefinition);
    }
  };

  // Update only Three.js planes (for real-time slider changes)
  const updateThreeJSPlaneOnly = () => {
    updatePlanePosition();
    updatePlaneRotation();
  };

  // Update only the SVG view (for manual redraw button)
  const updateSVGOnly = () => {
    const currentPlaneDefinition = getCurrentPlaneDefinition();
    // @ts-ignore
    if (window.updatePlane) {
      // @ts-ignore
      window.updatePlane(currentPlaneDefinition);
    }
  };

  // Update both Three.js object rotation and SVG rendering
  const updateThreeJSObjectAndSVG = () => {
    updateThreeJSObjectRotation();
    updateSVGOnly();
  };

  // Update Three.js object scale, rotation and translation
  const updateThreeJSObjectTransform = () => {
    if (loadedModel) {
      const scale = parseFloat((document.getElementById('object-scale') as HTMLInputElement).value);
      const rotX = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-x') as HTMLInputElement).value));
      const rotY = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-y') as HTMLInputElement).value));
      const rotZ = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-z') as HTMLInputElement).value));
      const transX = parseFloat((document.getElementById('object-translation-x') as HTMLInputElement).value);
      const transY = parseFloat((document.getElementById('object-translation-y') as HTMLInputElement).value);

      loadedModel.scale.setScalar(scale);
      loadedModel.rotation.set(rotX, rotY, rotZ);
      loadedModel.position.set(transX, transY, MODEL_TRANSLATION_Z);
    }
  };

  // Update Three.js object rotation (legacy function name for compatibility)
  const updateThreeJSObjectRotation = () => {
    updateThreeJSObjectTransform();
  };

  // Function to align camera to look towards X-axis with slight offset
  const alignCameraToXAxis = () => {
    // Position camera to look towards X-axis with a slight Y offset (0.1 degrees)
    // This ensures the green slice planes (which are horizontal) are visible
    const distance = 10; // Distance from origin
    const offsetAngle = THREE.MathUtils.degToRad(0.1); // Convert 0.1 degrees to radians

    // Position camera slightly above the X-axis
    camera.position.set(distance, 0, 0.001);

    // Look at the origin (where the model is)
    camera.lookAt(0, 0, 0);

    // Reset the controls target to origin
    controls.target.set(0, 0, 0);
    controls.update();
  };

  // Helper function to sync slider and numeric input
  const syncSliderAndInput = (sliderId: string, inputId: string, displayId: string, updateFunction: () => void, isAngle = false) => {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const input = document.getElementById(inputId) as HTMLInputElement;
    const display = document.getElementById(displayId) as HTMLElement;

    // Slider changes input and display
    slider.addEventListener('input', () => {
      input.value = slider.value;
      display.textContent = slider.value + (isAngle ? '°' : '');
      updateFunction();
    });

    // Input changes slider and display (allows values beyond slider range)
    input.addEventListener('input', () => {
      // Update slider only if value is within range
      const value = parseFloat(input.value);
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      if (value >= min && value <= max) {
        slider.value = input.value;
      }
      display.textContent = input.value + (isAngle ? '°' : '');
      updateFunction();
    });
  };

  // Setup slider event listeners
  const setupSliderListeners = () => {
    // Object controls - only update Three.js object in real-time
    syncSliderAndInput('object-rotation-x', 'object-rotation-x-input', 'object-rotation-x-value', updateThreeJSObjectRotation, true);
    syncSliderAndInput('object-rotation-y', 'object-rotation-y-input', 'object-rotation-y-value', updateThreeJSObjectRotation, true);
    syncSliderAndInput('object-rotation-z', 'object-rotation-z-input', 'object-rotation-z-value', updateThreeJSObjectRotation, true);
    syncSliderAndInput('object-translation-x', 'object-translation-x-input', 'object-translation-x-value', updateThreeJSObjectRotation);
    syncSliderAndInput('object-translation-y', 'object-translation-y-input', 'object-translation-y-value', updateThreeJSObjectRotation);
    syncSliderAndInput('object-scale', 'object-scale-input', 'object-scale-value', updateThreeJSObjectRotation);

    // Plane controls - only update Three.js in real-time
    syncSliderAndInput('plane-z-height', 'plane-z-height-input', 'plane-z-height-value', updateThreeJSPlaneOnly);

    // Slice option sliders - only update Three.js in real-time
    const numSlicesSlider = document.getElementById('num-slices') as HTMLInputElement;
    const numSlicesInput = document.getElementById('num-slices-input') as HTMLInputElement;
    const numSlicesDisplay = document.getElementById('num-slices-value') as HTMLElement;

    const updateSlices = () => {
      createPlanes(); // Recreate planes with new count
      updateThreeJSPlaneOnly(); // Update their positions
    };

    numSlicesSlider.addEventListener('input', () => {
      numSlicesInput.value = numSlicesSlider.value;
      numSlicesDisplay.textContent = numSlicesSlider.value;
      updateSlices();
    });

    numSlicesInput.addEventListener('input', () => {
      const value = parseFloat(numSlicesInput.value);
      if (value >= 2 && value <= 50) {
        numSlicesSlider.value = numSlicesInput.value;
      }
      numSlicesDisplay.textContent = numSlicesInput.value;
      updateSlices();
    });

    syncSliderAndInput('slice-depth', 'slice-depth-input', 'slice-depth-value', updateThreeJSPlaneOnly);

    // Screen space distribution controls - no automatic redraw (SVG only updates on button press)
    syncSliderAndInput('bottom-screen-y', 'bottom-screen-y-input', 'bottom-screen-y-value', () => {});
    syncSliderAndInput('top-screen-y', 'top-screen-y-input', 'top-screen-y-value', () => {});
    syncSliderAndInput('left-screen-x', 'left-screen-x-input', 'left-screen-x-value', () => {});
    syncSliderAndInput('right-screen-x', 'right-screen-x-input', 'right-screen-x-value', () => {});

    // Wireframe toggle - just store the state, no automatic redraw
    const wireframeCheckbox = document.getElementById('show-wireframe') as HTMLInputElement;
    wireframeCheckbox.addEventListener('change', () => {
      // @ts-ignore
      if (window.toggleWireframe) {
        // @ts-ignore
        window.toggleWireframe(wireframeCheckbox.checked);
      }
    });

    // Color fill toggle - just store the state, no automatic redraw
    const colorFillCheckbox = document.getElementById('color-fill') as HTMLInputElement;
    colorFillCheckbox.addEventListener('change', () => {
      // @ts-ignore
      if (window.toggleColorFill) {
        // @ts-ignore
        window.toggleColorFill(colorFillCheckbox.checked);
      }
    });

    // Redraw SVG button
    const redrawSVGButton = document.getElementById('redraw-svg') as HTMLButtonElement;
    redrawSVGButton.addEventListener('click', () => {
      updateSVGOnly();
    });

    // Save SVG button
    const saveSVGButton = document.getElementById('saveSVG') as HTMLButtonElement;
    saveSVGButton.addEventListener('click', () => {
      // @ts-ignore
      if (window.saveSVG) {
        // @ts-ignore
        window.saveSVG();
      }
    });

    // Align camera to X-axis button
    const alignCameraButton = document.getElementById('align-camera-x') as HTMLButtonElement;
    alignCameraButton.addEventListener('click', () => {
      alignCameraToXAxis();
    });

    // Initialize plane definition on startup (Three.js only)
    setTimeout(() => {
      updateThreeJSPlaneOnly();
    }, 200);
  };

  // Initialize sliders after DOM is ready
  setTimeout(setupSliderListeners, 100);

  // Function to get query parameter value
  const getQueryParam = (param: string): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  // Load OBJ file
  const loader = new OBJLoader();
  let loadedModel: THREE.Group | null = null;

  // Determine which model to load based on query parameter
  const modelParam = getQueryParam('model');
  const modelPath = modelParam ? `projects/slice/assets/${modelParam}.obj` : 'projects/slice/assets/flatiron_new.obj'; // Default to flatiron_new.obj

  loader.load(
    modelPath,
    // onLoad callback
    (object) => {
      // Set initial scale, rotation and translation from controls
      const scale = parseFloat((document.getElementById('object-scale') as HTMLInputElement)?.value || '0.0066');
      const rotX = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-x') as HTMLInputElement)?.value || '90'));
      const rotY = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-y') as HTMLInputElement)?.value || '0'));
      const rotZ = THREE.MathUtils.degToRad(parseFloat((document.getElementById('object-rotation-z') as HTMLInputElement)?.value || '0'));
      const transX = parseFloat((document.getElementById('object-translation-x') as HTMLInputElement)?.value || '0');
      const transY = parseFloat((document.getElementById('object-translation-y') as HTMLInputElement)?.value || '0');

      object.scale.setScalar(scale);
      object.rotation.set(rotX, rotY, rotZ);
      object.position.set(transX, transY, MODEL_TRANSLATION_Z);

      // Extract raw triangles from the model
      const triangles: Array<{
        v1: THREE.Vector3,
        v2: THREE.Vector3,
        v3: THREE.Vector3
      }> = [];

      object.traverse((child) => {
        if (child.type === 'Mesh' || child instanceof THREE.Mesh) {
          const mesh = child as THREE.Mesh;
          const geometry = mesh.geometry;
          const positions = geometry.attributes.position;

          if (positions && geometry.index) {
            // Indexed geometry
            const indices = geometry.index.array;

            for (let i = 0; i < indices.length; i += 3) {
              const i1 = indices[i] * 3;
              const i2 = indices[i + 1] * 3;
              const i3 = indices[i + 2] * 3;

              triangles.push({
                v1: new THREE.Vector3(positions.array[i1], positions.array[i1 + 1], positions.array[i1 + 2]),
                v2: new THREE.Vector3(positions.array[i2], positions.array[i2 + 1], positions.array[i2 + 2]),
                v3: new THREE.Vector3(positions.array[i3], positions.array[i3 + 1], positions.array[i3 + 2])
              });
            }
          } else if (positions) {
            // Non-indexed geometry
            for (let i = 0; i < positions.count; i += 3) {
              const i1 = i * 3;
              const i2 = (i + 1) * 3;
              const i3 = (i + 2) * 3;

              triangles.push({
                v1: new THREE.Vector3(positions.array[i1], positions.array[i1 + 1], positions.array[i1 + 2]),
                v2: new THREE.Vector3(positions.array[i2], positions.array[i2 + 1], positions.array[i2 + 2]),
                v3: new THREE.Vector3(positions.array[i3], positions.array[i3 + 1], positions.array[i3 + 2])
              });
            }
          }
        }
      });

      // Pass triangles to p5.js for SVG rendering
      // @ts-ignore
      if (window.updateTriangles) {
        // @ts-ignore
        window.updateTriangles(triangles);
        console.log('Triangles sent to p5.js for SVG rendering');
      }

      // Example: Access the first triangle
      if (triangles.length > 0) {
        const firstTriangle = triangles[0];
        console.log('First triangle vertices:', {
          vertex1: firstTriangle.v1,
          vertex2: firstTriangle.v2,
          vertex3: firstTriangle.v3
        });
      }

      loadedModel = object;
      scene.add(object);
    },
    // onProgress callback
    (xhr) => {
      if (xhr.lengthComputable) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log('Loading progress: ' + Math.round(percentComplete) + '% loaded');
      }
    },
    // onError callback
    (error) => {
      console.error('Error loading OBJ file:', error);
    }
  );

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    renderer.render(scene, camera);
  };

  animate();

  console.log("Three.js scene initialized");
};

// Initialize both p5 and Three.js
const sliceContainer = document.getElementById('slice-container');
if (sliceContainer) {
  const sliceP5 = new p5(sliceSketch, sliceContainer);
  console.log("Slice p5 instance:", sliceP5);
} else {
  console.error("Slice container not found");
}

// Initialize Three.js scene
setupThreeJS();
