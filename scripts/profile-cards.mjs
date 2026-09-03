/*
  Renders the profile README as a set of full-width SVG panels, built from the
  same content the portfolio site publishes (src/data.ts there) and the same
  warm paper tokens — ivory grounds, clay accent, serif display.

  Layout system: 1200-wide canvas, 72px gutters, hairline rules, one accent
  moment per panel. Nothing here depends on a webfont being installed; the
  stacks in palette.mjs degrade to Georgia / system sans / system mono.
*/

import {
  FONT_DISPLAY,
  FONT_MONO,
  FONT_SANS,
  escapeXmlText,
  resolveTheme,
} from "./palette.mjs";

const W = 1200;
const GUTTER = 72;
const CONTENT_RIGHT = W - GUTTER;

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

export const milestones = [
  {
    marker: "01",
    label: "UNIVERSITY",
    title: "Bachelor of Computer Science",
    place: "UNSW Sydney · 2021—2024",
    lines: [
      "Systems and C, data structures, algorithm design,",
      "databases, networks, AI, deep learning, computer",
      "vision and the web — closing with a team capstone",
      "taken from proposal to delivery.",
    ],
  },
  {
    marker: "02",
    label: "POSTGRADUATE",
    title: "Master of Information Technology",
    place: "UNSW Sydney · 2024—2025",
    lines: [
      "Machine learning and data mining, recommender",
      "systems, graph analytics, information retrieval,",
      "security engineering, HCI and research methods —",
      "again finishing on a team capstone.",
    ],
  },
  {
    marker: "03",
    label: "NOW",
    title: "Frontend Engineer",
    place: "Product & Platform Development",
    lines: [
      "Building production web experiences with React,",
      "Vue and TypeScript — from complex interaction",
      "flows to performance, testing and release",
      "quality.",
    ],
  },
];

export const principles = [
  {
    number: "01",
    title: "Think in systems",
    lines: [
      "Design components, state and data flow so",
      "the product can grow without becoming",
      "fragile.",
    ],
  },
  {
    number: "02",
    title: "Ship with evidence",
    lines: [
      "Use tests, performance budgets and",
      "reproducible flows to turn confidence into",
      "something measurable.",
    ],
  },
  {
    number: "03",
    title: "Stay close to users",
    lines: [
      "Treat interaction polish, edge cases and",
      "clear feedback as core product work — not",
      "decoration.",
    ],
  },
];

export const projects = [
  {
    slug: "poker",
    number: "01",
    kicker: "PRODUCT ENGINEERING",
    title: "Texas Hold'em Trainer",
    lines: [
      "A 6-max training loop with range-aware AI, replayable",
      "hands, EV-based reviews and long-term leak reports —",
      "an offline-first PWA covered by 985 automated tests.",
    ],
    tags: ["React", "TypeScript", "PWA", "Playwright"],
  },
  {
    slug: "frontend",
    number: "02",
    kicker: "KNOWLEDGE SYSTEM",
    title: "Frontend Interview Handbook",
    lines: [
      "50 in-depth topics with full-text search, interview",
      "drills, code references and a dependency-based",
      "learning map. Every route is prerendered.",
    ],
    tags: ["React", "TypeScript", "Vite", "MDX"],
  },
  {
    slug: "algorithms",
    number: "03",
    kicker: "MACHINE LEARNING",
    title: "Algorithm Interview Handbook",
    lines: [
      "17 chapters and 201 high-frequency review questions",
      "with runnable implementations across LLMs, recsys,",
      "computer vision, ML and system design.",
    ],
    tags: ["LLM", "Machine Learning", "Algorithms", "Static Web"],
  },
];

export const toolGroups = [
  { label: "INTERFACE", items: ["React", "TypeScript", "Vue 3", "JavaScript"] },
  { label: "CRAFT", items: ["Vite", "Umi", "Ant Design", "ECharts"] },
  { label: "PLATFORM", items: ["Node.js", "Spring Boot", "Docker", "GitHub Actions"] },
];

function ground(width, height, theme, { radius = 18, grain = null } = {}) {
  const texture = grain
    ? `\n  <rect width="${width}" height="${height}" rx="${radius}" fill="url(#${grain})" />`
    : "";

  return `  <rect width="${width}" height="${height}" rx="${radius}" fill="${theme.bg}" />${texture}
  <rect x="0.75" y="0.75" width="${width - 1.5}" height="${height - 1.5}" rx="${radius - 0.75}" fill="none" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />`;
}

function grainPattern(id, theme) {
  return `    <pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse">
      <path d="M26 0H0V26" fill="none" stroke="${theme.line}" stroke-opacity="${theme.gridOpacity}" />
    </pattern>`;
}

function rule(y, theme, { x1 = GUTTER, x2 = CONTENT_RIGHT, opacity = theme.lineOpacity } = {}) {
  return `  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${theme.line}" stroke-opacity="${opacity}" />`;
}

function kicker(text, y, theme, { x = GUTTER, fill = theme.accent } = {}) {
  return `  <text x="${x}" y="${y}" font-family="${FONT_MONO}" font-size="11.5" letter-spacing="2.4" fill="${fill}">${escapeXmlText(text)}</text>`;
}

function metaRight(text, y, theme) {
  return `  <text x="${CONTENT_RIGHT}" y="${y}" text-anchor="end" font-family="${FONT_MONO}" font-size="11" letter-spacing="1.4" fill="${theme.muted}">${escapeXmlText(text)}</text>`;
}

function paragraph(lines, { x, y, leading = 21, size = 13.5, fill, indent = 0 }) {
  return lines
    .map(
      (line, index) =>
        `    <text x="${x + (index === 0 ? indent : 0)}" y="${y + index * leading}" font-family="${FONT_SANS}" font-size="${size}" fill="${fill}">${escapeXmlText(line)}</text>`,
    )
    .join("\n");
}

/** Monospace advance width — close enough to lay pills out without a font engine. */
function monoWidth(text, fontSize) {
  return text.length * fontSize * 0.6;
}

function tagPills(tags, { x, y, theme, fontSize = 10.5 }) {
  let cursor = x;

  return tags
    .map((tag) => {
      const width = Math.round(monoWidth(tag, fontSize) + 24);
      const pill = `    <g transform="translate(${cursor} ${y})">
      <rect width="${width}" height="26" rx="13" fill="${theme.sunken}" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />
      <text x="${width / 2}" y="17" text-anchor="middle" font-family="${FONT_MONO}" font-size="${fontSize}" fill="${theme.inkSoft}" letter-spacing="0.6">${escapeXmlText(tag)}</text>
    </g>`;
      cursor += width + 10;
      return pill;
    })
    .join("\n");
}

function svg({ width, height, titleId, title, desc, defs = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${titleId} ${titleId}-desc">
  <title id="${titleId}">${escapeXmlText(title)}</title>
  <desc id="${titleId}-desc">${escapeXmlText(desc)}</desc>${defs ? `\n  <defs>\n${defs}\n  </defs>\n` : "\n"}
${body}
</svg>
`;
}

export function renderHero(themeName) {
  const theme = resolveTheme(themeName);
  const marqueeLine = marquee.join("  ·  ");

  const body = `${ground(W, 430, theme, { grain: "hero-grain" })}
  <rect width="${W}" height="430" rx="18" fill="url(#hero-glow)" />

  <circle cx="${GUTTER + 4}" cy="72" r="4.5" fill="${theme.accentBright}" />
${kicker("FRONTEND ENGINEER · INDEPENDENT BUILDER", 76, theme, { x: GUTTER + 20 })}
${metaRight("01 / PROFILE", 76, theme)}

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
${paragraph(
  ["Based between product", "thinking and frontend", "engineering."],
  { x: 142, y: 82, leading: 20, size: 13.5, fill: theme.inkSoft },
)}
    <g transform="translate(28 156)">
      <rect width="320" height="38" rx="19" fill="none" stroke="${theme.accentBright}" stroke-opacity="0.45" />
      <circle cx="22" cy="19" r="4" fill="${theme.accentBright}" />
      <text x="38" y="23" font-family="${FONT_MONO}" font-size="11" letter-spacing="0.9" fill="${theme.accent}">Open to meaningful collaborations</text>
    </g>
  </g>

${rule(392, theme)}
  <text x="${GUTTER}" y="412" font-family="${FONT_MONO}" font-size="11" letter-spacing="1.2" fill="${theme.muted}">${escapeXmlText(marqueeLine)}</text>`;

  return svg({
    width: W,
    height: 430,
    titleId: "hero",
    title: "Haotian Luo — I build interfaces that make complex feel clear",
    desc: "Profile banner for Haotian Luo, frontend engineer, matching the portfolio at haotian14.github.io/Portfolio.",
    defs: `${grainPattern("hero-grain", theme)}
    <radialGradient id="hero-glow" cx="80%" cy="16%" r="48%">
      <stop offset="0%" stop-color="${theme.accentBright}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${theme.accentBright}" stop-opacity="0" />
    </radialGradient>`,
    body,
  });
}

export function renderJourney(themeName) {
  const theme = resolveTheme(themeName);
  const columns = milestones
    .map((milestone, index) => {
      const x = GUTTER + index * 368;

      return `  <g>
    <text x="${x}" y="212" font-family="${FONT_MONO}" font-size="11" letter-spacing="2.2" fill="${theme.accent}">${escapeXmlText(milestone.marker)} — ${escapeXmlText(milestone.label)}</text>
${rule(228, theme, { x1: x, x2: x + 320, opacity: theme.lineOpacity * 0.8 })}
    <text x="${x}" y="266" font-family="${FONT_DISPLAY}" font-size="22" fill="${theme.ink}">${escapeXmlText(milestone.title)}</text>
    <text x="${x}" y="292" font-family="${FONT_MONO}" font-size="11" letter-spacing="0.8" fill="${theme.muted}">${escapeXmlText(milestone.place)}</text>
${paragraph(milestone.lines, { x, y: 324, leading: 20, size: 13, fill: theme.inkSoft })}
  </g>`;
    })
    .join("\n");

  const body = `${ground(W, 430, theme)}
${kicker("02 — JOURNEY", 60, theme)}
${metaRight("FOUNDATIONS → PRACTICE", 60, theme)}
  <text x="${GUTTER}" y="124" font-family="${FONT_DISPLAY}" font-size="34" fill="${theme.ink}">From computer science foundations to <tspan font-style="italic" fill="${theme.accent}">shipping real products</tspan>.</text>
${rule(160, theme)}
${columns}`;

  return svg({
    width: W,
    height: 430,
    titleId: "journey",
    title: "Journey — from computer science foundations to shipping real products",
    desc: "A three-step timeline: UNSW bachelor's degree, UNSW master's degree, and current frontend engineering work.",
    body,
  });
}

export function renderWork(themeName) {
  const theme = resolveTheme(themeName);
  const columns = principles
    .map((principle, index) => {
      const x = GUTTER + index * 368;

      return `  <g>
    <text x="${x}" y="320" font-family="${FONT_MONO}" font-size="11" letter-spacing="2.2" fill="${theme.accent}">${escapeXmlText(principle.number)}</text>
    <text x="${x}" y="356" font-family="${FONT_DISPLAY}" font-size="21" fill="${theme.ink}">${escapeXmlText(principle.title)}</text>
${paragraph(principle.lines, { x, y: 386, leading: 20, size: 13, fill: theme.inkSoft })}
${rule(456, theme, { x1: x, x2: x + 56, opacity: 1 })}
  </g>`;
    })
    .join("\n");

  const body = `${ground(W, 490, theme)}
${kicker("03 — HOW I WORK", 60, theme)}
${metaRight("PRINCIPLES / 03", 60, theme)}
  <g font-family="${FONT_DISPLAY}" font-size="34" fill="${theme.ink}">
    <text x="${GUTTER}" y="124">Product sense in the details.</text>
    <text x="${GUTTER}" y="168" font-style="italic" fill="${theme.accent}">Engineering discipline underneath.</text>
  </g>
${paragraph(
  [
    "I enjoy the part of frontend work where the answer is not simply “build the screen” —",
    "clarifying fuzzy requirements, modelling complicated state, protecting the main user",
    "flow and making the final experience feel effortless.",
  ],
  { x: GUTTER, y: 214, leading: 22, size: 14, fill: theme.inkSoft },
)}
${rule(276, theme)}
${columns}`;

  return svg({
    width: W,
    height: 490,
    titleId: "work",
    title: "How I work — product sense in the details, engineering discipline underneath",
    desc: "Three working principles: think in systems, ship with evidence, stay close to users.",
    body,
  });
}

export function renderToolbox(themeName) {
  const theme = resolveTheme(themeName);
  const columns = toolGroups
    .map((group, index) => {
      const items = group.items
        .map(
          (item, itemIndex) => `    <circle cx="${GUTTER + index * 368 + 5}" cy="${152 + itemIndex * 34}" r="3" fill="${theme.accentBright}" />
    <text x="${GUTTER + index * 368 + 22}" y="${157 + itemIndex * 34}" font-family="${FONT_SANS}" font-size="16" fill="${theme.ink}">${escapeXmlText(item)}</text>`,
        )
        .join("\n");

      return `  <g>
    <text x="${GUTTER + index * 368}" y="110" font-family="${FONT_MONO}" font-size="11" letter-spacing="2.2" fill="${theme.accent}">${escapeXmlText(group.label)}</text>
${rule(126, theme, { x1: GUTTER + index * 368, x2: GUTTER + index * 368 + 320, opacity: theme.lineOpacity * 0.8 })}
${items}
  </g>`;
    })
    .join("\n");

  const body = `${ground(W, 320, theme)}
${kicker("TOOLS I REACH FOR", 60, theme)}
${metaRight("INTERFACE → SERVICE → PLATFORM", 60, theme)}
${rule(78, theme)}
${columns}`;

  return svg({
    width: W,
    height: 320,
    titleId: "toolbox",
    title: "Tools I reach for",
    desc: "Interface, craft, and platform tools Haotian Luo works with.",
    body,
  });
}

export function renderProjectsBand(themeName) {
  const theme = resolveTheme(themeName);

  const body = `${ground(W, 170, theme)}
${kicker("04 — SELECTED PROJECTS", 60, theme)}
${metaRight("SOURCE + LIVE / 03", 60, theme)}
  <text x="${GUTTER}" y="124" font-family="${FONT_DISPLAY}" font-size="32" fill="${theme.ink}">Learning by building things that are <tspan font-style="italic" fill="${theme.accent}">meant to be used</tspan>.</text>`;

  return svg({
    width: W,
    height: 170,
    titleId: "projects",
    title: "Selected projects — learning by building things that are meant to be used",
    desc: "Section heading for the selected projects below.",
    body,
  });
}

export function renderProjectCard(project, themeName) {
  const theme = resolveTheme(themeName);

  const body = `${ground(580, 250, theme, { radius: 14 })}
  <path d="M0.75 14Q0.75 0.75 14 0.75H214" fill="none" stroke="${theme.accentBright}" stroke-width="2" />

  <text x="32" y="46" font-family="${FONT_MONO}" font-size="11" letter-spacing="2" fill="${theme.accent}">${escapeXmlText(project.number)} / ${escapeXmlText(project.kicker)}</text>
  <text x="548" y="56" text-anchor="end" font-family="${FONT_DISPLAY}" font-size="46" fill="${theme.muted}" fill-opacity="0.26">${escapeXmlText(project.number)}</text>
  <text x="32" y="96" font-family="${FONT_DISPLAY}" font-size="26" fill="${theme.ink}">${escapeXmlText(project.title)}</text>
${paragraph(project.lines, { x: 32, y: 136, leading: 21, size: 13.5, fill: theme.inkSoft })}
${tagPills(project.tags, { x: 32, y: 198, theme })}`;

  return svg({
    width: 580,
    height: 250,
    titleId: `card-${project.slug}`,
    title: project.title,
    desc: `${project.kicker.toLowerCase()} project card for ${project.title}.`,
    body,
  });
}

export function renderClosing(themeName) {
  const theme = resolveTheme(themeName);

  const body = `${ground(W, 280, theme, { grain: "closing-grain" })}
  <rect width="${W}" height="280" rx="18" fill="url(#closing-glow)" />
${kicker("WHAT'S NEXT", 60, theme)}
${metaRight("OPEN TO COLLABORATIONS", 60, theme)}
  <g font-family="${FONT_DISPLAY}" font-size="40" fill="${theme.ink}">
    <text x="${GUTTER}" y="150">Still learning.</text>
    <text x="${GUTTER}" y="198" font-style="italic" fill="${theme.accent}">Still shipping.</text>
  </g>
  <line x1="520" y1="104" x2="520" y2="216" stroke="${theme.line}" stroke-opacity="${theme.lineOpacity}" />
${paragraph(
  [
    "I'm especially interested in ambitious frontend systems,",
    "AI-native products, and the craft of turning complex tools",
    "into interfaces people actually enjoy using.",
    "If you're working on something along those lines, I'd like",
    "to hear about it.",
  ],
  { x: 576, y: 128, leading: 22, size: 14, fill: theme.inkSoft },
)}`;

  return svg({
    width: W,
    height: 280,
    titleId: "closing",
    title: "Still learning. Still shipping.",
    desc: "Closing note inviting collaboration on frontend systems and AI-native products.",
    defs: `${grainPattern("closing-grain", theme)}
    <radialGradient id="closing-glow" cx="18%" cy="86%" r="52%">
      <stop offset="0%" stop-color="${theme.accentBright}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${theme.accentBright}" stop-opacity="0" />
    </radialGradient>`,
    body,
  });
}

export const panels = [
  { name: "hero", render: renderHero },
  { name: "journey", render: renderJourney },
  { name: "work", render: renderWork },
  { name: "toolbox", render: renderToolbox },
  { name: "projects", render: renderProjectsBand },
  { name: "closing", render: renderClosing },
];
