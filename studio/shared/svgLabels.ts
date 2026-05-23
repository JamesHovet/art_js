import { getLetterOffset, getLetterSVGPath } from '../../shared/letterSvgPaths';

export function buildTextGroup(
  svg: SVGElement,
  text: string,
  x: number,
  y: number,
  scale = 0.2,
  rightAlign = false
): void {
  const numChars = text.toUpperCase().split('').filter(c => c !== ' ').length;
  const adjustedX = rightAlign ? x - numChars * 90 * scale : x;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${adjustedX}, ${y}) scale(${scale})`);
  const spacing = 90;
  text.toUpperCase().split('').forEach((ch, i) => {
    if (ch === ' ') return;
    const path = getLetterSVGPath(ch);
    if (!path) return;
    const offset = getLetterOffset(ch);
    const sg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sg.setAttribute('transform', `translate(${i * spacing - offset.x}, ${-offset.y})`);
    sg.setAttribute('fill', 'none');
    sg.setAttribute('stroke', 'black');
    sg.setAttribute('stroke-width', '3');
    sg.innerHTML = path;
    g.appendChild(sg);
  });
  svg.appendChild(g);
}
