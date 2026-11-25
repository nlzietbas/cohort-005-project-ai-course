import { contrastRatio, parseOklch } from "./lib/oklch";
import { readTokens } from "./lib/tokens";

export type ContrastFailure = {
  mode: "light" | "dark";
  foreground: string;
  background: string;
  ratio: number;
  required: number;
};

/** WCAG AA: 4.5:1 for body text, 3:1 for a focus ring or other UI. */
const TEXT = 4.5;
const UI = 3;

const PAIRS: ReadonlyArray<[string, string, number]> = [
  ["foreground", "background", TEXT],
  ["card-foreground", "card", TEXT],
  ["popover-foreground", "popover", TEXT],
  ["primary", "background", TEXT],
  ["primary-foreground", "primary", TEXT],
  ["secondary-foreground", "secondary", TEXT],
  ["muted-foreground", "muted", TEXT],
  ["muted-foreground", "background", TEXT],
  ["accent-foreground", "accent", TEXT],
  ["sidebar-foreground", "sidebar", TEXT],
  ["sidebar-primary-foreground", "sidebar-primary", TEXT],
  ["sidebar-accent-foreground", "sidebar-accent", TEXT],
  ["ring", "background", UI],
];

/** WCAG contrast ratio of two opaque `oklch()` colours, from 1 to 21. */
export function contrast(one: string, other: string): number {
  const a = parseOklch(one);
  const b = parseOklch(other);
  if (!a || !b) throw new Error(`Not an oklch() colour: ${a ? other : one}`);
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
    for (const [foreground, background, required] of PAIRS) {
      const fg = parseOklch(tokens.get(foreground));
      const bg = parseOklch(tokens.get(background));
      const ratio =
        fg?.alpha === 1 && bg?.alpha === 1 ? contrastRatio(fg, bg) : 0;
      if (ratio < required) {
        failures.push({ mode, foreground, background, ratio, required });
      }
    }
  }
  return failures;
}
