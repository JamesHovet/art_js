# Studio Plotter System — Design Spec
Date: 2026-05-21

## Overview

A new `studio/` folder alongside `projects/` introduces a mobile-collect / desktop-render
workflow for three generative art projects (Spiral, Letters, Tree). Users generate params
on their phone, data is saved to a Google Sheet, then loaded on a desktop browser for
final SVG export and pen plotting.

Existing projects in `projects/` are not modified.

---

## Folder Structure

```
studio/
  landing/
    landing.ts
    landing.html
  shared/
    sheets.ts          # Google Sheets save/load API
    seededRandom.ts    # Seeded PRNG utilities
  spiral/
    drawing.ts         # Shared art code (collect + render both import this)
    collect.ts / collect.html
    render.ts  / render.html
  letters/
    drawing.ts
    collect.ts / collect.html
    render.ts  / render.html
  tree/
    drawing.ts
    collect.ts / collect.html
    render.ts  / render.html
```

---

## Webpack

Seven new entries added to `webpack.common.js`:

```js
studio_landing:          './studio/landing/landing.ts'
studio_spiral_collect:   './studio/spiral/collect.ts'
studio_spiral_render:    './studio/spiral/render.ts'
studio_letters_collect:  './studio/letters/collect.ts'
studio_letters_render:   './studio/letters/render.ts'
studio_tree_collect:     './studio/tree/collect.ts'
studio_tree_render:      './studio/tree/render.ts'
```

Served at `/studio_landing/`, `/studio_spiral_collect/`, etc.

---

## Shared Modules

### studio/shared/seededRandom.ts

```ts
export function makeRng(seed: number): () => number     // mulberry32
export function gaussianRandom(rng: () => number, mean?: number, std?: number): number  // Box-Muller
export function randInt(rng: () => number, min: number, max: number): number
```

Used by letters (random walk) and tree (Gaussian generation). Spiral has no randomness.

### studio/shared/sheets.ts

```ts
// Reuse URL already in projects/tree_timeline/tree_timeline.ts line 46.
// Move here as single source of truth; remove from tree_timeline.ts if desired later.
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycb...'

export async function saveEntry(
  tab: 'Spiral' | 'Letters' | 'Tree',
  name: string,
  data: unknown
): Promise<void>   // POST with no-cors (mode: 'no-cors')

export async function loadEntries(
  tab: 'Spiral' | 'Letters' | 'Tree'
): Promise<SheetEntry[]>   // GET ?sheet=<tab>

interface SheetEntry {
  rowIndex: number
  name: string
  timestamp: string
  data: string   // JSON.stringify'd payload
}
```

---

## Google Apps Script (projects/tree_timeline/appscript_old_backup.js)

Updated to support a `sheet` parameter so all projects share one spreadsheet with separate tabs.

- **doPost**: reads `data.sheet` (default `'Sheet1'`); auto-creates tab if missing
- **doGet**: reads `e.parameter.sheet` (default `'Sheet1'`)
- Backwards compatible — existing tree data on `Sheet1` is unaffected

---

## Drawing Module Contract

All three `drawing.ts` modules export the same interface:

```ts
export const PARAM_CONFIG: Record<string, { default, min, max, step }>
export function draw(ctx: CanvasRenderingContext2D, params: Params): void
export function buildSVGPath(params: Params): string
```

Canvas size: 576×576 throughout. Border rect: `(25, 25, 526, 476)`.

---

## Per-Project: Spiral

**drawing.ts** — direct port from `projects/spiral/spiral.ts`:
- Params: `param1`–`param6` (same ranges as existing)
- No randomness; fully deterministic from the six params
- `transformPoint`, `drawSpiral`, `buildSpiralSVGPath` extracted as pure functions

**collect page (mobile)**
- Six sliders (param1–6) with live preview
- "Randomize" button
- Name text input + Submit → `saveEntry('Spiral', name, { param1, ..., param6 })`

**render page (desktop)**
- Load button → `loadEntries('Spiral')` → scrollable list (name + timestamp)
- Click entry → populate sliders + redraw canvas
- All six sliders remain editable for fine-tuning
- Export SVG button → download `spiral-<name>.svg`

**SVG export**: border rect + spiral path + name (bottom-left) + timestamp date (bottom-right), using `getLetterSVGPath` from `shared/letterSvgPaths.ts`.

---

## Per-Project: Letters

**drawing.ts** — rewrite without p5; plain Canvas 2D + seeded PRNG:
- Params: `letter` (A–Z, default 'A'), `numLines`, `lineLength`, `gaussianStdDev`, `seed`
- Pixel sampling: render letter to a hidden canvas using `Times New Roman` at fontSize 550, check brightness to determine inside/outside shape
- Random walk: `makeRng(seed)` drives all randomness (start point, initial direction, Gaussian direction changes)
- `draw(ctx, params)`: draws border rect + full walk path
- `buildSVGPath(params)`: re-runs walk, returns SVG path string

Note on cross-device consistency: font rendering at this scale is expected to be consistent enough for v1. Revisit if mobile preview vs desktop render diverge meaningfully.

**collect page (mobile)**
- Row of A–Z letter buttons to pick the current letter
- Sliders: numLines, lineLength, gaussianStdDev
- Seed display + "New Seed" button (randomizes seed integer, redraws)
- Name input + Submit → `saveEntry('Letters', name, { letter, numLines, lineLength, gaussianStdDev, seed })`

**render page (desktop)**
- Load button → `loadEntries('Letters')` → list
- Click entry → populate controls + redraw
- All controls editable
- Export SVG button

---

## Per-Project: Tree

**drawing.ts** — refactored from `projects/tree/tree.ts`:
- Params: all ~30 existing sliders + `noiseSeed` (was `seed`) + `gaussianSeed` (new)
- `generateGaussians(gaussianSeed, genParams)`: uses `makeRng(gaussianSeed)` instead of `Math.random()` — fully reproducible
- `generateCirclePoints(params, weatherData?)`: returns `allCirclesRadii`
- `draw(ctx, params, weatherData?)`: canvas draw
- `buildSVGPath(params, weatherData?)`: SVG path
- No debug view, no favorability graph

Saved data structure:
```json
{
  "params": { "scale": 230, "noiseSeed": 482913, "gaussianSeed": 77201, ... },
  "weatherData": [ { "year": 1990, "temperature_2m_mean": 12.3, ... }, ... ]
}
```

**collect page (mobile) — two phases:**

Phase 1 — Life history (from tree_timeline):
- Name, birth year, birth location search
- Year-by-year location table with inline editing
- "Generate My Tree" button → fetches weather data for all years

Phase 2 — Tree preview + params (shown after weather fetch completes):
- All ~30 param sliders with live canvas preview
- noiseSeed slider + "Randomize Noise" button
- "Regenerate Gaussians" button (picks new `gaussianSeed`, redraws) — no Gaussian params exposed
- Submit → `saveEntry('Tree', name, { params, weatherData })`

**render page (desktop)**
- Load button → `loadEntries('Tree')` → list
- Click entry → load params + weatherData → redraw
- All sliders editable (noiseSeed, "Regenerate Gaussians" button)
- Export SVG button → `buildSVGPath(params, weatherData)` + text labels

---

## UX Split: Mobile vs Desktop

**Mobile (collect pages)** — clean, user-friendly:
- Large touch targets, simple layout
- No raw data or technical details exposed
- Submission confirmation is a friendly success message

**Desktop (render pages)** — functional, technical:
- Entry picker shows full ISO timestamp alongside name (e.g. `James — 2026-05-21T14:32:00.000Z`)
  so multiple entries by the same person are distinguishable
- Raw params visible in sliders; guts exposed is fine

---

## Landing Page

`studio/landing/` — simple page at `/studio_landing/`:
- Title and brief description
- Three project sections (Spiral, Letters, Tree)
- Each has two links: "Collect (mobile)" and "Render (desktop)"

---

## SVG Export (all projects)

Follows existing project pattern:
- New `<svg>` element, width/height 576
- Border rect `(25, 25, 526, 476)`
- Art path(s) from `buildSVGPath(params)`
- Bottom-left label: user's name (from saved entry), uppercased; unsupported chars skipped
- Bottom-right label: date string (e.g. "2026"), digits only
- Both labels use `getLetterSVGPath` / `getLetterOffset` from existing `shared/letterSvgPaths.ts` which covers A–Z and 0–9
- Download as `<projectname>-<name>.svg`

---

## What Is NOT in v1

- AxiDraw direct connection (render pages have Export SVG only)
- Auth / user accounts
- Deleting or editing saved entries
- The tree debug view or favorability graph
- Individual Gaussian card editing (just "Regenerate Gaussians" button)
- Replacing existing projects in `projects/`
