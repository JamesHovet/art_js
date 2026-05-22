import {parseSVG, makeAbsolute, CommandMadeAbsolute, QuadraticCurveToCommandMadeAbsolute} from "svg-path-parser";
import {Path, Ring} from "./path";
import {Vector3} from "threejs-math";
import {LineSegment} from "./lineSegment";
import {BezierSegment} from "./bezierSegment";
import {Bezier} from "bezier-js";



export function importSvgPath(svgPath: string) : Path {
  let svg : CommandMadeAbsolute[] = makeAbsolute(parseSVG(svgPath));

  let rings = [];
  let currentSegments = [];

  for (let command of svg) {
    if (command.code === "M") {
      if (currentSegments.length > 0) {
        let ring = new Ring(currentSegments);
        rings.push(ring);
        currentSegments = [];
      }
    } else if (command.code === "L" || command.code === "V" || command.code === "H") {
      let start = new Vector3(command.x0, command.y0)
      let end = new Vector3(command.x, command.y);
      currentSegments.push(new LineSegment(start, end));
    } else if (command.code === "C") {
      let start = new Vector3(command.x0, command.y0);
      let control1 = new Vector3(command.x1, command.y1);
      let control2 = new Vector3(command.x2, command.y2);
      let end = new Vector3(command.x, command.y);
      currentSegments.push(new BezierSegment(new Bezier(start, control1, control2, end)));
    } else if (command.code === "S") {
      let start = new Vector3(command.x0, command.y0);
      // control 1 is the reflection of control 2 from the previous command
      let control1 : Vector3;
      let previousCommand = svg[svg.indexOf(command) - 1];
      if (previousCommand.code === "C" || previousCommand.code === "S") {
        let previousControl2 = new Vector3(previousCommand.x2, previousCommand.y2);
        control1 = new Vector3(2 * start.x - previousControl2.x, 2 * start.y - previousControl2.y);
      } else {
        control1 = new Vector3(start.x, start.y);
      }
      let control2 = new Vector3(command.x2, command.y2);
      let end = new Vector3(command.x, command.y);
      currentSegments.push(new BezierSegment(new Bezier(start, control1, control2, end)));
    } else if (command.code === "Q") {
      let start = new Vector3(command.x0, command.y0);
      let control = new Vector3(command.x1, command.y1);
      let end = new Vector3(command.x, command.y);
      currentSegments.push(new BezierSegment(new Bezier(start, control, end)));
    } else if (command.code === "T") {
      let start = new Vector3(command.x0, command.y0);
      // control is the reflection of the previous control from the previous command
      let control : Vector3;
      let previousCommand = svg[svg.indexOf(command) - 1];
      if (previousCommand.code === "Q" || previousCommand.code === "T") {
        // @ts-ignore
        let previousControl = new Vector3(previousCommand.x1, previousCommand.y1);
        control = new Vector3(2 * start.x - previousControl.x, 2 * start.y - previousControl.y);
      } else {
        control = new Vector3(start.x, start.y);
      }
      let end = new Vector3(command.x, command.y);
      currentSegments.push(new BezierSegment(new Bezier(start, control, end)));
    } else if (command.code === "Z") {
      let endingOfLast = currentSegments[currentSegments.length - 1].end;
      let startOfFirst = currentSegments[0].start;
      if (!endingOfLast.equals(startOfFirst)) {
        currentSegments.push(new LineSegment(endingOfLast, startOfFirst));
      }
      let ring = new Ring(currentSegments);
      rings.push(ring);
      currentSegments = [];
    } else {
      console.log("Unknown command: " + command.code);
    }
  }

  if (currentSegments.length > 0) {
    let ring = new Ring(currentSegments);
    rings.push(ring);
  }

  let path = new Path(rings);
  return path;
}
