import * as THREE from 'three';

// Triangle-Plane Intersection Helper Function
export interface PlaneDefinition {
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

export interface TriangleDefinition {
  v1: THREE.Vector3;
  v2: THREE.Vector3;
  v3: THREE.Vector3;
}

export interface IntersectionResult {
  hasIntersection: boolean;
  intersectionLine?: {
    start: THREE.Vector3;
    end: THREE.Vector3;
  };
}

export const intersectTriangleWithPlane = (triangle: TriangleDefinition, plane: PlaneDefinition): IntersectionResult => {
  const { v1, v2, v3 } = triangle;
  const { point: planePoint, normal: planeNormal } = plane;

  // Normalize the plane normal
  const normalizedNormal = planeNormal.clone().normalize();

  // Calculate signed distances from each vertex to the plane
  // Distance = dot(vertex - planePoint, planeNormal)
  const d1 = v1.clone().sub(planePoint).dot(normalizedNormal);
  const d2 = v2.clone().sub(planePoint).dot(normalizedNormal);
  const d3 = v3.clone().sub(planePoint).dot(normalizedNormal);

  const epsilon = 1e-10; // Small threshold for floating point comparison

  // Check if all vertices are on the same side of the plane
  const sign1 = Math.abs(d1) < epsilon ? 0 : Math.sign(d1);
  const sign2 = Math.abs(d2) < epsilon ? 0 : Math.sign(d2);
  const sign3 = Math.abs(d3) < epsilon ? 0 : Math.sign(d3);

  // Count vertices on each side
  const positive = [sign1, sign2, sign3].filter(s => s > 0).length;
  const negative = [sign1, sign2, sign3].filter(s => s < 0).length;
  const onPlane = [sign1, sign2, sign3].filter(s => s === 0).length;

  // No intersection cases:
  // 1. All vertices on same side of plane
  if (positive === 3 || negative === 3) {
    return { hasIntersection: false };
  }

  // 2. Triangle lies entirely on the plane
  if (onPlane === 3) {
    return { hasIntersection: false };
  }

  // 3. Only one vertex touches the plane (single point intersection)
  if (onPlane === 2 || (onPlane === 1 && (positive === 0 || negative === 0))) {
    return { hasIntersection: false };
  }

  // Find intersection points
  const intersectionPoints: THREE.Vector3[] = [];

  // Helper function to find intersection point between two vertices
  const findIntersection = (vertex1: THREE.Vector3, vertex2: THREE.Vector3, dist1: number, dist2: number): THREE.Vector3 | null => {
    // If both points are on the plane, return null (edge case)
    if (Math.abs(dist1) < epsilon && Math.abs(dist2) < epsilon) {
      return null;
    }

    // If one point is on the plane, return that point
    if (Math.abs(dist1) < epsilon) return vertex1.clone();
    if (Math.abs(dist2) < epsilon) return vertex2.clone();

    // If both points are on the same side, no intersection
    if (Math.sign(dist1) === Math.sign(dist2)) {
      return null;
    }

    // Calculate intersection point using linear interpolation
    const t = dist1 / (dist1 - dist2);
    return vertex1.clone().lerp(vertex2, t);
  };

  // Check each edge for intersection
  const edges = [
    { v1, v2, d1, d2 },
    { v1: v2, v2: v3, d1: d2, d2: d3 },
    { v1: v3, v2: v1, d1: d3, d2: d1 }
  ];

  for (const edge of edges) {
    const intersection = findIntersection(edge.v1, edge.v2, edge.d1, edge.d2);
    if (intersection) {
      intersectionPoints.push(intersection);
    }
  }

  // We should have exactly 2 intersection points for a valid line intersection
  if (intersectionPoints.length === 2) {
    // Check if the points are different (not the same point)
    const distance = intersectionPoints[0].distanceTo(intersectionPoints[1]);
    if (distance > epsilon) {
      return {
        hasIntersection: true,
        intersectionLine: {
          start: intersectionPoints[0],
          end: intersectionPoints[1]
        }
      };
    }
  }

  // Default case: no valid intersection
  return { hasIntersection: false };
};
