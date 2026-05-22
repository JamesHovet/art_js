import {Rectangle} from "./rectangle";

export function combineBounds(Rectangle1: Rectangle, Rectangle2: Rectangle): Rectangle {
    let x = Math.min(Rectangle1.x, Rectangle2.x);
    let y = Math.min(Rectangle1.y, Rectangle2.y);
    let width = Math.max(Rectangle1.x + Rectangle1.width, Rectangle2.x + Rectangle2.width) - x;
    let height = Math.max(Rectangle1.y + Rectangle1.height, Rectangle2.y + Rectangle2.height) - y;
    return new Rectangle(x, y, width, height);
}
