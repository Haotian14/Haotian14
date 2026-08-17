#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { renderThemedSnake, THEME_NAMES } from "./theme-snake.mjs";

const [inputPath, outputPath, themeName = "dark"] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error(
    `Usage: node scripts/build-snake.mjs <input.svg> <output.svg> <${THEME_NAMES.join("|")}>`,
  );
  process.exitCode = 1;
} else {
  try {
    const rawSvg = await readFile(inputPath, "utf8");
    const themedSvg = renderThemedSnake(rawSvg, {
      owner: process.env.GITHUB_REPOSITORY_OWNER || "Haotian14",
      sourceName: inputPath,
      themeName,
    });

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, themedSvg, "utf8");
    console.log(`Themed ${inputPath} -> ${outputPath} (${themeName})`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
