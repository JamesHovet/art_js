import {Rectangle} from "./rectangle";
import {Vector3} from "threejs-math"

interface Shape {
  getBounds(): Rectangle;
  contains(point: Vector3): boolean;
  bboxOverlap(shape: Rectangle): boolean;
}

export {Shape};
