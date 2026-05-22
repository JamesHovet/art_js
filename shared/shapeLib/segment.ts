import {Rectangle} from "./rectangle";
import {Matrix4, Vector3} from "threejs-math";

interface Segment {
  start: Vector3;
  end: Vector3;
  getBounds(): Rectangle;
  bboxOverlap(shape: Rectangle): boolean;
  lineIntersections(p0: Vector3, p1: Vector3): Vector3[];
  transform(matrix: Matrix4): Segment;
}

export {Segment};
