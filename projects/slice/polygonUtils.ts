import * as THREE from 'three';

export interface LineSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

export interface Polygon {
  vertices: THREE.Vector3[];
}

export interface PolygonFormationResult {
  polygons: Polygon[];
  unusedSegments: LineSegment[];
}


/**
 * Joins line segments into contiguous polygons using a greedy approach.
 * This function attempts to connect line segments end-to-end to form closed polygons.
 *
 * @param segments Array of line segments to join
 * @param tolerance Distance tolerance for considering points as equal (default: 1e-6)
 * @returns Object containing formed polygons and any unused segments
 */
export function joinLineSegmentsIntoPolygons(
  segments: LineSegment[],
  tolerance: number = 1e-5
): PolygonFormationResult {
  if (segments.length === 0) {
    return { polygons: [], unusedSegments: [] };
  }

  // Spatial grid for fast vertex lookup and deduplication
  interface GridCell {
    vertices: { point: THREE.Vector3; segmentIndex: number; isStart: boolean }[];
    segments: { segment: LineSegment; originalIndex: number; deduplicatedIndex: number }[];
  }

  interface SpatialGrid {
    cellSize: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    gridWidth: number;
    gridHeight: number;
    cells: Map<string, GridCell>;
  }

  // Create spatial grid with deduplication
  const createSpatialGridWithDeduplication = (segments: LineSegment[], tolerance: number): { grid: SpatialGrid; deduplicatedSegments: LineSegment[] } => {
    // Use cell size that's larger than tolerance to handle edge cases
    const cellSize = Math.max(tolerance * 3, 1e-5);

    // Find bounds of all vertices
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    segments.forEach(segment => {
      [segment.start, segment.end].forEach(vertex => {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
      });
    });

    // Add padding
    const padding = cellSize;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const gridWidth = Math.ceil((maxX - minX) / cellSize);
    const gridHeight = Math.ceil((maxY - minY) / cellSize);

    const grid: SpatialGrid = {
      cellSize,
      minX,
      minY,
      maxX,
      maxY,
      gridWidth,
      gridHeight,
      cells: new Map()
    };

    const deduplicatedSegments: LineSegment[] = [];

    // Helper function to check if two segments are duplicates
    const areSegmentsDuplicate = (seg1: LineSegment, seg2: LineSegment): boolean => {
      // Check both orientations:
      // 1. seg1.start == seg2.start && seg1.end == seg2.end
      // 2. seg1.start == seg2.end && seg1.end == seg2.start
      const option1 = seg1.start.distanceTo(seg2.start) <= tolerance &&
                      seg1.end.distanceTo(seg2.end) <= tolerance;

      const option2 = seg1.start.distanceTo(seg2.end) <= tolerance &&
                      seg1.end.distanceTo(seg2.start) <= tolerance;

      return option1 || option2;
    };

    // Helper function to find duplicates in neighboring cells
    const findDuplicateInGrid = (segment: LineSegment): number | null => {
      const centerX = (segment.start.x + segment.end.x) / 2;
      const centerY = (segment.start.y + segment.end.y) / 2;
      const cellX = Math.floor((centerX - grid.minX) / cellSize);
      const cellY = Math.floor((centerY - grid.minY) / cellSize);

      // Check neighboring cells
      const checkRadius = Math.ceil(tolerance / cellSize) + 1;

      for (let dx = -checkRadius; dx <= checkRadius; dx++) {
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
          const checkX = cellX + dx;
          const checkY = cellY + dy;

          if (checkX < 0 || checkX >= gridWidth || checkY < 0 || checkY >= gridHeight) {
            continue;
          }

          const cellKey = `${checkX},${checkY}`;
          const cell = grid.cells.get(cellKey);

          if (!cell) continue;

          for (const existingSegment of cell.segments) {
            if (areSegmentsDuplicate(segment, existingSegment.segment)) {
              return existingSegment.deduplicatedIndex;
            }
          }
        }
      }

      return null;
    };

    // Process segments with deduplication
    segments.forEach((segment, originalIndex) => {
      const duplicateIndex = findDuplicateInGrid(segment);

      if (duplicateIndex === null) {
        // This is a new unique segment
        const deduplicatedIndex = deduplicatedSegments.length;
        deduplicatedSegments.push(segment);

        // Add to grid for future deduplication checks
        const centerX = (segment.start.x + segment.end.x) / 2;
        const centerY = (segment.start.y + segment.end.y) / 2;
        const cellX = Math.floor((centerX - grid.minX) / cellSize);
        const cellY = Math.floor((centerY - grid.minY) / cellSize);
        const cellKey = `${cellX},${cellY}`;

        if (!grid.cells.has(cellKey)) {
          grid.cells.set(cellKey, { vertices: [], segments: [] });
        }

        grid.cells.get(cellKey)!.segments.push({ segment, originalIndex, deduplicatedIndex });

        // Add vertices to grid
        addVertexToGrid(grid, segment.start, deduplicatedIndex, true);
        addVertexToGrid(grid, segment.end, deduplicatedIndex, false);
      }
    });

    // Log deduplication results
    if (segments.length !== deduplicatedSegments.length) {
      console.log(`Deduplication: ${segments.length} -> ${deduplicatedSegments.length} segments (removed ${segments.length - deduplicatedSegments.length} duplicates)`);
    }

    return { grid, deduplicatedSegments };
  };

  const addVertexToGrid = (grid: SpatialGrid, vertex: THREE.Vector3, segmentIndex: number, isStart: boolean) => {
    const cellX = Math.floor((vertex.x - grid.minX) / grid.cellSize);
    const cellY = Math.floor((vertex.y - grid.minY) / grid.cellSize);
    const cellKey = `${cellX},${cellY}`;

    if (!grid.cells.has(cellKey)) {
      grid.cells.set(cellKey, { vertices: [], segments: [] });
    }

    grid.cells.get(cellKey)!.vertices.push({ point: vertex, segmentIndex, isStart });
  };

  // Find approximately equal vertex within tolerance
  const findMatchingVertex = (
    grid: SpatialGrid,
    vertex: THREE.Vector3,
    tolerance: number,
    usedSegments: Set<number>
  ): { point: THREE.Vector3; segmentIndex: number; isStart: boolean } | null => {
    const cellX = Math.floor((vertex.x - grid.minX) / grid.cellSize);
    const cellY = Math.floor((vertex.y - grid.minY) / grid.cellSize);

    // Check neighboring cells if vertex is close to edge
    const checkRadius = Math.ceil(tolerance / grid.cellSize) + 1;

    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        const checkX = cellX + dx;
        const checkY = cellY + dy;

        if (checkX < 0 || checkX >= grid.gridWidth || checkY < 0 || checkY >= grid.gridHeight) {
          continue;
        }

        const cellKey = `${checkX},${checkY}`;
        const cell = grid.cells.get(cellKey);

        if (!cell) continue;

        for (const candidateVertex of cell.vertices) {
          // Skip if this vertex belongs to a segment that's already been used
          if (usedSegments.has(candidateVertex.segmentIndex)) continue;

          const distance = vertex.distanceTo(candidateVertex.point);
          if (distance <= tolerance) {
            return candidateVertex;
          }
        }
      }
    }

    return null;
  };

  const { grid, deduplicatedSegments } = createSpatialGridWithDeduplication(segments, tolerance);
  const usedSegments = new Set<number>();
  const chains: LineSegment[][] = [];


  // Build chains by connecting segments greedily
  for (let i = 0; i < deduplicatedSegments.length; i++) {
    if (usedSegments.has(i)) continue;

    const chain: LineSegment[] = [deduplicatedSegments[i]];
    usedSegments.add(i);

    // Try to extend the chain in both directions
    let currentEnd = deduplicatedSegments[i].end;
    let currentStart = deduplicatedSegments[i].start;

    // Extend forward
    while (true) {
      const match = findMatchingVertex(grid, currentEnd, tolerance, usedSegments);
      if (!match || usedSegments.has(match.segmentIndex)) break;

      const nextSegment = deduplicatedSegments[match.segmentIndex];
      usedSegments.add(match.segmentIndex);

      if (match.isStart) {
        // Connect end to start: keep segment as-is
        chain.push(nextSegment);
        currentEnd = nextSegment.end;
      } else {
        // Connect end to end: reverse the segment
        chain.push({ start: nextSegment.end, end: nextSegment.start });
        currentEnd = nextSegment.start;
      }
    }

    // Extend backward
    while (true) {
      const match = findMatchingVertex(grid, currentStart, tolerance, usedSegments);
      if (!match || usedSegments.has(match.segmentIndex)) break;

      const nextSegment = deduplicatedSegments[match.segmentIndex];
      usedSegments.add(match.segmentIndex);

      if (match.isStart) {
        // Connect start to start: reverse and prepend
        chain.unshift({ start: nextSegment.end, end: nextSegment.start });
        currentStart = nextSegment.end;
      } else {
        // Connect start to end: prepend as-is
        chain.unshift(nextSegment);
        currentStart = nextSegment.start;
      }
    }

    chains.push(chain);
  }

  // Convert chains to polygons
  const polygons: Polygon[] = [];
  const unusedSegments: LineSegment[] = [];

  for (const chain of chains) {
    if (chain.length === 0) continue;

    // Check if chain is closed
    const firstVertex = chain[0].start;
    const lastVertex = chain[chain.length - 1].end;
    const isClosed = firstVertex.distanceTo(lastVertex) <= tolerance;

    // Create vertices array
    const vertices: THREE.Vector3[] = [];

    // Add all start vertices
    chain.forEach(segment => vertices.push(segment.start.clone()));

    if (!isClosed) {
      // Add closing segment implicitly by including the last end vertex
      vertices.push(lastVertex.clone());
    }

    // Only create polygon if we have enough vertices
    if (vertices.length >= 3) {
      polygons.push({ vertices });
    } else {
      // Add segments to unused if they don't form a valid polygon
      unusedSegments.push(...chain);
    }
  }

  return { polygons, unusedSegments };
}

/**
 * Sorts polygons by their distance from a camera position (back to front for rendering)
 *
 * @param polygons Array of polygons to sort
 * @param cameraPosition Position of the camera/viewer
 * @returns Sorted array of polygons (furthest first)
 */
export function sortPolygonsBackToFront(polygons: Polygon[], cameraPosition: THREE.Vector3): Polygon[] {
  return polygons.slice().sort((a, b) => {
    // Calculate average position (centroid) of each polygon
    const getCentroid = (poly: Polygon): THREE.Vector3 => {
      const centroid = new THREE.Vector3();
      poly.vertices.forEach(vertex => centroid.add(vertex));
      centroid.divideScalar(poly.vertices.length);
      return centroid;
    };

    const centroidA = getCentroid(a);
    const centroidB = getCentroid(b);

    const distanceA = cameraPosition.distanceTo(centroidA);
    const distanceB = cameraPosition.distanceTo(centroidB);

    // Sort furthest first (back to front)
    return distanceB - distanceA;
  });
}
