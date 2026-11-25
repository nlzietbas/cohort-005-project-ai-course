import { type Oklch, contrastRatio, parseOklch } from "./lib/oklch";
import { readTokens } from "./lib/tokens";

/** WCAG AA: 4.5:1 for body text, 3:1 for a focus ring or other UI. */
const TEXT = 4.5;
const UI = 3;

/** A token's text, drawn on another token, and the ratio it must reach. */
type ContrastPair = {
  foreground: string;
  background: string;
  required: number;
};

export type ContrastFailure = ContrastPair & {
  mode: "light" | "dark";
  ratio: number;
};

const PAIRS: ReadonlyArray<ContrastPair> = [
  { foreground: "foreground", background: "background", required: TEXT },
  { foreground: "card-foreground", background: "card", required: TEXT },
  { foreground: "popover-foreground", background: "popover", required: TEXT },
  { foreground: "primary", background: "background", required: TEXT },
  { foreground: "primary-foreground", background: "primary", required: TEXT },
  {
    foreground: "secondary-foreground",
    background: "secondary",
    required: TEXT,
  },
  { foreground: "muted-foreground", background: "muted", required: TEXT },
  { foreground: "muted-foreground", background: "background", required: TEXT },
  { foreground: "accent-foreground", background: "accent", required: TEXT },
  { foreground: "sidebar-foreground", background: "sidebar", required: TEXT },
  {
    foreground: "sidebar-primary-foreground",
    background: "sidebar-primary",
    required: TEXT,
  },
  {
    foreground: "sidebar-accent-foreground",
    background: "sidebar-accent",
    required: TEXT,
  },
  { foreground: "ring", background: "background", required: UI },
];

/** An opaque `oklch()` colour, or null for anything else. */
function parseOpaque(value: string | undefined): Oklch | null {
  const colour = parseOklch(value);
  return colour?.alpha === 1 ? colour : null;
}

/** WCAG contrast ratio of two opaque `oklch()` colours, from 1 to 21. */
export function contrast(one: string, other: string): number {
  const a = parseOpaque(one);
  const b = parseOpaque(other);
  if (!a || !b) {
    throw new Error(`Not an opaque oklch() colour: ${a ? other : one}`);
  }
  return contrastRatio(a, b);
}

const MODES = [
  ["light", ":root"],
  ["dark", ".dark"],
] as const;

/**
 * Checks every text-on-surface pair the theme in `css` defines, in light
 * and dark mode, and returns the pairs below WCAG AA. A token the mode does
 * not declare, or one that is not an opaque `oklch()`, is a failure too.
 */
export function checkThemeContrast(css: string): ContrastFailure[] {
  const failures: ContrastFailure[] = [];
  for (const [mode, selector] of MODES) {
    const tokens = readTokens(css, selector);
    for (const { foreground, background, required } of PAIRS) {
      const fg = parseOpaque(tokens.get(foreground));
      const bg = parseOpaque(tokens.get(background));
      const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
      if (ratio < required) {
        failures.push({ mode, foreground, background, ratio, required });
      }
    }
  }
  return failures;
}
