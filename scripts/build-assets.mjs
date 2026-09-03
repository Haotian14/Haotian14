#!/usr/bin/env node

/*
  Regenerates the banner in assets/, in both themes:
    node scripts/build-assets.mjs [outputDir]
*/

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { renderHero } from "./hero.mjs";
import { THEME_NAMES } from "./palette.mjs";

const outputDir = process.argv[2] || "assets";

try {
  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    THEME_NAMES.map((themeName) =>
      writeFile(join(outputDir, `hero-${themeName}.svg`), renderHero(themeName), "utf8"),
    ),
  );

  console.log(`Wrote hero-${THEME_NAMES.join(".svg, hero-")}.svg to ${outputDir}/`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
