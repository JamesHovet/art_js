import * as p5 from 'p5';
import {Rectangle} from "./shapeLib/rectangle";
import {LineSegment} from "./shapeLib/lineSegment";
import {BezierSegment} from "./shapeLib/bezierSegment";
import {Path} from "./shapeLib/path";
import {Vector3} from "threejs-math";

export function drawRectangle(p: p5, rect: Rectangle) {
  p.rect(rect.x, rect.y, rect.width, rect.height);
}

export function drawPoint(p: p5, point: Vector3) {
  p.point(point.x, point.y);
}

export function drawCircle(p: p5, point: Vector3, radius: number) {
  p.circle(point.x, point.y, radius);
}

export function drawLine(p: p5, line: LineSegment) {
  p.line(line.start.x, line.start.y, line.end.x, line.end.y);
}

export function drawBezier(p, bezierSegment: BezierSegment) {
  let curve = bezierSegment.underlying;
  if (curve.points.length === 3) {
    p.beginShape();
    p.vertex(curve.points[0].x, curve.points[0].y);
    p.quadraticVertex(curve.points[1].x, curve.points[1].y, curve.points[2].x, curve.points[2].y);
    p.endShape();
  }
  if (curve.points.length === 4) {
    p.beginShape();
    p.vertex(curve.points[0].x, curve.points[0].y);
    p.quadraticVertex(curve.points[1].x, curve.points[1].y, curve.points[2].x, curve.points[2].y, curve.points[3].x, curve.points[3].y);
    p.endShape();
  }
}


// TODO: Change draw path to properly handle sequential curves and not insert unneeded moveto commands. Basically we want a single shape not individual shapes for each segment.

export function drawPath(p: p5, path: Path) {
  let isInner = false;
  p.beginShape();
  let lastPointDrawn : Vector3 | null = new Vector3(0, 0, 1000);
  path.rings.forEach(ring => {
    if (isInner) {
      p.beginContour();
    }
    ring.segments.forEach(segment => {
      if (segment instanceof LineSegment) {
        if (!lastPointDrawn.equals(segment.start)) {
          p.vertex(segment.start.x, segment.start.y);
        }
        p.vertex(segment.end.x, segment.end.y);
      } else if (segment instanceof BezierSegment) {
        if (segment.underlying.points.length === 3) {
          if (!lastPointDrawn.equals(segment.start)) {
            p.vertex(segment.underlying.points[0].x, segment.underlying.points[0].y);
          }
          p.quadraticVertex(segment.underlying.points[1].x, segment.underlying.points[1].y, segment.underlying.points[2].x, segment.underlying.points[2].y);
        } else if (segment.underlying.points.length === 4) {
          if (!lastPointDrawn.equals(segment.start)) {
            p.vertex(segment.underlying.points[0].x, segment.underlying.points[0].y);
          }
          p.bezierVertex(segment.underlying.points[1].x, segment.underlying.points[1].y, segment.underlying.points[2].x, segment.underlying.points[2].y, segment.underlying.points[3].x, segment.underlying.points[3].y);
        }
      }
      lastPointDrawn = segment.end;
    });
    if (isInner) {
      p.endContour();
    }
    isInner = true;
  });
  p.endShape();
}

