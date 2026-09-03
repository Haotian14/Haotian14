#!/usr/bin/env node

/*
  Regenerates every SVG panel in assets/, in both themes:
    node scripts/build-cards.mjs [outputDir]
*/

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { THEME_NAMES } from "./palette.mjs";
import { panels, projects, renderProjectCard } from "./profile-cards.mjs";

const outputDir = process.argv[2] || "assets";

try {
  await mkdir(outputDir, { recursive: true });

  const files = THEME_NAMES.flatMap((themeName) => [
    ...panels.map((panel) => ({
      name: `${panel.name}-${themeName}.svg`,
      svg: panel.render(themeName),
    })),
    ...projects.map((project) => ({
      name: `project-${project.slug}-${themeName}.svg`,
      svg: renderProjectCard(project, themeName),
    })),
  ]);

  await Promise.all(
    files.map((file) => writeFile(join(outputDir, file.name), file.svg, "utf8")),
  );

  console.log(`Wrote ${files.length} panels to ${outputDir}/`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
