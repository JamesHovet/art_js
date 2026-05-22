import { Rectangle } from "./rectangle";
import {Shape} from "./shape";
import {Matrix4, Vector3} from "threejs-math";
import {Segment} from "./segment";
import {combineBounds} from "./shapeUtils";

class Path implements Shape {
  rings: Ring[];

  cachedBounds: Rectangle;

  constructor(rings: Ring[]) {
    this.rings = rings;
  }

    getBounds(): Rectangle {
        if (this.cachedBounds) {
            return this.cachedBounds;
        }
        if (this.rings.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }

        let combinedBounds = this.rings[0].getBounds();
        for (let i = 1; i < this.rings.length; i++) {
            combinedBounds = combineBounds(combinedBounds, this.rings[i].getBounds());
        }
        this.cachedBounds = combinedBounds;
        return this.cachedBounds;
    }

    contains(point: Vector3): boolean {
      if (!this.getBounds().contains(point)) {
        return false;
      }

      let inside = false;
      for (let ring of this.rings) {
        for (let segment of ring.segments) {
          if (segment.lineIntersections(point, new Vector3(this.getBounds().x + this.getBounds().width, point.y)).length % 2 === 1) {
            inside = !inside;
          }
        }
      }
      return inside;
    }

    lineIntersections(p0: Vector3, p1: Vector3): Vector3[] {
        let intersections = [];
        for (let ring of this.rings) {
            for (let segment of ring.segments) {
                intersections = intersections.concat(segment.lineIntersections(p0, p1));
            }
        }
        return intersections;
    }

    bboxOverlap(shape: Rectangle): boolean {
        return this.getBounds().bboxOverlap(shape);
    }

    transform(matrix: Matrix4) {
        for (let ring of this.rings) {
            for (let segment of ring.segments) {
                segment.transform(matrix);
            }
        }
        this.cachedBounds = null;
    }
}

class Ring {
  segments: Segment[];
  isInterior: boolean;

  constructor(segments: Segment[]) {
    this.segments = segments;

    this.validateContiguousAndWindingOrder();
  }

  validateContiguousAndWindingOrder() {
    let edgeSum = 0;
    for (let i = 0; i < this.segments.length - 1; i++) {
      if (!this.segments[i].end.equals(this.segments[i + 1].start)) {
        console.log(this.segments[i].end, this.segments[i + 1].start)
        // throw new Error("Segments are not contiguous");
      }

      let start = this.segments[i].start;
      let end = this.segments[i].end;
      edgeSum += (end.x - start.x) * (end.y + start.y);
    }

    let start = this.segments[this.segments.length - 1].start;
    let end = this.segments[this.segments.length - 1].end;
    edgeSum += (end.x - start.x) * (end.y + start.y);

    if (edgeSum > 0) {
      this.isInterior = true;
    }
  }

  getBounds() : Rectangle {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    for (let segment of this.segments) {
      let bounds = segment.getBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    return new Rectangle(minX, minY, maxX - minX, maxY - minY);
  }
}

export {Path, Ring}
