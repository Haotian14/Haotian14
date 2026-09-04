/*
  Draws the contribution calendar as an animated panel: a snake hunts the days
  you filled in — picking a nearby one, wandering over to it, eating it, then
  choosing again — and grows one segment longer as it feeds.

  The route is deliberately not a tidy sweep. Targets are drawn from the few
  nearest uneaten cells rather than always the closest, and each leg zig-zags
  between the two axes, so the walk reads as roaming rather than mowing a lawn.
  A seeded generator keeps it reproducible: the same calendar always yields the
  same route.

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
const MAX_LENGTH = 18;
const MAX_STEPS = 900;
const TARGET_SECONDS = 26;
const MIN_STEP_SECONDS = 0.028;
const MAX_STEP_SECONDS = 0.09;
/** How many of the nearest uneaten cells to choose a target from. */
const TARGET_CHOICES = 4;
/** Where the loop starts breathing out: the grid refills and the snake fades. */
const LOOP_FADE = 98.5;
/** Chance of holding the current heading for another cell. */
const AXIS_PERSISTENCE = 0.72;

const key = (column, row) => `${column}:${row}`;

/** Small deterministic PRNG (mulberry32) — same calendar, same wander. */
export function createRandom(seed) {
  let state = seed >>> 0;

  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function existingDays(weeks) {
  const days = [];

  weeks.forEach((column, columnIndex) => {
    column.forEach((level, rowIndex) => {
      if (level !== null && level !== undefined) {
        days.push({ column: columnIndex, row: rowIndex, level });
      }
    });
  });

  return days;
}

function pickTarget(head, remaining, random) {
  const nearest = [...remaining.values()]
    .map((cell) => ({
      cell,
      distance: Math.abs(cell.column - head.column) + Math.abs(cell.row - head.row),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, TARGET_CHOICES);

  return nearest[Math.floor(random() * nearest.length)].cell;
}

/**
 * Plans the head's route: a sequence of single-cell moves that visits the
 * contributed days. Returns the route, the step each day is eaten on, and the
 * days left over if the route hit its step budget.
 */
export function planRoute(weeks, { maxSteps = MAX_STEPS, seed } = {}) {
  const days = existingDays(weeks);

  if (days.length === 0) {
    throw new Error("The contribution calendar contained no days to walk");
  }

  const random = createRandom(seed ?? days.length * 2654435761);
  const remaining = new Map(
    days.filter((day) => day.level > 0).map((day) => [key(day.column, day.row), day]),
  );
  const filledCount = remaining.size;

  let head = days[Math.floor(random() * days.length)];
  const route = [{ column: head.column, row: head.row }];
  const eatenAt = new Map();
  let previousAxis = null;

  const swallow = (position, step) => {
    const cellKey = key(position.column, position.row);

    if (remaining.has(cellKey)) {
      remaining.delete(cellKey);
      eatenAt.set(cellKey, step);
    }
  };

  swallow(head, 0);

  while (remaining.size > 0 && route.length <= maxSteps) {
    const target = pickTarget(head, remaining, random);

    while (
      (head.column !== target.column || head.row !== target.row) &&
      route.length <= maxSteps
    ) {
      const dx = Math.sign(target.column - head.column);
      const dy = Math.sign(target.row - head.row);
      // Commit to a direction for a few cells at a time: alternating axes every
      // step would draw a staircase, which reads as a caterpillar rather than
      // as a snake. Straight runs with occasional turns look like roaming.
      let axis;

      if (dx === 0) {
        axis = "y";
      } else if (dy === 0) {
        axis = "x";
      } else if (previousAxis && random() < AXIS_PERSISTENCE) {
        axis = previousAxis;
      } else {
        axis = random() < 0.5 ? "x" : "y";
      }

      head =
        axis === "x"
          ? { column: head.column + dx, row: head.row }
          : { column: head.column, row: head.row + dy };
      previousAxis = axis;

      route.push({ column: head.column, row: head.row });
      swallow(head, route.length - 1);
    }
  }

  return { route, eatenAt, filledCount, uneaten: remaining.size };
}

/**
 * Works out how long the snake is at every point of the route: it starts as a
 * lone head and gains a segment as it eats. Growth is paced over the whole
 * lap — one segment per `stride` meals — so a busy year still grows visibly
 * from start to finish instead of hitting the cap in the first two seconds.
 */
export function planGrowth(eatenAt, { maxLength = MAX_LENGTH } = {}) {
  const meals = [...eatenAt.values()].sort((a, b) => a - b);
  const length = Math.min(maxLength, meals.length + 1);
  const stride = Math.max(1, Math.floor(meals.length / Math.max(length - 1, 1)));

  // Segment 0 is the head; segment k appears once the k-th meal is swallowed.
  const births = Array.from({ length }, (_, index) =>
    index === 0 ? 0 : meals[Math.min(index * stride - 1, meals.length - 1)],
  );

  return { length, births, mealCount: meals.length, stride };
}

function percent(value) {
  return `${(Math.round(value * 1000) / 1000).toFixed(3).replace(/\.?0+$/, "")}%`;
}

function cells(weeks, theme, eatenAt, steps) {
  const rects = [];
  const keyframes = [];

  for (const day of existingDays(weeks)) {
    const x = GRID_X + day.column * PITCH;
    const y = GRID_Y + day.row * PITCH;
    const fill = theme.contributions[day.level];
    const eatenStep = eatenAt.get(key(day.column, day.row));

    if (eatenStep === undefined) {
      rects.push(
        `    <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="4" fill="${fill}" />`,
      );
      continue;
    }

    const eaten = (eatenStep / steps) * 100;
    const swallowed = Math.min(eaten + 0.25, 100);
    const name = `e${day.column}_${day.row}`;
    // Fade the calendar back in over the last stretch of the loop, so the grid
    // refills rather than blinking the instant the animation restarts.
    const tail =
      swallowed < LOOP_FADE
        ? `${percent(swallowed)},${percent(LOOP_FADE)}{fill:${theme.contributions[0]}}100%{fill:${fill}}`
        : `${percent(swallowed)},100%{fill:${theme.contributions[0]}}`;

    keyframes.push(`@keyframes ${name}{0%,${percent(eaten)}{fill:${fill}}${tail}}`);
    rects.push(
      `    <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="4" fill="${fill}" style="animation-name:${name}" class="c" />`,
    );
  }

  return { rects: rects.join("\n"), keyframes: keyframes.join("\n    ") };
}

function translateTo(cell) {
  return `transform:translate(${GRID_X + cell.column * PITCH}px,${GRID_Y + cell.row * PITCH}px)`;
}

function walkKeyframes(route, steps) {
  const stops = route.map(
    (cell, index) => `${percent((index / steps) * 100)}{${translateTo(cell)}}`,
  );

  /*
    The route's last step lands just short of 100%. Without a stop *at* 100% the
    browser interpolates the final sliver of the loop back to the element's own
    transform — translate(0,0), the top-left corner of the panel — and every
    segment visibly flies off to it before the loop restarts. Holding the last
    cell through 100% keeps the snake where it stopped.
  */
  stops.push(`100%{${translateTo(route[route.length - 1])}}`);

  return `@keyframes walk{${stops.join("")}}`;
}

function snakeSegments(theme, { length, births }, steps, duration, stepSeconds) {
  const rects = [];
  const keyframes = [];

  for (let index = 0; index < length; index += 1) {
    // The segment trails the head by `index` steps, so its own timeline is
    // shifted by the same amount — the birth threshold shifts with it.
    const threshold = Math.max(0, ((births[index] - index) / steps) * 100);
    const name = `b${index}`;
    const fade = 1 - (index / Math.max(length, 2)) * 0.4;
    const delay = (index * stepSeconds).toFixed(3);

    const born = Math.min(threshold + 0.2, 100);
    // Fade out with the refilling grid so the jump back to the route's first
    // cell happens while the snake is invisible.
    const tail =
      born < LOOP_FADE
        ? `${percent(born)},${percent(LOOP_FADE)}{opacity:${fade.toFixed(2)}}100%{opacity:0}`
        : `${percent(born)},100%{opacity:${fade.toFixed(2)}}`;

    keyframes.push(`@keyframes ${name}{0%,${percent(threshold)}{opacity:0}${tail}}`);
    // Ink body on a clay grid, ringed in the panel ground so segments stay
    // legible where they overlap a busy week.
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
  seed,
} = {}) {
  const theme = resolveTheme(themeName);
  const { route, eatenAt } = planRoute(weeks, { seed });
  const steps = route.length;
  // Hold the loop near a fixed length however long the route turns out to be.
  const stepSeconds = Math.min(
    MAX_STEP_SECONDS,
    Math.max(MIN_STEP_SECONDS, TARGET_SECONDS / steps),
  );
  const duration = Number((steps * stepSeconds).toFixed(2));
  const growth = planGrowth(eatenAt, { maxLength });
  const grid = cells(weeks, theme, eatenAt, steps);
  const snake = snakeSegments(theme, growth, steps, duration, stepSeconds);
  const safeLogin = escapeXmlText(login);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="snake-title snake-desc">
  <title id="snake-title">${safeLogin}&apos;s contribution log</title>
  <desc id="snake-desc">An animated contribution graph for ${safeLogin}: a snake roams the calendar hunting the days with contributions, and grows one segment for every one it eats.</desc>
  <style>
    .mono{font-family:${FONT_MONO}}
    .c{animation-duration:${duration}s;animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both}
    .s{animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;opacity:0}
    ${walkKeyframes(route, steps)}
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

export const SNAKE_CONSTANTS = Object.freeze({ CELL, PITCH, ROWS, MAX_LENGTH, MAX_STEPS });
