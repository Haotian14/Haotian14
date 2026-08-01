import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [inputPath, outputPath, requestedTheme = "dark"] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error(
    "Usage: node scripts/theme-snake.mjs <input.svg> <output.svg> <light|dark>",
  );
}

const themes = {
  light: {
    backgroundStart: "#F8FAFC",
    backgroundEnd: "#EEF2FF",
    border: "#CBD5E1",
    grid: "#64748B",
    text: "#0F172A",
    muted: "#64748B",
    pill: "#F3E8FF",
    accent: "#7C3AED",
    accentSoft: "#A78BFA",
    accentTwo: "#0891B2",
  },
  dark: {
    backgroundStart: "#070B18",
    backgroundEnd: "#071B26",
    border: "#334155",
    grid: "#94A3B8",
    text: "#F8FAFC",
    muted: "#94A3B8",
    pill: "#1E1B4B",
    accent: "#A78BFA",
    accentSoft: "#7C3AED",
    accentTwo: "#22D3EE",
  },
};

const themeName = requestedTheme in themes ? requestedTheme : "dark";
const theme = themes[themeName];
const owner = process.env.GITHUB_REPOSITORY_OWNER || "Haotian14";
const rawSvg = await readFile(inputPath, "utf8");
const svgMatch = rawSvg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/i);

if (!svgMatch) {
  throw new Error(`Could not find the root SVG element in ${inputPath}`);
}

let generatedContent = svgMatch[1];
const rawGeneratedStyles = [...generatedContent.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)]
  .map(([style]) => style)
  .join("\n");
const generatedColorVariables = new Map(
  [...rawGeneratedStyles.matchAll(/--([\w-]+):([^;}]+)/g)].map(([, name, value]) => [
    name,
    value.trim(),
  ]),
);
const generatedStyles = rawGeneratedStyles.replace(
  /var\(--([\w-]+)\)/g,
  (reference, name) => generatedColorVariables.get(name) || reference,
);

generatedContent = generatedContent
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<desc[^>]*>[\s\S]*?<\/desc>/gi, "");

const themedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-labelledby="snake-title snake-desc">
  <title id="snake-title">${owner}'s contribution trail</title>
  <desc id="snake-desc">An animated violet and cyan snake moving through ${owner}'s GitHub contribution graph.</desc>
  <defs>
    <linearGradient id="shell-bg" x1="0" y1="0" x2="1200" y2="330" gradientUnits="userSpaceOnUse">
      <stop stop-color="${theme.backgroundStart}" />
      <stop offset="1" stop-color="${theme.backgroundEnd}" />
    </linearGradient>
    <linearGradient id="shell-accent" x1="42" y1="0" x2="1158" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="${theme.accent}" />
      <stop offset="1" stop-color="${theme.accentTwo}" />
    </linearGradient>
    <radialGradient id="shell-glow-one">
      <stop stop-color="${theme.accentSoft}" stop-opacity="0.2" />
      <stop offset="1" stop-color="${theme.accentSoft}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="shell-glow-two">
      <stop stop-color="${theme.accentTwo}" stop-opacity="0.16" />
      <stop offset="1" stop-color="${theme.accentTwo}" stop-opacity="0" />
    </radialGradient>
    <pattern id="shell-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="${theme.grid}" stroke-opacity="0.055" />
    </pattern>
  </defs>
  ${generatedStyles}
  <style>
    .u { display: none !important; }
    .shell-text { font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .shell-mono { font-family: ui-monospace, "SFMono-Regular", Consolas, monospace; }
  </style>

  <rect width="1200" height="330" rx="28" fill="url(#shell-bg)" />
  <rect width="1200" height="330" rx="28" fill="url(#shell-grid)" />
  <circle cx="92" cy="40" r="190" fill="url(#shell-glow-one)" />
  <circle cx="1128" cy="296" r="220" fill="url(#shell-glow-two)" />
  <rect x="1" y="1" width="1198" height="328" rx="27" fill="none" stroke="${theme.border}" stroke-opacity="0.76" />

  <g class="shell-text" transform="translate(42 29)">
    <rect width="48" height="48" rx="14" fill="${theme.pill}" stroke="${theme.accent}" stroke-opacity="0.72" />
    <path d="M14 25H21L25 18L30 30L34 23H39" fill="none" stroke="url(#shell-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="14" cy="25" r="2.5" fill="${theme.accent}" />
    <circle cx="39" cy="23" r="2.5" fill="${theme.accentTwo}" />
    <text x="64" y="20" fill="${theme.text}" font-size="18" font-weight="800" letter-spacing="1.5">CONTRIBUTION TRAIL</text>
    <text x="64" y="41" fill="${theme.muted}" font-size="12" font-weight="600">@${owner} · building in public</text>
  </g>

  <g class="shell-mono" transform="translate(944 36)">
    <rect width="214" height="34" rx="17" fill="${theme.pill}" stroke="${theme.accentTwo}" stroke-opacity="0.46" />
    <circle cx="18" cy="17" r="4" fill="${theme.accentTwo}" />
    <text x="32" y="21.5" fill="${theme.text}" font-size="11" font-weight="700" letter-spacing="1">LIVE · UPDATED EVERY 12H</text>
  </g>

  <rect x="42" y="92" width="1116" height="2" rx="1" fill="url(#shell-accent)" opacity="0.68" />

  <g transform="translate(176 135)">
    ${generatedContent}
  </g>

  <g class="shell-mono" transform="translate(477 286)">
    <text y="13" fill="${theme.muted}" font-size="10" font-weight="700" letter-spacing="1.2">LESS</text>
    <rect x="48" width="16" height="16" rx="4" fill="${themeName === "dark" ? "#161B22" : "#F1F5F9"}" stroke="${theme.border}" stroke-opacity="0.7" />
    <rect x="72" width="16" height="16" rx="4" fill="${themeName === "dark" ? "#18213B" : "#DDD6FE"}" />
    <rect x="96" width="16" height="16" rx="4" fill="${themeName === "dark" ? "#312E81" : "#A78BFA"}" />
    <rect x="120" width="16" height="16" rx="4" fill="${themeName === "dark" ? "#7C3AED" : "#6D5EF5"}" />
    <rect x="144" width="16" height="16" rx="4" fill="${themeName === "dark" ? "#22D3EE" : "#0891B2"}" />
    <text x="174" y="13" fill="${theme.muted}" font-size="10" font-weight="700" letter-spacing="1.2">MORE</text>
  </g>
</svg>
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, themedSvg, "utf8");
console.log(`Themed ${inputPath} -> ${outputPath} (${themeName})`);
