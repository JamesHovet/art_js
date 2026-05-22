import {Bezier} from "bezier-js";
import {Segment} from "./segment";
import {Rectangle} from "./rectangle";
import {Matrix4, Vector3} from "threejs-math";

class BezierSegment implements Segment {
  underlying: Bezier;
  start: Vector3;
  end: Vector3;

  constructor(underlying: Bezier) {
    this.underlying = underlying;
    this.start = new Vector3(underlying.points[0].x,underlying.points[0].y);
    this.end = new Vector3(underlying.points[underlying.points.length - 1].x, underlying.points[underlying.points.length - 1].y);
  }

  getBounds(): Rectangle {
    let bbox = this.underlying.bbox();
    return new Rectangle(bbox.x.min, bbox.y.min, bbox.x.size, bbox.y.size);
  }
  bboxOverlap(shape: Rectangle): boolean {
    return this.getBounds().bboxOverlap(shape)
  }

  lineIntersections(p0: Vector3, p1: Vector3): Vector3[] {
    let lineIntersections = this.underlying.lineIntersects({p1: {x: p0.x, y: p0.y}, p2: {x: p1.x, y: p1.y}});
    let points = [];
    for (let t of lineIntersections) {
      let intersectionPoint = this.underlying.get(t);
      points.push(new Vector3(intersectionPoint.x, intersectionPoint.y));
    }
    return points;
  }

  transform(matrix: Matrix4): Segment {
    this.underlying = new Bezier(this.underlying.points.map(p => {
      let transformed = new Vector3(p.x, p.y).applyMatrix4(matrix);
      return {x: transformed.x, y: transformed.y};
    }));
    return this;
  }
}

export {BezierSegment}
