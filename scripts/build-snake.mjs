#!/usr/bin/env node

/*
  Builds the animated contribution panels published to the `output` branch:
    node scripts/build-snake.mjs <outputDir> [calendar.json]

  With no calendar file it reads the live calendar from the GitHub GraphQL API
  using GITHUB_TOKEN; the file argument is there for local runs and tests.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { fetchContributions } from "./contributions.mjs";
import { THEME_NAMES } from "./palette.mjs";
import { renderContributionSnake } from "./snake.mjs";

const [outputDir = "dist", calendarPath] = process.argv.slice(2);
const login = process.env.GITHUB_REPOSITORY_OWNER || "Haotian14";

try {
  const calendar = calendarPath
    ? JSON.parse(await readFile(calendarPath, "utf8"))
    : await fetchContributions({ login, token: process.env.GITHUB_TOKEN });

  await mkdir(outputDir, { recursive: true });

  const files = THEME_NAMES.map((themeName) => ({
    name: themeName === "light" ? "github-snake.svg" : "github-snake-dark.svg",
    svg: renderContributionSnake({ ...calendar, login, themeName }),
  }));

  await Promise.all(
    files.map((file) => writeFile(join(outputDir, file.name), file.svg, "utf8")),
  );

  console.log(
    `Wrote ${files.map((file) => file.name).join(", ")} to ${outputDir}/ (${calendar.total} contributions)`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
