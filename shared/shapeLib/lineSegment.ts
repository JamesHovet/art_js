import { Rectangle } from "./rectangle";
import {Segment} from "./segment";
import {Matrix4, Vector3} from "threejs-math";

class LineSegment implements Segment {
    start: Vector3;
    end: Vector3;

    constructor(p0: Vector3, p1: Vector3) {
        this.start = p0;
        this.end = p1;
    }

    getBounds(): Rectangle {
        return new Rectangle(Math.min(this.start.x, this.end.x),
                              Math.min(this.start.y, this.end.y),
                              Math.abs(this.end.x - this.start.x),
                              Math.abs(this.end.y - this.start.y));
    }
    bboxOverlap(shape: Rectangle): boolean {
        return this.getBounds().bboxOverlap(shape);
    }

    lineIntersections(p0: Vector3, p1: Vector3): Vector3[] {
        let a = this.start;
        let b = this.end;
        let c = p0;
        let d = p1;

        let denominator = ((b.x - a.x) * (d.y - c.y)) - ((b.y - a.y) * (d.x - c.x));
        if (denominator === 0) {
            return [];
        }

        let t = ((a.y - c.y) * (d.x - c.x) - (a.x - c.x) * (d.y - c.y)) / denominator;
        let u = ((a.y - c.y) * (b.x - a.x) - (a.x - c.x) * (b.y - a.y)) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return [new Vector3(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y))];
        }
        return [];
    }

    transform(matrix: Matrix4): Segment {
        this.start.applyMatrix4(matrix);
        this.end.applyMatrix4(matrix);
        return this;
    }

    getCenter(): Vector3 {
        return new Vector3((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);
    }

    getNormal(): Vector3 {
        let dx = this.end.x - this.start.x;
        let dy = this.end.y - this.start.y;
        let length = Math.sqrt(dx * dx + dy * dy);
        return new Vector3(-dy / length, dx / length);
    }

    getLength(): number {
        return Math.sqrt(Math.pow(this.end.x - this.start.x, 2) + Math.pow(this.end.y - this.start.y, 2));
    }
}

export {LineSegment};
