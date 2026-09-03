import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { normaliseCalendar } from "../scripts/contributions.mjs";
import {
  planGrowth,
  renderContributionSnake,
  serpentinePath,
} from "../scripts/snake.mjs";

const calendar = JSON.parse(
  readFileSync(new URL("./fixtures/calendar-sample.json", import.meta.url), "utf8"),
);

test("walks every real day and skips the padding at both ends of the year", () => {
  const path = serpentinePath(calendar.weeks);
  const days = calendar.weeks.flat().filter((level) => level !== null);

  assert.equal(path.length, days.length);
  assert.equal(new Set(path.map((cell) => `${cell.column}:${cell.row}`)).size, path.length);
});

test("never jumps: every step lands on a touching cell", () => {
  const path = serpentinePath(calendar.weeks);

  for (let index = 1; index < path.length; index += 1) {
    const columns = Math.abs(path[index].column - path[index - 1].column);
    const rows = Math.abs(path[index].row - path[index - 1].row);

    assert.ok(
      columns <= 1 && rows <= 1 && columns + rows > 0,
      `step ${index} moved ${columns} columns and ${rows} rows`,
    );
  }
});

test("grows one segment per meal, in the order they are eaten", () => {
  const path = serpentinePath(calendar.weeks);
  const { length, births, stride } = planGrowth(path, { maxLength: 18 });

  assert.equal(length, 18);
  assert.equal(births[0], 0);
  assert.ok(stride >= 1);

  for (let index = 1; index < births.length; index += 1) {
    assert.ok(births[index] > births[index - 1], "segments must appear in order");
    assert.ok(path[births[index]].level > 0, "a segment is only born on a meal");
  }
});

test("never grows past the number of cells there are to eat", () => {
  const sparse = [
    [0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 0, 0],
  ];
  const { length, feedCount } = planGrowth(serpentinePath(sparse), { maxLength: 18 });

  assert.equal(feedCount, 2);
  assert.equal(length, 3);
});

test("renders an animated panel in both themes", () => {
  for (const themeName of ["light", "dark"]) {
    const svg = renderContributionSnake({ ...calendar, themeName });

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
