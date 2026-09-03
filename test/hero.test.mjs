import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { marquee, renderHero } from "../scripts/hero.mjs";
import { THEMES, THEME_NAMES } from "../scripts/palette.mjs";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("renders the banner in both themes with the shared tokens", () => {
  for (const themeName of THEME_NAMES) {
    const svg = renderHero(themeName);

    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /<\/svg>\s*$/);
    assert.equal(svg.match(/<svg\b/g).length, 1);
    assert.match(svg, /I build interfaces/);
    assert.ok(svg.includes(THEMES[themeName].bg));
    assert.ok(svg.includes(THEMES[themeName].accent));
    assert.doesNotMatch(svg, /undefined|NaN/);
  }
});

test("rejects unknown themes instead of falling back silently", () => {
  assert.throws(
    () => renderHero("neon"),
    /Unknown theme "neon"\. Expected one of: light, dark/,
  );
});

/*
  The banner is decorative: it may only carry words the README also states as
  real text, so nothing is reachable by image alone.
*/
test("every claim the banner makes is also readable as text", () => {
  const spokenForByText = [
    "I build interfaces",
    "complex",
    "feel clear",
    "Frontend engineer",
    "UNSW Computer Science and Information Technology",
    ...marquee,
  ];

  for (const claim of spokenForByText) {
    assert.ok(
      readme.toLowerCase().includes(claim.toLowerCase()),
      `"${claim}" is only in the banner — say it in the README text too`,
    );
  }
});

test("the banner is marked decorative and the snake carries a real description", () => {
  assert.match(readme, /assets\/hero-light\.svg" width="100%" alt="" \/>/);

  const snakeAlt = readme.match(/github-snake\.svg" width="100%" alt="([^"]+)"/);

  assert.ok(snakeAlt, "the contribution graph needs alt text");
  assert.ok(snakeAlt[1].length > 60, "describe what the animation shows");
});
