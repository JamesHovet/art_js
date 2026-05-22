import * as THREE from 'three';
import { intersectTriangleWithPlane, PlaneDefinition, TriangleDefinition, IntersectionResult } from '../trianglePlaneIntersection';

describe('intersectTriangleWithPlane', () => {
  // Helper function to create a triangle
  const createTriangle = (v1: [number, number, number], v2: [number, number, number], v3: [number, number, number]): TriangleDefinition => ({
    v1: new THREE.Vector3(...v1),
    v2: new THREE.Vector3(...v2),
    v3: new THREE.Vector3(...v3)
  });

  // Helper function to create a plane
  const createPlane = (point: [number, number, number], normal: [number, number, number]): PlaneDefinition => ({
    point: new THREE.Vector3(...point),
    normal: new THREE.Vector3(...normal)
  });

  // Helper function to check if two Vector3s are approximately equal
  const expectVector3ToBeCloseTo = (actual: THREE.Vector3, expected: THREE.Vector3, precision = 5) => {
    expect(actual.x).toBeCloseTo(expected.x, precision);
    expect(actual.y).toBeCloseTo(expected.y, precision);
    expect(actual.z).toBeCloseTo(expected.z, precision);
  };

  describe('No intersection cases', () => {
    test('should return no intersection when triangle is entirely above plane', () => {
      const triangle = createTriangle([0, 2, 0], [1, 3, 0], [2, 2, 0]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(false);
      expect(result.intersectionLine).toBeUndefined();
    });

    test('should return no intersection when triangle is entirely below plane', () => {
      const triangle = createTriangle([0, -2, 0], [1, -3, 0], [2, -2, 0]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(false);
      expect(result.intersectionLine).toBeUndefined();
    });

    test('should return no intersection when triangle lies entirely on the plane', () => {
      const triangle = createTriangle([0, 0, 0], [1, 0, 0], [0, 0, 1]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(false);
      expect(result.intersectionLine).toBeUndefined();
    });

    test('should return no intersection when only one vertex touches the plane', () => {
      const triangle = createTriangle([0, 0, 0], [1, 1, 0], [2, 1, 0]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(false);
      expect(result.intersectionLine).toBeUndefined();
    });

    test('should return no intersection when two vertices are on the plane (edge case)', () => {
      const triangle = createTriangle([0, 0, 0], [1, 0, 0], [0.5, 1, 0]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(false);
      expect(result.intersectionLine).toBeUndefined();
    });
  });

  describe('Valid intersection cases', () => {
    test('should find intersection line when triangle crosses XZ plane', () => {
      const triangle = createTriangle([0, -1, 0], [2, 1, 0], [1, -1, 1]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();

      if (result.intersectionLine) {
        const { start, end } = result.intersectionLine;
        expect(start.distanceTo(end)).toBeGreaterThan(1e-10); // Points should be different

        // Both intersection points should have y = 0 (on the XZ plane)
        expect(start.y).toBeCloseTo(0, 10);
        expect(end.y).toBeCloseTo(0, 10);

        // Verify that the intersection line makes sense geometrically
        expect(result.intersectionLine.start).toBeDefined();
        expect(result.intersectionLine.end).toBeDefined();
      }
    });

    test('should find intersection line when triangle crosses YZ plane', () => {
      const triangle = createTriangle([-1, 0, 0], [1, 1, 0], [1, 0, 1]);
      const plane = createPlane([0, 0, 0], [1, 0, 0]); // YZ plane at x=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();

      if (result.intersectionLine) {
        const { start, end } = result.intersectionLine;
        expect(start.distanceTo(end)).toBeGreaterThan(1e-10); // Points should be different

        // Both intersection points should have x = 0 (on the YZ plane)
        expect(start.x).toBeCloseTo(0, 10);
        expect(end.x).toBeCloseTo(0, 10);
      }
    });

    test('should find intersection line when triangle crosses diagonal plane', () => {
      const triangle = createTriangle([0, 0, 0], [2, 2, 0], [1, 0, 2]);
      const plane = createPlane([1, 1, 1], [1, 1, 0]); // Diagonal plane

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();

      if (result.intersectionLine) {
        const { start, end } = result.intersectionLine;
        expect(start.distanceTo(end)).toBeGreaterThan(1e-10); // Points should be different
      }
    });

    test('should handle intersection when triangle properly crosses the plane', () => {
      const triangle = createTriangle([0, -1, 0], [1, 1, 0], [1, -1, 0]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();

      if (result.intersectionLine) {
        const { start, end } = result.intersectionLine;
        expect(start.distanceTo(end)).toBeGreaterThan(1e-10); // Points should be different

        // Both intersection points should be on the plane (y = 0)
        expect(start.y).toBeCloseTo(0, 10);
        expect(end.y).toBeCloseTo(0, 10);
      }
    });
  });

  describe('Edge cases and robustness', () => {
    test('should handle very small triangles', () => {
      const triangle = createTriangle([0, -0.001, 0], [0.001, 0.001, 0], [0, -0.001, 0.001]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();
    });

    test('should handle triangles with very large coordinates', () => {
      const triangle = createTriangle([0, -1000, 0], [1000, 1000, 0], [500, -1000, 1000]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();
    });

    test('should handle plane with non-normalized normal vector', () => {
      const triangle = createTriangle([0, -1, 0], [2, 1, 0], [1, -1, 1]);
      const plane = createPlane([0, 0, 0], [0, 5, 0]); // Non-normalized normal

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();
    });

    test('should return no intersection for degenerate triangle (collinear points)', () => {
      const triangle = createTriangle([0, 0, 0], [1, 1, 1], [2, 2, 2]); // Collinear points
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      // This should either return no intersection or handle gracefully
      expect(result.hasIntersection).toBe(false);
    });

    test('should handle nearly parallel triangle and plane', () => {
      const triangle = createTriangle([0, 0.001, 0], [1, 0.001, 0], [0.5, -0.001, 1]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionLine).toBeDefined();
    });
  });

  describe('Mathematical precision tests', () => {
    test('should handle floating point precision issues', () => {
      const triangle = createTriangle([0, -1e-15, 0], [1, 1e-15, 0], [0.5, 1, 1]);
      const plane = createPlane([0, 0, 0], [0, 1, 0]); // XZ plane at y=0

      const result = intersectTriangleWithPlane(triangle, plane);

      // Should handle very small distances gracefully
      expect(result).toBeDefined();
    });

    test('should produce consistent results with rotated plane', () => {
      const triangle = createTriangle([0, -1, 0], [2, 1, 0], [1, -1, 1]);

      // Test with XZ plane
      const planeXZ = createPlane([0, 0, 0], [0, 1, 0]);
      const resultXZ = intersectTriangleWithPlane(triangle, planeXZ);

      // Test with equivalent plane but different normal direction
      const planeXZReversed = createPlane([0, 0, 0], [0, -1, 0]);
      const resultXZReversed = intersectTriangleWithPlane(triangle, planeXZReversed);

      expect(resultXZ.hasIntersection).toBe(resultXZReversed.hasIntersection);

      if (resultXZ.hasIntersection && resultXZReversed.hasIntersection) {
        // Both should find an intersection line of the same length
        const lengthXZ = resultXZ.intersectionLine!.start.distanceTo(resultXZ.intersectionLine!.end);
        const lengthReversed = resultXZReversed.intersectionLine!.start.distanceTo(resultXZReversed.intersectionLine!.end);
        expect(lengthXZ).toBeCloseTo(lengthReversed, 10);
      }
    });
  });
});
