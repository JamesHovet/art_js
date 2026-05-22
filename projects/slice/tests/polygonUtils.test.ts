import * as THREE from 'three';
import {
  joinLineSegmentsIntoPolygons,
  sortPolygonsBackToFront,
  LineSegment,
  Polygon
} from '../polygonUtils';

describe('Polygon Utils', () => {
  describe('joinLineSegmentsIntoPolygons', () => {
    test('should return empty result for empty input', () => {
      const result = joinLineSegmentsIntoPolygons([]);
      expect(result.polygons).toHaveLength(0);
      expect(result.unusedSegments).toHaveLength(0);
    });

    test('should form a simple triangle from three connected segments', () => {
      const segments: LineSegment[] = [
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
        { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
        { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) }
      ];

      const result = joinLineSegmentsIntoPolygons(segments);

      expect(result.polygons).toHaveLength(1);
      expect(result.polygons[0].vertices).toHaveLength(3);
      expect(result.unusedSegments).toHaveLength(0);
    });

    test('should form a square from four connected segments', () => {
      const segments: LineSegment[] = [
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
        { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(1, 1, 0) },
        { start: new THREE.Vector3(1, 1, 0), end: new THREE.Vector3(0, 1, 0) },
        { start: new THREE.Vector3(0, 1, 0), end: new THREE.Vector3(0, 0, 0) }
      ];

      const result = joinLineSegmentsIntoPolygons(segments);

      expect(result.polygons).toHaveLength(1);
      expect(result.polygons[0].vertices).toHaveLength(4);
      expect(result.unusedSegments).toHaveLength(0);
    });

    test('should handle segments in random order', () => {
      // Same square as above but in random order
      const segments: LineSegment[] = [
        { start: new THREE.Vector3(1, 1, 0), end: new THREE.Vector3(0, 1, 0) },
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
        { start: new THREE.Vector3(0, 1, 0), end: new THREE.Vector3(0, 0, 0) },
        { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(1, 1, 0) }
      ];

      const result = joinLineSegmentsIntoPolygons(segments);

      expect(result.polygons).toHaveLength(1);
      expect(result.polygons[0].vertices).toHaveLength(4);
      expect(result.unusedSegments).toHaveLength(0);
    });

    test('should handle reversed segments correctly', () => {
      const segments: LineSegment[] = [
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
        { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(1, 0, 0) }, // Reversed
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(0.5, 1, 0) }  // Reversed
      ];

      const result = joinLineSegmentsIntoPolygons(segments);

      expect(result.polygons).toHaveLength(1);
      expect(result.polygons[0].vertices).toHaveLength(3);
    });

    test('should form multiple separate polygons', () => {
      const segments: LineSegment[] = [
        // First triangle
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
        { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
        { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
        // Second triangle (separate)
        { start: new THREE.Vector3(2, 0, 0), end: new THREE.Vector3(3, 0, 0) },
        { start: new THREE.Vector3(3, 0, 0), end: new THREE.Vector3(2.5, 1, 0) },
        { start: new THREE.Vector3(2.5, 1, 0), end: new THREE.Vector3(2, 0, 0) }
      ];

      const result = joinLineSegmentsIntoPolygons(segments);

      expect(result.polygons).toHaveLength(2);
      expect(result.polygons[0].vertices).toHaveLength(3);
      expect(result.polygons[1].vertices).toHaveLength(3);
      expect(result.unusedSegments).toHaveLength(0);
    });

    test('should close open paths automatically', () => {
      const segments: LineSegment[] = [
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
        { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
        // Missing closing segment - should be added automatically
      ];

      const result = joinLineSegmentsIntoPolygons(segments);

      // Should form a polygon with automatic closing
      expect(result.polygons).toHaveLength(1);
      expect(result.polygons[0].vertices).toHaveLength(3);
    });

    test('should handle tolerance for near-equal points', () => {
      const tolerance = 1e-5;
      const segments: LineSegment[] = [
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
        { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
        // Close but not exactly at origin due to floating point precision
        { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(tolerance * 0.5, 0, 0) }
      ];

      const result = joinLineSegmentsIntoPolygons(segments, tolerance);

      expect(result.polygons).toHaveLength(1);
      expect(result.polygons[0].vertices).toHaveLength(3);
    });

    describe('deduplication', () => {
      test('should remove exact duplicate segments', () => {
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // Exact duplicate
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          // Another exact duplicate
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments);

        // Should still form only one triangle despite duplicates
        expect(result.polygons).toHaveLength(1);
        expect(result.polygons[0].vertices).toHaveLength(3);
        expect(result.unusedSegments).toHaveLength(0);
      });

      test('should remove reversed duplicate segments', () => {
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // Reversed duplicate (end -> start)
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0, 0, 0) },
          // Another reversed duplicate
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(1, 0, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments);

        // Should still form only one triangle despite reversed duplicates
        expect(result.polygons).toHaveLength(1);
        expect(result.polygons[0].vertices).toHaveLength(3);
        expect(result.unusedSegments).toHaveLength(0);
      });

      test('should handle mixed exact and reversed duplicates', () => {
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(1, 1, 0) },
          { start: new THREE.Vector3(1, 1, 0), end: new THREE.Vector3(0, 1, 0) },
          { start: new THREE.Vector3(0, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // Exact duplicate
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          // Reversed duplicate
          { start: new THREE.Vector3(1, 1, 0), end: new THREE.Vector3(1, 0, 0) },
          // Another exact duplicate
          { start: new THREE.Vector3(1, 1, 0), end: new THREE.Vector3(0, 1, 0) },
          // Another reversed duplicate
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(0, 1, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments);

        // Should form one square despite all the duplicates
        expect(result.polygons).toHaveLength(1);
        expect(result.polygons[0].vertices).toHaveLength(4);
        expect(result.unusedSegments).toHaveLength(0);
      });

      test('should handle precision issues in duplicate detection', () => {
        const tolerance = 1e-5;
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // Near-duplicate within tolerance (should be removed)
          { start: new THREE.Vector3(tolerance * 0.5, tolerance * 0.5, 0), end: new THREE.Vector3(1 + tolerance * 0.5, tolerance * 0.5, 0) },
          // Reversed near-duplicate within tolerance (should be removed)
          { start: new THREE.Vector3(0.5, 1 - tolerance * 0.5, 0), end: new THREE.Vector3(tolerance * 0.5, tolerance * 0.5, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments, tolerance);

        // Should still form only one triangle despite near-duplicates
        expect(result.polygons).toHaveLength(1);
        expect(result.polygons[0].vertices).toHaveLength(3);
        expect(result.unusedSegments).toHaveLength(0);
      });

      test('should NOT remove segments that are outside tolerance', () => {
        const tolerance = 1e-5;
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // Similar but outside tolerance (should NOT be removed)
          { start: new THREE.Vector3(tolerance * 2, tolerance * 2, 0), end: new THREE.Vector3(1 + tolerance * 2, tolerance * 2, 0) },
          // Another segment outside tolerance
          { start: new THREE.Vector3(1 + tolerance * 2, tolerance * 2, 0), end: new THREE.Vector3(0.5 + tolerance * 2, 1 + tolerance * 2, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments, tolerance);

        // Should form multiple polygons/segments since some are outside tolerance
        expect(result.polygons.length + result.unusedSegments.length).toBeGreaterThan(1);
      });

      test('should handle very small tolerance values', () => {
        const tolerance = 1e-10;
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // Exact duplicate
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          // Near duplicate but outside very small tolerance
          { start: new THREE.Vector3(1e-9, 0, 0), end: new THREE.Vector3(1, 0, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments, tolerance);

        // Exact duplicate should be removed, but near-duplicate outside tolerance should remain
        expect(result.polygons.length + result.unusedSegments.length).toBeGreaterThan(1);
      });

      test('should handle very large tolerance values', () => {
        const tolerance = 1.0; // Very large tolerance
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // Segments that would be considered duplicates with large tolerance
          { start: new THREE.Vector3(0.5, 0.5, 0), end: new THREE.Vector3(1.5, 0.5, 0) },
          { start: new THREE.Vector3(1.5, 0.5, 0), end: new THREE.Vector3(1, 1.5, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments, tolerance);

        // With large tolerance, many segments might be considered duplicates
        // Should still form valid polygons
        expect(result.polygons).toHaveLength(1);
      });

      test('should handle empty array', () => {
        const result = joinLineSegmentsIntoPolygons([]);
        expect(result.polygons).toHaveLength(0);
        expect(result.unusedSegments).toHaveLength(0);
      });

      test('should handle single segment (no duplicates possible)', () => {
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments);

        expect(result.polygons).toHaveLength(0);
        expect(result.unusedSegments).toHaveLength(1);
      });

      test('should handle all segments being duplicates', () => {
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0, 0, 0) }, // Reversed
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0, 0, 0) }  // Reversed
        ];

        const result = joinLineSegmentsIntoPolygons(segments);

        // Should keep only one segment
        expect(result.polygons).toHaveLength(0);
        expect(result.unusedSegments).toHaveLength(1);
      });

      test('should preserve first occurrence when deduplicating', () => {
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) },
          // This duplicate should be removed
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments);

        // Should form exactly one triangle (proving deduplication worked)
        expect(result.polygons).toHaveLength(1);
        expect(result.polygons[0].vertices).toHaveLength(3);
        expect(result.unusedSegments).toHaveLength(0);

        // Check that the first vertex is still at the expected position (proving first occurrence was kept)
        const firstVertex = result.polygons[0].vertices[0];
        expect(firstVertex.x).toBeCloseTo(0);
        expect(firstVertex.y).toBeCloseTo(0);
        expect(firstVertex.z).toBeCloseTo(0);
      });

      test('should handle massive number of duplicates efficiently', () => {
        const baseSegments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 0) },
          { start: new THREE.Vector3(1, 0, 0), end: new THREE.Vector3(0.5, 1, 0) },
          { start: new THREE.Vector3(0.5, 1, 0), end: new THREE.Vector3(0, 0, 0) }
        ];

        // Create 1000 duplicates of each segment
        const segments: LineSegment[] = [];
        for (let i = 0; i < 1000; i++) {
          segments.push(...baseSegments);
        }

        const startTime = performance.now();
        const result = joinLineSegmentsIntoPolygons(segments);
        const endTime = performance.now();

        // Should still form only one triangle despite 3000 input segments
        expect(result.polygons).toHaveLength(1);
        expect(result.polygons[0].vertices).toHaveLength(3);
        expect(result.unusedSegments).toHaveLength(0);

        // Should complete in reasonable time (less than 1 second)
        expect(endTime - startTime).toBeLessThan(1000);
      });

      test('should handle deduplication with 3D coordinates', () => {
        const segments: LineSegment[] = [
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 1) },
          { start: new THREE.Vector3(1, 0, 1), end: new THREE.Vector3(0.5, 1, 0.5) },
          { start: new THREE.Vector3(0.5, 1, 0.5), end: new THREE.Vector3(0, 0, 0) },
          // 3D duplicate
          { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(1, 0, 1) },
          // 3D reversed duplicate
          { start: new THREE.Vector3(0.5, 1, 0.5), end: new THREE.Vector3(1, 0, 1) }
        ];

        const result = joinLineSegmentsIntoPolygons(segments);

        expect(result.polygons).toHaveLength(1);
        expect(result.polygons[0].vertices).toHaveLength(3);
        expect(result.unusedSegments).toHaveLength(0);
      });
    });

  });


  describe('sortPolygonsBackToFront', () => {
    test('should sort polygons by distance from camera', () => {
      const polygons: Polygon[] = [
        // Near polygon
        {
          vertices: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0.5, 1, 0)
          ]
        },
        // Far polygon
        {
          vertices: [
            new THREE.Vector3(0, 0, 10),
            new THREE.Vector3(1, 0, 10),
            new THREE.Vector3(0.5, 1, 10)
          ]
        }
      ];

      const cameraPosition = new THREE.Vector3(0, 0, -5);
      const sorted = sortPolygonsBackToFront(polygons, cameraPosition);

      // Far polygon should come first (back to front)
      expect(sorted[0].vertices[0].z).toBe(10);
      expect(sorted[1].vertices[0].z).toBe(0);
    });

    test('should not mutate original array', () => {
      const polygons: Polygon[] = [
        {
          vertices: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0.5, 1, 0)
          ]
        }
      ];

      const cameraPosition = new THREE.Vector3(0, 0, -5);
      const sorted = sortPolygonsBackToFront(polygons, cameraPosition);

      expect(sorted).not.toBe(polygons);
      expect(polygons).toHaveLength(1);
    });
  });
});
