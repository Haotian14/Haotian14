/*
  The one decorative panel in the README: a banner in the portfolio's paper
  palette, rendered for both themes.

  Everything it says is repeated as real text right below it in README.md, so
  the image is marked decorative (alt="") — screen readers skip it, GitHub
  search indexes the text version, and a reader on a phone gets the words even
  when the banner is scaled down to a strip.
*/

import {
  FONT_DISPLAY,
  FONT_MONO,
  FONT_SANS,
  escapeXmlText,
  resolveTheme,
} from "./palette.mjs";

const W = 1200;
const H = 430;
const GUTTER = 72;

export const marquee = [
  "React",
  "TypeScript",
  "Vue 3",
  "Design systems",
  "Interaction craft",
  "Performance",
  "Testing",
  "Accessibility",
];

function paragraph(lines, { x, y, leading, size, fill }) {
  return lines
    .map(
      (line, index) =>
        `    <text x="${x}" y="${y + index * leading}" font-family="${FONT_SANS}" font-size="${size}" fill="${fill}">${escapeXmlText(line)}</text>`,
    )
    .join("\n");
}

export function renderHero(themeName) {
  const theme = resolveTheme(themeName);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="hero-title">
  <title id="hero-title">Haotian Luo — I build interfaces that make complex feel clear</title>
  <defs>
    <pattern id="hero-grain" width="26" height="26" patternUnits="userSpaceOnUse">
      <path d="M26 0H0V26" fill="none" stroke="${theme.line}" stroke-opacity="${theme.gridOpacity}" />
    </pattern>
    <radialGradient id="hero-glow" cx="80%" cy="16%" r="48%">
      <stop offset="0%" stop-color="${theme.accentBright}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${theme.accentBright}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" rx="18" fill="${theme.bg}" />
  <rect width="${W}" height="${H}" rx="18" fill="url(#hero-grain)" />
  <rect width="${W}" height="${H}" rx="18" fill="url(#hero-glow)" />
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="17.25" fill="none" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />

  <circle cx="${GUTTER + 4}" cy="72" r="4.5" fill="${theme.accentBright}" />
  <text x="${GUTTER + 20}" y="76" font-family="${FONT_MONO}" font-size="11.5" letter-spacing="2.4" fill="${theme.accent}">FRONTEND ENGINEER · INDEPENDENT BUILDER</text>
  <text x="${W - GUTTER}" y="76" text-anchor="end" font-family="${FONT_MONO}" font-size="11" letter-spacing="1.4" fill="${theme.muted}">01 / PROFILE</text>

  <g font-family="${FONT_DISPLAY}" font-size="54" fill="${theme.ink}">
    <text x="${GUTTER}" y="164">I build interfaces</text>
    <text x="${GUTTER}" y="226">that make <tspan font-style="italic" fill="${theme.accent}">complex</tspan></text>
    <text x="${GUTTER}" y="288">feel clear.</text>
  </g>

${paragraph(
  [
    "Haotian Luo — a UNSW Computer Science and Information Technology",
    "graduate, turning ambitious product ideas into reliable, polished",
    "web experiences.",
  ],
  { x: GUTTER, y: 332, leading: 22, size: 14.5, fill: theme.inkSoft },
)}

  <g transform="translate(752 100)">
    <rect width="376" height="222" rx="16" fill="${theme.raised}" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />
    <rect x="28" y="28" width="94" height="94" rx="14" fill="${theme.sunken}" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />
    <text x="75" y="90" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="38" fill="${theme.accent}">HL.</text>
    <text x="142" y="54" font-family="${FONT_MONO}" font-size="11" letter-spacing="2" fill="${theme.muted}">SYD / CN</text>
${paragraph(["Based between product", "thinking and frontend", "engineering."], {
  x: 142,
  y: 82,
  leading: 20,
  size: 13.5,
  fill: theme.inkSoft,
})}
    <g transform="translate(28 156)">
      <rect width="320" height="38" rx="19" fill="none" stroke="${theme.accentBright}" stroke-opacity="0.45" />
      <circle cx="22" cy="19" r="4" fill="${theme.accentBright}" />
      <text x="38" y="23" font-family="${FONT_MONO}" font-size="11" letter-spacing="0.9" fill="${theme.accent}">Open to meaningful collaborations</text>
    </g>
  </g>

  <line x1="${GUTTER}" y1="392" x2="${W - GUTTER}" y2="392" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />
  <text x="${GUTTER}" y="412" font-family="${FONT_MONO}" font-size="11" letter-spacing="1.2" fill="${theme.muted}">${escapeXmlText(marquee.join("  ·  "))}</text>
</svg>
`;
}
