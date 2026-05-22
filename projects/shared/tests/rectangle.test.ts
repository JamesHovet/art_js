import {Rectangle} from '../../../shared/shapeLib/rectangle'
import {Vector3} from "threejs-math";

describe('Rectangle', () => {
  test('contains', () => {
    const rect = new Rectangle(0, 0, 10, 10)
    expect(rect.contains(new Vector3(5, 5))).toBe(true)
    expect(rect.contains(new Vector3(15, 5))).toBe(false)
    expect(rect.contains(new Vector3(5, 15))).toBe(false)
    expect(rect.contains(new Vector3(15, 15))).toBe(false)
  });

  test('bboxOverlap', () => {
    const rect = new Rectangle(0, 0, 10, 10)
    expect(rect.bboxOverlap(new Rectangle(5, 5, 10, 10))).toBe(true)
    expect(rect.bboxOverlap(new Rectangle(15, 5, 10, 10))).toBe(false)
    expect(rect.bboxOverlap(new Rectangle(5, 15, 10, 10))).toBe(false)
    expect(rect.bboxOverlap(new Rectangle(15, 15, 10, 10))).toBe(false)
  });
});
