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

  <g class="pixel-minato" transform="translate(150 218)" aria-label="Pixel-style Minato Namikaze in a dynamic running pose">
    <title>Minato Namikaze — Yellow Flash pixel sprite</title>
    <g class="pixel-bob" shape-rendering="crispEdges">
      <!-- Layered teleport streaks. -->
      <g class="pixel-spark">
        <rect x="-38" y="19" width="18" height="4" fill="#F59E0B" />
        <rect x="-30" y="11" width="17" height="4" fill="#FEF08A" />
        <rect x="-27" y="31" width="20" height="4" fill="#FACC15" />
        <rect x="-14" y="4" width="8" height="4" fill="#FFF7AE" />
        <rect x="-9" y="42" width="10" height="4" fill="#F97316" />
      </g>

      <!-- Sharper, windswept blond hair. -->
      <rect x="7" y="7" width="7" height="5" fill="#D97706" />
      <rect x="11" y="2" width="9" height="6" fill="#F59E0B" />
      <rect x="19" y="0" width="8" height="7" fill="#FDE047" />
      <rect x="27" y="3" width="9" height="5" fill="#FACC15" />
      <rect x="35" y="6" width="9" height="6" fill="#F59E0B" />
      <rect x="40" y="11" width="7" height="7" fill="#D97706" />
      <rect x="8" y="8" width="35" height="12" fill="#FACC15" />
      <rect x="12" y="8" width="18" height="4" fill="#FEF08A" />

      <!-- Forehead protector and handsome angular face. -->
      <rect x="9" y="15" width="34" height="6" fill="#172554" />
      <rect x="19" y="14" width="15" height="7" fill="#CBD5E1" />
      <rect x="22" y="16" width="9" height="3" fill="#64748B" />
      <rect x="13" y="21" width="28" height="13" fill="#F5C9A8" />
      <rect x="10" y="22" width="5" height="8" fill="#E5A77F" />
      <rect x="39" y="22" width="4" height="8" fill="#E5A77F" />
      <rect x="14" y="20" width="6" height="5" fill="#FACC15" />
      <rect x="35" y="20" width="6" height="5" fill="#EAB308" />
      <rect x="17" y="25" width="7" height="2" fill="#0F172A" />
      <rect x="31" y="25" width="7" height="2" fill="#0F172A" />
      <rect x="19" y="25" width="4" height="3" fill="#38BDF8" />
      <rect x="32" y="25" width="4" height="3" fill="#38BDF8" />
      <rect x="25" y="31" width="7" height="2" fill="#B55F57" />

      <!-- High-collar combat suit and forward arm. -->
      <rect x="17" y="34" width="24" height="22" fill="#172554" />
      <rect x="21" y="34" width="16" height="7" fill="#1E3A8A" />
      <rect x="24" y="34" width="10" height="4" fill="#60A5FA" />
      <rect x="38" y="36" width="12" height="7" fill="#1E3A8A" />
      <rect x="48" y="38" width="8" height="5" fill="#F5C9A8" />
      <rect x="53" y="42" width="10" height="3" fill="#94A3B8" />
      <rect x="61" y="40" width="4" height="7" fill="#475569" />

      <!-- Wind-swept Hokage cloak with flame hem. -->
      <rect x="7" y="34" width="12" height="8" fill="#FFFFFF" />
      <rect x="1" y="39" width="18" height="8" fill="#F8FAFC" />
      <rect x="-6" y="45" width="25" height="8" fill="#E2E8F0" />
      <rect x="-11" y="51" width="16" height="7" fill="#F8FAFC" />
      <rect x="5" y="51" width="14" height="7" fill="#E2E8F0" />
      <rect x="-11" y="56" width="7" height="4" fill="#DC2626" />
      <rect x="-4" y="53" width="7" height="7" fill="#EF4444" />
      <rect x="3" y="56" width="8" height="4" fill="#F87171" />
      <rect x="11" y="52" width="8" height="8" fill="#DC2626" />

      <!-- Strong running silhouette. -->
      <rect x="18" y="53" width="10" height="10" fill="#1E3A8A" />
      <rect x="34" y="53" width="9" height="7" fill="#1E40AF" />
      <rect x="11" y="61" width="17" height="5" fill="#0F172A" />
      <rect x="34" y="58" width="16" height="5" fill="#0F172A" />
      <rect x="8" y="64" width="8" height="3" fill="#334155" />
      <rect x="46" y="61" width="8" height="3" fill="#334155" />
    </g>
  </g>

  <g class="pixel-anime" transform="translate(890 218)" aria-label="Original adult pixel-style anime heroine in a summer battle outfit">
    <title>Original adult anime heroine — summer battle outfit pixel sprite</title>
    <g class="pixel-bob" shape-rendering="crispEdges">
      <!-- Neon motion ribbons. -->
      <g class="pixel-spark">
        <rect x="48" y="13" width="13" height="4" fill="#F0ABFC" />
        <rect x="55" y="24" width="18" height="4" fill="#22D3EE" />
        <rect x="50" y="38" width="14" height="4" fill="#A78BFA" />
        <rect x="65" y="6" width="6" height="6" fill="#F472B6" />
        <rect x="69" y="47" width="6" height="4" fill="#67E8F9" />
      </g>

      <!-- Glossy violet hair, flower clip and flowing ponytail. -->
      <rect x="14" y="2" width="22" height="5" fill="#E9D5FF" />
      <rect x="9" y="6" width="32" height="10" fill="#C084FC" />
      <rect x="6" y="12" width="38" height="10" fill="#9333EA" />
      <rect x="5" y="18" width="10" height="22" fill="#7E22CE" />
      <rect x="37" y="16" width="11" height="26" fill="#A855F7" />
      <rect x="44" y="23" width="9" height="25" fill="#6D28D9" />
      <rect x="49" y="34" width="9" height="17" fill="#581C87" />
      <rect x="31" y="7" width="5" height="5" fill="#F472B6" />
      <rect x="28" y="10" width="11" height="3" fill="#F9A8D4" />

      <!-- Soft face, bright eyes and smile. -->
      <rect x="12" y="17" width="27" height="16" fill="#F7CFC1" />
      <rect x="10" y="20" width="4" height="9" fill="#EFB6A7" />
      <rect x="15" y="21" width="7" height="2" fill="#4C1D95" />
      <rect x="29" y="21" width="7" height="2" fill="#4C1D95" />
      <rect x="17" y="22" width="4" height="4" fill="#22D3EE" />
      <rect x="30" y="22" width="4" height="4" fill="#67E8F9" />
      <rect x="18" y="22" width="2" height="2" fill="#ECFEFF" />
      <rect x="31" y="22" width="2" height="2" fill="#ECFEFF" />
      <rect x="23" y="29" width="8" height="2" fill="#E05E83" />
      <rect x="25" y="31" width="4" height="2" fill="#F9A8D4" />

      <!-- Breezy off-shoulder crop top, bare midriff and shorts. -->
      <rect x="12" y="35" width="6" height="5" fill="#F7CFC1" />
      <rect x="36" y="35" width="6" height="5" fill="#F7CFC1" />
      <rect x="16" y="34" width="22" height="12" fill="#0F172A" />
      <rect x="20" y="34" width="14" height="4" fill="#F472B6" />
      <rect x="18" y="38" width="18" height="6" fill="#7C3AED" />
      <rect x="22" y="38" width="10" height="3" fill="#C4B5FD" />
      <rect x="19" y="45" width="16" height="6" fill="#F7CFC1" />
      <rect x="24" y="46" width="6" height="2" fill="#EFAF9C" />
      <rect x="13" y="50" width="28" height="9" fill="#312E81" />
      <rect x="16" y="50" width="22" height="3" fill="#22D3EE" />
      <rect x="25" y="52" width="4" height="7" fill="#A78BFA" />

      <!-- Bare arms, long legs, thigh strap and ankle boots. -->
      <rect x="8" y="38" width="7" height="14" fill="#F7CFC1" />
      <rect x="39" y="38" width="7" height="13" fill="#F7CFC1" />
      <rect x="6" y="49" width="6" height="5" fill="#EFAF9C" />
      <rect x="43" y="48" width="6" height="5" fill="#EFAF9C" />
      <rect x="15" y="58" width="9" height="8" fill="#F7CFC1" />
      <rect x="31" y="58" width="9" height="6" fill="#F7CFC1" />
      <rect x="15" y="59" width="9" height="3" fill="#E879F9" />
      <rect x="10" y="64" width="14" height="5" fill="#4C1D95" />
      <rect x="31" y="62" width="15" height="5" fill="#4C1D95" />
      <rect x="8" y="67" width="8" height="3" fill="#A78BFA" />
      <rect x="42" y="65" width="8" height="3" fill="#A78BFA" />

      <!-- Tiny floating holographic terminal. -->
      <rect x="-10" y="28" width="14" height="11" rx="2" fill="#111827" stroke="#22D3EE" stroke-width="2" />
      <rect x="-7" y="31" width="5" height="2" fill="#F0ABFC" />
      <rect x="-7" y="35" width="8" height="2" fill="#22D3EE" />
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
