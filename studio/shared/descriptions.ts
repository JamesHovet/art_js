export const TREE_DESCRIPTION = [
  `Every year a tree grows a new "ring". On warmer and wetter years, the tree grows quickly and the rings are wide. On colder and drier years, the tree has less energy to put into growth and the rings are smaller.`,
  `Trees live in one place, but if you're anything like me, you've moved around and faced some warmer years and some colder ones. The tree of my life started in Boston, spent some warm years in New Orleans, and then froze its butt off in rural Massachusetts and off Lake Michigan before finding its way to New York.`,
  `This piece asks you to list where you lived for each year of your life. Based on the historical weather data for that place and in that year, it will draw you a tree of your own life, which you can customize before printing.`,
];

export const LETTERS_DESCRIPTION = [
  `It is one of the wonders of the universe how simple rules can create complex outcomes. The rules of this piece are simple. Pick a point within the confines of a letter. Draw a short line. Choose a slightly different direction, draw another line. If that line would break out of the confines of the letter, pick a different direction instead. Repeat.`,
  `Increase the length of the line, and you get a sinewy vine-like structure. Shrink the line and increase the range of directions that can be chosen, and you get a dense maze of wrong turns and loops. Draw more lines and you are more likely to find the edges and fill the space.`,
  `Three simple rules, three simple parameters, widely varied results.`,
];

export const SPIRAL_DESCRIPTION = [
  `On a mathematical level, this is another piece that takes a simple rule and explores the complex and varied results. Only six parameters and a few equations create a broad range of visual results.`,
  `But on an ideas level, this piece came to me at a time when I was struggling to discover how I felt about a big decision. I knew that somewhere deep inside my brain I already knew the answer, but actually finding the simple answer within the distorted landscape of my mind felt almost impossible. The fundamental choice, the clear structure of the spiral itself, was always there, but the challenge comes in seeing it through all the waves that warp it.`,
];

export function renderDescription(paragraphs: string[], container: Element, className = ''): void {
  paragraphs.forEach((text, i) => {
    const p = document.createElement('p');
    if (className) {
      p.className = className;
    } else {
      const isLast = i === paragraphs.length - 1;
      p.style.cssText = `font-size:13px;line-height:1.6;color:#555;margin:0 0 ${isLast ? '20px' : '8px'};`;
    }
    p.textContent = text;
    container.appendChild(p);
  });
}
