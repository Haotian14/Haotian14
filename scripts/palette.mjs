/*
  Design tokens shared with the portfolio site (haotian14.github.io/Portfolio).
  Same warm paper palette: ivory grounds, clay accent, charcoal ink — so the
  profile README and the site read as one system.
*/

const LIGHT = Object.freeze({
  bg: "#F4F2EB",
  raised: "#FBFAF6",
  sunken: "#EAE7DB",
  ink: "#191917",
  inkSoft: "#45433C",
  muted: "#7C7A71",
  accent: "#A8492A",
  accentBright: "#CC785C",
  onAccent: "#FFFDF8",
  line: "#191917",
  lineOpacity: 0.14,
  gridOpacity: 0.05,
  snake: "#A8492A",
  contributions: ["#EAE7DB", "#EEDACF", "#E0AE96", "#CC785C", "#A8492A"],
});

const DARK = Object.freeze({
  bg: "#16150F",
  raised: "#1E1D16",
  sunken: "#100F0A",
  ink: "#F2EFE5",
  inkSoft: "#CAC6B8",
  muted: "#918D80",
  accent: "#E29070",
  accentBright: "#EAA88B",
  onAccent: "#16150F",
  line: "#F2EFE5",
  lineOpacity: 0.15,
  gridOpacity: 0.055,
  snake: "#EAA88B",
  contributions: ["#1E1D16", "#3A2A22", "#6B402F", "#B4694A", "#E29070"],
});

export const THEMES = Object.freeze({ light: LIGHT, dark: DARK });

export const THEME_NAMES = Object.freeze(Object.keys(THEMES));

/** Type stacks mirror the site: Newsreader display, Inter sans, DM Mono. */
export const FONT_DISPLAY = "Newsreader, Iowan Old Style, Georgia, serif";
export const FONT_SANS = "Inter, Segoe UI, Helvetica Neue, Arial, sans-serif";
export const FONT_MONO = "DM Mono, ui-monospace, SFMono-Regular, Consolas, monospace";

export function resolveTheme(themeName) {
  if (!Object.hasOwn(THEMES, themeName)) {
    throw new Error(
      `Unknown theme "${themeName}". Expected one of: ${THEME_NAMES.join(", ")}`,
    );
  }

  return THEMES[themeName];
}

export function escapeXmlText(value) {
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
