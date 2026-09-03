import assert from "node:assert/strict";
import { test } from "node:test";

import { THEMES, THEME_NAMES } from "../scripts/palette.mjs";
import {
  projects,
  renderHero,
  renderProjectCard,
  renderToolbox,
} from "../scripts/profile-cards.mjs";

/** Every panel has to be well-formed enough for GitHub to render it inline. */
function assertRootSvg(svg) {
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>\s*$/);
  assert.equal(svg.match(/<svg\b/g).length, 1);
  assert.doesNotMatch(svg, /undefined|NaN/);
}

test("renders the hero in both themes with the shared tokens", () => {
  for (const themeName of THEME_NAMES) {
    const svg = renderHero(themeName);

    assertRootSvg(svg);
    assert.match(svg, /I build interfaces/);
    assert.match(svg, /feel clear\./);
    assert.ok(svg.includes(THEMES[themeName].bg));
    assert.ok(svg.includes(THEMES[themeName].accent));
  }
});

test("renders a card per project with its tags", () => {
  for (const project of projects) {
    const svg = renderProjectCard(project, "light");

    assertRootSvg(svg);
    for (const tag of project.tags) {
      assert.ok(svg.includes(tag), `${project.title} is missing the ${tag} tag`);
    }
  }
});

test("escapes text that would otherwise break the markup", () => {
  const svg = renderProjectCard(
    { ...projects[0], title: 'Trainer & <script> "x"', slug: "escapes" },
    "dark",
  );

  assert.match(svg, /Trainer &amp; &lt;script&gt; &quot;x&quot;/);
  assert.doesNotMatch(svg, /<script>/);
});

test("keeps the toolbox grouped from interface to platform", () => {
  const svg = renderToolbox("dark");

  assertRootSvg(svg);
  assert.match(svg, /INTERFACE/);
  assert.match(svg, /CRAFT/);
  assert.match(svg, /PLATFORM/);
  assert.match(svg, /GitHub Actions/);
});

test("rejects unknown themes instead of falling back silently", () => {
  assert.throws(
    () => renderHero("neon"),
    /Unknown theme "neon"\. Expected one of: light, dark/,
  );
});
