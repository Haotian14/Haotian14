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
    .pixel-minato { animation: minato-travel 12s linear infinite; }
    .pixel-anime { animation: anime-travel 23s linear infinite; }
    .pixel-bob { animation: pixel-bob 420ms steps(2, end) infinite; }
    .pixel-spark { animation: pixel-spark 620ms steps(2, end) infinite; }
    @keyframes minato-travel {
      0% { transform: translate(150px, 218px); }
      79% { transform: translate(1210px, 218px); }
      79.01% { transform: translate(-84px, 218px); }
      100% { transform: translate(150px, 218px); }
    }
    @keyframes anime-travel {
      0% { transform: translate(890px, 218px); }
      69% { transform: translate(-84px, 218px); }
      69.01% { transform: translate(1210px, 218px); }
      100% { transform: translate(890px, 218px); }
    }
    @keyframes pixel-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    @keyframes pixel-spark {
      0%, 100% { opacity: 0.95; }
      50% { opacity: 0.28; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pixel-minato { animation: none; transform: translate(220px, 218px); }
      .pixel-anime { animation: none; transform: translate(850px, 218px); }
      .pixel-bob, .pixel-spark { animation: none; }
    }
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

  <g class="pixel-minato" transform="translate(150 218)" aria-label="Pixel-style yellow flash ninja">
    <title>Minato Namikaze pixel sprite</title>
    <g class="pixel-bob" shape-rendering="crispEdges">
      <g class="pixel-spark" fill="#FACC15">
        <rect x="-30" y="24" width="12" height="4" />
        <rect x="-22" y="16" width="8" height="4" fill="#FDE047" />
        <rect x="-18" y="34" width="10" height="4" fill="#F59E0B" />
        <rect x="-10" y="8" width="5" height="5" fill="#FEF08A" />
      </g>

      <!-- Spiky blond hair and forehead protector. -->
      <rect x="8" y="4" width="8" height="4" fill="#F59E0B" />
      <rect x="16" y="0" width="8" height="5" fill="#FACC15" />
      <rect x="24" y="3" width="8" height="4" fill="#FDE047" />
      <rect x="32" y="6" width="8" height="5" fill="#F59E0B" />
      <rect x="5" y="8" width="34" height="9" fill="#FACC15" />
      <rect x="8" y="15" width="30" height="5" fill="#172554" />
      <rect x="18" y="14" width="12" height="5" fill="#CBD5E1" />
      <rect x="21" y="15" width="6" height="2" fill="#64748B" />

      <!-- Face. -->
      <rect x="10" y="20" width="26" height="13" fill="#F2C6A5" />
      <rect x="8" y="21" width="4" height="8" fill="#E8AF88" />
      <rect x="34" y="21" width="4" height="8" fill="#E8AF88" />
      <rect x="14" y="23" width="5" height="3" fill="#38BDF8" />
      <rect x="28" y="23" width="5" height="3" fill="#38BDF8" />
      <rect x="20" y="29" width="7" height="2" fill="#C97C6B" />

      <!-- Dark combat suit. -->
      <rect x="14" y="32" width="20" height="22" fill="#172554" />
      <rect x="18" y="34" width="12" height="7" fill="#2563EB" />
      <rect x="4" y="34" width="10" height="8" fill="#F2C6A5" />
      <rect x="34" y="34" width="10" height="8" fill="#F2C6A5" />

      <!-- White cloak with red flame trim. -->
      <rect x="6" y="32" width="8" height="21" fill="#F8FAFC" />
      <rect x="34" y="32" width="8" height="21" fill="#F8FAFC" />
      <rect x="2" y="39" width="8" height="17" fill="#E2E8F0" />
      <rect x="38" y="39" width="8" height="17" fill="#E2E8F0" />
      <rect x="2" y="52" width="8" height="5" fill="#EF4444" />
      <rect x="10" y="49" width="6" height="8" fill="#F87171" />
      <rect x="32" y="49" width="6" height="8" fill="#F87171" />
      <rect x="38" y="52" width="8" height="5" fill="#EF4444" />

      <!-- Running legs and boots. -->
      <rect x="13" y="53" width="8" height="10" fill="#1E3A8A" />
      <rect x="27" y="53" width="8" height="7" fill="#1E3A8A" />
      <rect x="8" y="61" width="13" height="5" fill="#0F172A" />
      <rect x="27" y="59" width="13" height="5" fill="#0F172A" />
      <rect x="42" y="38" width="9" height="3" fill="#94A3B8" />
      <rect x="49" y="36" width="4" height="7" fill="#475569" />
    </g>
  </g>

  <g class="pixel-anime" transform="translate(890 218)" aria-label="Original pixel-style anime engineer">
    <title>Original anime engineer pixel sprite</title>
    <g class="pixel-bob" shape-rendering="crispEdges">
      <g class="pixel-spark">
        <rect x="48" y="16" width="10" height="4" fill="#E879F9" />
        <rect x="54" y="28" width="13" height="4" fill="#22D3EE" />
        <rect x="46" y="39" width="8" height="4" fill="#A78BFA" />
        <rect x="62" y="8" width="5" height="5" fill="#F0ABFC" />
      </g>

      <!-- Long purple hair. -->
      <rect x="12" y="3" width="24" height="5" fill="#C084FC" />
      <rect x="8" y="7" width="32" height="12" fill="#9333EA" />
      <rect x="6" y="15" width="10" height="25" fill="#7E22CE" />
      <rect x="34" y="13" width="10" height="31" fill="#A855F7" />
      <rect x="40" y="22" width="8" height="26" fill="#6D28D9" />
      <rect x="4" y="33" width="8" height="13" fill="#581C87" />

      <!-- Face and cyan eye. -->
      <rect x="12" y="16" width="24" height="16" fill="#F4C7B5" />
      <rect x="10" y="18" width="4" height="9" fill="#E9AFA0" />
      <rect x="15" y="21" width="5" height="3" fill="#22D3EE" />
      <rect x="27" y="21" width="5" height="3" fill="#38BDF8" />
      <rect x="20" y="28" width="7" height="2" fill="#D9778B" />

      <!-- Cropped tech jacket and dark skirt. -->
      <rect x="10" y="32" width="28" height="17" fill="#0E7490" />
      <rect x="14" y="34" width="20" height="12" fill="#22D3EE" />
      <rect x="18" y="34" width="12" height="12" fill="#0F172A" />
      <rect x="6" y="34" width="6" height="15" fill="#67E8F9" />
      <rect x="38" y="34" width="6" height="15" fill="#67E8F9" />
      <rect x="12" y="49" width="26" height="9" fill="#581C87" />
      <rect x="16" y="49" width="5" height="9" fill="#C084FC" />
      <rect x="29" y="49" width="5" height="9" fill="#C084FC" />

      <!-- Running legs and boots. -->
      <rect x="13" y="57" width="8" height="8" fill="#F4C7B5" />
      <rect x="29" y="57" width="8" height="6" fill="#F4C7B5" />
      <rect x="8" y="63" width="13" height="5" fill="#312E81" />
      <rect x="29" y="61" width="13" height="5" fill="#312E81" />

      <!-- Tiny floating terminal companion. -->
      <rect x="-10" y="27" width="14" height="11" rx="2" fill="#111827" stroke="#22D3EE" stroke-width="2" />
      <rect x="-7" y="30" width="5" height="2" fill="#A78BFA" />
      <rect x="-7" y="34" width="8" height="2" fill="#22D3EE" />
    </g>
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
