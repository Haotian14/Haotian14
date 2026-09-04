import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { normaliseCalendar } from "../scripts/contributions.mjs";
import { planGrowth, planRoute, renderContributionSnake } from "../scripts/snake.mjs";

const calendar = JSON.parse(
  readFileSync(new URL("./fixtures/calendar-sample.json", import.meta.url), "utf8"),
);

test("never jumps: every step moves exactly one cell", () => {
  const { route } = planRoute(calendar.weeks);

  for (let index = 1; index < route.length; index += 1) {
    const distance =
      Math.abs(route[index].column - route[index - 1].column) +
      Math.abs(route[index].row - route[index - 1].row);

    assert.equal(distance, 1, `step ${index} moved ${distance} cells`);
  }
});

test("stays on the calendar", () => {
  const { route } = planRoute(calendar.weeks);

  for (const cell of route) {
    assert.ok(cell.column >= 0 && cell.column < calendar.weeks.length, "column in range");
    assert.ok(cell.row >= 0 && cell.row < 7, "row in range");
  }
});

test("hunts the contributed days rather than sweeping the grid", () => {
  const { route, eatenAt, filledCount, uneaten } = planRoute(calendar.weeks);

  assert.equal(uneaten, 0, "every contribution should be eaten");
  assert.equal(eatenAt.size, filledCount);

  // A tidy row-by-row sweep would visit all 366 days in order. Roaming costs
  // extra steps crossing empty weeks, and never walks the whole grid in rows.
  assert.ok(route.length > filledCount, "roaming takes more steps than there are meals");

  const turns = route.filter((cell, index) => {
    if (index < 2) return false;
    const before = route[index - 2];
    const middle = route[index - 1];
    return (
      (cell.column - middle.column !== middle.column - before.column) ||
      (cell.row - middle.row !== middle.row - before.row)
    );
  });

  assert.ok(turns.length > 40, `expected a wandering route, saw ${turns.length} turns`);
});

test("is reproducible: same calendar and seed, same route", () => {
  const first = planRoute(calendar.weeks, { seed: 7 });
  const second = planRoute(calendar.weeks, { seed: 7 });
  const other = planRoute(calendar.weeks, { seed: 8 });

  assert.deepEqual(first.route, second.route);
  assert.notDeepEqual(first.route, other.route);
});

test("stops at its step budget instead of running forever", () => {
  const { route, uneaten } = planRoute(calendar.weeks, { maxSteps: 60 });

  assert.ok(route.length <= 62, `route ran to ${route.length} steps`);
  assert.ok(uneaten > 0, "a clipped route leaves cells behind");
});

test("grows one segment per meal, in the order they are eaten", () => {
  const { eatenAt } = planRoute(calendar.weeks);
  const { length, births, stride } = planGrowth(eatenAt, { maxLength: 18 });

  assert.equal(length, 18);
  assert.equal(births[0], 0);
  assert.ok(stride >= 1);

  for (let index = 1; index < births.length; index += 1) {
    assert.ok(births[index] > births[index - 1], "segments must appear in order");
  }
});

test("never grows past the number of cells there are to eat", () => {
  const sparse = [
    [0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 0, 0],
  ];
  const { eatenAt } = planRoute(sparse, { seed: 1 });
  const { length, mealCount } = planGrowth(eatenAt, { maxLength: 18 });

  assert.equal(mealCount, 2);
  assert.equal(length, 3);
});

test("renders an animated panel in both themes", () => {
  for (const themeName of ["light", "dark"]) {
    const svg = renderContributionSnake({ ...calendar, themeName, seed: 3 });

    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /<\/svg>\s*$/);
    assert.match(svg, /@keyframes walk\{/);
    assert.match(svg, /1,302 CONTRIBUTIONS/);
    assert.equal(svg.match(/class="s"/g).length, 18);
    assert.match(svg, /@media \(prefers-reduced-motion: reduce\)/);
    assert.doesNotMatch(svg, /undefined|NaN/);
  }
});

test("refuses to render an empty calendar", () => {
  assert.throws(
    () => renderContributionSnake({ weeks: [[null, null, null, null, null, null, null]] }),
    /no days to walk/,
  );
});

test("normalises the GraphQL calendar, leaving partial weeks null", () => {
  const { total, weeks } = normaliseCalendar({
    totalContributions: 7,
    weeks: [
      {
        contributionDays: [
          { weekday: 5, contributionLevel: "NONE" },
          { weekday: 6, contributionLevel: "FOURTH_QUARTILE" },
        ],
      },
    ],
  });

  assert.equal(total, 7);
  assert.deepEqual(weeks[0], [null, null, null, null, null, 0, 4]);
});

test("rejects contribution levels it does not understand", () => {
  assert.throws(
    () =>
      normaliseCalendar({
        totalContributions: 0,
        weeks: [{ contributionDays: [{ weekday: 0, contributionLevel: "MAXIMUM" }] }],
      }),
    /Unknown contribution level "MAXIMUM"/,
  );
});

/*
  Regression: the walk track used to stop at the last route step, a sliver short
  of 100%. With no keyframe at 100% the browser interpolates the rest of the
  loop back to the element's own transform — translate(0,0) — and the whole
  snake flies off to the panel's top-left corner before restarting.
*/
test("the walk track ends where the route ends, not at the origin", () => {
  const svg = renderContributionSnake({ ...calendar, seed: 3 });
  const walk = svg.match(/@keyframes walk\{(.+?)\}\n/s)[1];
  const stops = [...walk.matchAll(/([\d.]+)%\{transform:translate\((-?[\d.]+)px,(-?[\d.]+)px\)\}/g)];

  const last = stops.at(-1);
  const beforeLast = stops.at(-2);

  assert.equal(last[1], "100", "the track must define a keyframe at 100%");
  assert.deepEqual(
    [last[2], last[3]],
    [beforeLast[2], beforeLast[3]],
    "100% must hold the final cell rather than drift",
  );

  for (const [, , x, y] of stops) {
    assert.ok(Number(x) > 0 && Number(y) > 0, "no step may sit at the panel origin");
  }
});

test("the loop breathes out: grid refills and the snake fades before restarting", () => {
  const svg = renderContributionSnake({ ...calendar, seed: 3 });

  assert.match(svg, /98\.5%\{opacity:[\d.]+\}100%\{opacity:0\}/, "segments fade out");
  assert.match(svg, /98\.5%\{fill:#[0-9A-Fa-f]{6}\}100%\{fill:#[0-9A-Fa-f]{6}\}/, "cells refill");
});
