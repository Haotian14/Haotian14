/*
  Draws the contribution calendar as an animated panel: a snake walks the grid
  in a serpentine path, dims each cell it eats, and — unlike the stock
  generator — grows one segment longer for every contribution it swallows.

  The animation is pure CSS so it plays inside a README's <img>:
    · one shared `walk` keyframe track holds the whole route;
    · segment k replays it with a k-step delay, so the body trails the head;
    · segment k stays transparent until the head has eaten its k-th cell.
*/

import { FONT_MONO, escapeXmlText, resolveTheme } from "./palette.mjs";

const CELL = 16;
const GAP = 4;
const PITCH = CELL + GAP;
const ROWS = 7;
const GRID_X = 72;
const GRID_Y = 108;
const WIDTH = 1200;
const HEIGHT = 310;
const STEP_SECONDS = 0.06;
const MAX_LENGTH = 18;

/** Row-major boustrophedon: across the first row, back along the next, and so
    on — long horizontal runs read as a snake rather than as a moving bar. Each
    row is entered from whichever end is closest to the last cell of the row
    above, so the padded days at both ends of the year never open a gap. */
export function serpentinePath(weeks) {
  const path = [];
  let previous = null;

  for (let row = 0; row < ROWS; row += 1) {
    const columns = [...weeks.keys()].filter(
      (column) => weeks[column][row] !== null && weeks[column][row] !== undefined,
    );

    if (columns.length === 0) {
      continue;
    }

    const first = columns[0];
    const last = columns[columns.length - 1];
    const forward =
      previous === null ||
      Math.abs(first - previous.column) <= Math.abs(last - previous.column);

    for (const column of forward ? columns : [...columns].reverse()) {
      previous = { column, row, level: weeks[column][row] };
      path.push(previous);
    }
  }

  return path;
}

/**
 * Works out how long the snake is at every point of the walk: it starts as a
 * lone head and gains a segment as it eats. Growth is paced over the whole
 * lap — one segment per `stride` meals — so a busy year still grows visibly
 * from start to finish instead of hitting the cap in the first two seconds.
 */
export function planGrowth(path, { maxLength = MAX_LENGTH } = {}) {
  const feedSteps = path.flatMap((cell, index) => (cell.level > 0 ? [index] : []));
  const length = Math.min(maxLength, feedSteps.length + 1);
  const stride = Math.max(1, Math.floor(feedSteps.length / Math.max(length - 1, 1)));

  // Segment 0 is the head; segment k appears once the k-th meal is swallowed.
  const births = Array.from({ length }, (_, index) =>
    index === 0
      ? 0
      : feedSteps[Math.min(index * stride - 1, feedSteps.length - 1)],
  );

  return { length, births, feedCount: feedSteps.length, stride };
}

function percent(value) {
  return `${(Math.round(value * 1000) / 1000).toFixed(3).replace(/\.?0+$/, "")}%`;
}

function cells(path, theme, steps) {
  const rects = [];
  const keyframes = [];

  path.forEach((cell, index) => {
    const x = GRID_X + cell.column * PITCH;
    const y = GRID_Y + cell.row * PITCH;
    const fill = theme.contributions[cell.level];

    if (cell.level === 0) {
      rects.push(
        `    <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="4" fill="${fill}" />`,
      );
      return;
    }

    const eaten = (index / steps) * 100;
    const name = `e${index}`;

    keyframes.push(
      `@keyframes ${name}{0%,${percent(eaten)}{fill:${fill}}${percent(Math.min(eaten + 0.25, 100))},100%{fill:${theme.contributions[0]}}}`,
    );
    rects.push(
      `    <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="4" fill="${fill}" style="animation-name:${name}" class="c" />`,
    );
  });

  return { rects: rects.join("\n"), keyframes: keyframes.join("\n    ") };
}

function walkKeyframes(path, steps) {
  const stops = path.map((cell, index) => {
    const x = GRID_X + cell.column * PITCH;
    const y = GRID_Y + cell.row * PITCH;

    return `${percent((index / steps) * 100)}{transform:translate(${x}px,${y}px)}`;
  });

  return `@keyframes walk{${stops.join("")}}`;
}

function snakeSegments(path, theme, { length, births }, steps, duration) {
  const rects = [];
  const keyframes = [];

  for (let index = 0; index < length; index += 1) {
    // The segment trails the head by `index` steps, so its own timeline is
    // shifted by the same amount — the birth threshold shifts with it.
    const threshold = Math.max(0, ((births[index] - index) / steps) * 100);
    const name = `b${index}`;
    const fade = 1 - (index / Math.max(length, 2)) * 0.4;

    keyframes.push(
      `@keyframes ${name}{0%,${percent(threshold)}{opacity:0}${percent(Math.min(threshold + 0.2, 100))},100%{opacity:${fade.toFixed(2)}}}`,
    );
    // Ink body on a clay grid, ringed in the panel ground so segments stay
    // legible where they overlap a busy week.
    const delay = (index * STEP_SECONDS).toFixed(2);

    rects.push(
      `    <rect width="${CELL}" height="${CELL}" rx="${index === 0 ? 7 : 5}" fill="${theme.ink}" stroke="${theme.bg}" stroke-width="2.5" class="s" style="animation-name:walk,${name};animation-delay:${delay}s,${delay}s;animation-duration:${duration}s,${duration}s" />`,
    );
  }

  return { rects: rects.join("\n"), keyframes: keyframes.join("\n    ") };
}

function legend(theme, total) {
  const swatches = theme.contributions
    .map(
      (color, index) =>
        `<rect x="${48 + index * 24}" width="14" height="14" rx="3" fill="${color}"${index === 0 ? ` stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}"` : ""} />`,
    )
    .join("");

  return `  <g class="mono" transform="translate(${GRID_X} 266)">
    <text y="11" fill="${theme.muted}" font-size="9.5" letter-spacing="1.2">LESS</text>
    ${swatches}
    <text x="${48 + theme.contributions.length * 24}" y="11" fill="${theme.muted}" font-size="9.5" letter-spacing="1.2">MORE</text>
  </g>
  <text x="${WIDTH - GRID_X}" y="277" text-anchor="end" class="mono" font-size="10.5" letter-spacing="1.3" fill="${theme.muted}">${escapeXmlText(total)} CONTRIBUTIONS / LAST 12 MONTHS</text>`;
}

export function renderContributionSnake({
  weeks,
  total = 0,
  login = "Haotian14",
  themeName = "dark",
  maxLength = MAX_LENGTH,
} = {}) {
  const theme = resolveTheme(themeName);
  const path = serpentinePath(weeks);

  if (path.length === 0) {
    throw new Error("The contribution calendar contained no days to walk");
  }

  const steps = path.length;
  const duration = Number((steps * STEP_SECONDS).toFixed(2));
  const growth = planGrowth(path, { maxLength });
  const grid = cells(path, theme, steps);
  const snake = snakeSegments(path, theme, growth, steps, duration);
  const safeLogin = escapeXmlText(login);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="snake-title snake-desc">
  <title id="snake-title">${safeLogin}&apos;s contribution log</title>
  <desc id="snake-desc">An animated contribution graph for ${safeLogin}: a snake walks the calendar and grows one segment for every contribution it eats.</desc>
  <style>
    .mono{font-family:${FONT_MONO}}
    .c{animation-duration:${duration}s;animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both}
    .s{animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;opacity:0}
    ${walkKeyframes(path, steps)}
    ${grid.keyframes}
    ${snake.keyframes}
    @media (prefers-reduced-motion: reduce){.c,.s{animation:none}.s{opacity:0}}
  </style>

  <rect width="${WIDTH}" height="${HEIGHT}" rx="18" fill="${theme.bg}" />
  <rect x="0.75" y="0.75" width="${WIDTH - 1.5}" height="${HEIGHT - 1.5}" rx="17.25" fill="none" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />

  <text x="${GRID_X}" y="60" class="mono" font-size="11.5" letter-spacing="2.4" fill="${theme.accent}">05 — CONTRIBUTION LOG</text>
  <text x="${WIDTH - GRID_X}" y="60" text-anchor="end" class="mono" font-size="11" letter-spacing="1.4" fill="${theme.muted}">EATS A CELL, GROWS A SEGMENT</text>
  <line x1="${GRID_X}" y1="78" x2="${WIDTH - GRID_X}" y2="78" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />

  <g>
${grid.rects}
  </g>
  <g>
${snake.rects}
  </g>

${legend(theme, total.toLocaleString("en-US"))}
</svg>
`;
}

export const SNAKE_CONSTANTS = Object.freeze({ CELL, PITCH, ROWS, STEP_SECONDS, MAX_LENGTH });
