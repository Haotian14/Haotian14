const THEMES = Object.freeze({
  light: {
    background: "#F6F4ED",
    border: "#9CA9A4",
    grid: "#31413D",
    muted: "#60706B",
    accent: "#087F75",
    signal: "#B76D17",
    contributions: ["#ECE9E0", "#C8E6DF", "#82CFC1", "#2D9C8F", "#087F75"],
  },
  dark: {
    background: "#090D0C",
    border: "#3A4743",
    grid: "#71807B",
    muted: "#82908B",
    accent: "#5ECFC0",
    signal: "#F0B45A",
    contributions: ["#151B19", "#183B36", "#21675F", "#36998D", "#5ECFC0"],
  },
});

export const THEME_NAMES = Object.freeze(Object.keys(THEMES));

function escapeXmlText(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character],
  );
}

function extractGeneratedSvg(rawSvg, sourceName) {
  const svgMatch = rawSvg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/i);

  if (!svgMatch) {
    throw new Error(`Could not find the root SVG element in ${sourceName}`);
  }

  let generatedContent = svgMatch[1];
  const rawGeneratedStyles = [
    ...generatedContent.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi),
  ]
    .map(([style]) => style)
    .join("\n");
  const generatedColorVariables = new Map(
    [...rawGeneratedStyles.matchAll(/--([\w-]+):([^;}]+)/g)].map(
      ([, name, value]) => [name, value.trim()],
    ),
  );
  const generatedStyles = rawGeneratedStyles.replace(
    /var\(--([\w-]+)\)/g,
    (reference, name) => generatedColorVariables.get(name) || reference,
  );

  generatedContent = generatedContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/gi, "");

  return { generatedContent, generatedStyles };
}

export function renderThemedSnake(
  rawSvg,
  { owner = "Haotian14", sourceName = "input SVG", themeName = "dark" } = {},
) {
  if (!Object.hasOwn(THEMES, themeName)) {
    throw new Error(
      `Unknown theme "${themeName}". Expected one of: ${THEME_NAMES.join(", ")}`,
    );
  }

  const theme = THEMES[themeName];
  const safeOwner = escapeXmlText(owner);
  const { generatedContent, generatedStyles } = extractGeneratedSvg(
    rawSvg,
    sourceName,
  );
  const contributionLegend = theme.contributions
    .map(
      (color, index) =>
        `<rect x="${48 + index * 24}" width="16" height="16" rx="3" fill="${color}"${index === 0 ? ` stroke="${theme.border}"` : ""} />`,
    )
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="260" viewBox="0 0 1200 260" role="img" aria-labelledby="snake-title snake-desc">
  <title id="snake-title">${safeOwner}&apos;s contribution log</title>
  <desc id="snake-desc">An animated contribution graph for ${safeOwner}, presented as a clean system activity log.</desc>
  <defs>
    <pattern id="shell-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="${theme.grid}" stroke-opacity="0.045" />
    </pattern>
  </defs>
  ${generatedStyles}
  <style>
    .u { display: none !important; }
    .shell-mono { font-family: ui-monospace, "SFMono-Regular", Consolas, monospace; }
  </style>

  <rect width="1200" height="260" rx="14" fill="${theme.background}" />
  <rect width="1200" height="260" rx="14" fill="url(#shell-grid)" />
  <rect x="1" y="1" width="1198" height="258" rx="13" fill="none" stroke="${theme.border}" />

  <g class="shell-mono">
    <text x="42" y="39" fill="${theme.signal}" font-size="11" font-weight="700" letter-spacing="1.8">04 / CONTRIBUTION LOG</text>
    <text x="1158" y="39" text-anchor="end" fill="${theme.muted}" font-size="10" letter-spacing="1.3">SYNC / EVERY 12H</text>
    <circle cx="1021" cy="35" r="3.5" fill="${theme.accent}" />
  </g>
  <line x1="42" y1="56" x2="1158" y2="56" stroke="${theme.border}" />

  <g transform="translate(176 82)">
    ${generatedContent}
  </g>

  <g class="shell-mono" transform="translate(477 229)">
    <text y="13" fill="${theme.muted}" font-size="9" font-weight="700" letter-spacing="1.2">LESS</text>
    ${contributionLegend}
    <text x="176" y="13" fill="${theme.muted}" font-size="9" font-weight="700" letter-spacing="1.2">MORE</text>
  </g>
</svg>
`;
}
