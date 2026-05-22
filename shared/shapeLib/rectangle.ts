import {Shape} from "./shape";
import {Vector3} from "threejs-math";

class Rectangle implements Shape {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getBounds(): Rectangle {
      return this;
    }

    contains(point: Vector3): boolean {
        return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height;
    }

    bboxOverlap(shape: Rectangle): boolean {
        return this.x < shape.x + shape.width && this.x + this.width > shape.x && this.y < shape.y + shape.height && this.y + this.height > shape.y;
    }
}

export {Rectangle};
