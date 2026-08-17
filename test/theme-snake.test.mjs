import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  renderThemedSnake,
  THEME_NAMES,
} from "../scripts/theme-snake.mjs";

const generatedSnake = readFileSync(
  new URL("./fixtures/contribution-sample.svg", import.meta.url),
  "utf8",
);

test("renders generated content inside the themed shell", () => {
  const result = renderThemedSnake(generatedSnake, {
    owner: "Haotian14",
    themeName: "light",
  });

  assert.match(result, /<title id="snake-title">Haotian14&apos;s contribution log<\/title>/);
  assert.match(result, /\.snake \{ fill: none; stroke: #F0B45A;/);
  assert.match(result, /<path class="snake"/);
  assert.doesNotMatch(result, /Representative generated contribution graph/);
  assert.match(result, /<rect width="1200" height="260" rx="14" fill="#F6F4ED" \/>/);
  assert.doesNotMatch(result, /pixel-|Minato|anime/);
});

test("escapes repository owners before inserting them into XML", () => {
  const result = renderThemedSnake(generatedSnake, {
    owner: 'Hart & <team> "profile"',
  });

  assert.match(result, /Hart &amp; &lt;team&gt; &quot;profile&quot;/);
  assert.doesNotMatch(result, /Hart & <team>/);
});

test("rejects unsupported themes instead of silently using dark", () => {
  assert.deepEqual(THEME_NAMES, ["light", "dark"]);
  assert.throws(
    () => renderThemedSnake(generatedSnake, { themeName: "neon" }),
    /Unknown theme "neon"\. Expected one of: light, dark/,
  );
});

test("reports malformed generator output with its source name", () => {
  assert.throws(
    () => renderThemedSnake("not svg", { sourceName: "tmp/broken.svg" }),
    /Could not find the root SVG element in tmp\/broken\.svg/,
  );
});
