import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkThemeContrast, contrast } from "../index";

const appCss = readFileSync(
  new URL("../../../app.css", import.meta.url),
  "utf8"
);

const PAIRS = [
  "foreground: oklch(0.15 0 0)",
  "background: oklch(1 0 0)",
  "card-foreground: oklch(0.15 0 0)",
  "card: oklch(1 0 0)",
  "popover-foreground: oklch(0.15 0 0)",
  "popover: oklch(1 0 0)",
  "primary: oklch(0.3 0 0)",
  "primary-foreground: oklch(1 0 0)",
  "secondary-foreground: oklch(0.15 0 0)",
  "secondary: oklch(0.97 0 0)",
  "muted-foreground: oklch(0.4 0 0)",
  "muted: oklch(0.97 0 0)",
  "accent-foreground: oklch(0.15 0 0)",
  "accent: oklch(0.97 0 0)",
  "sidebar-foreground: oklch(0.15 0 0)",
  "sidebar: oklch(1 0 0)",
  "sidebar-primary-foreground: oklch(1 0 0)",
  "sidebar-primary: oklch(0.3 0 0)",
  "sidebar-accent-foreground: oklch(0.15 0 0)",
  "sidebar-accent: oklch(0.97 0 0)",
  "ring: oklch(0.5 0 0)",
];

function theme(overrides: Record<string, string> = {}): string {
  const body = PAIRS.map((line) => {
    const name = line.split(":")[0];
    return `  --${name}: ${overrides[name] ?? line.slice(name.length + 2)};`;
  }).join("\n");
  return `:root {\n${body}\n}\n\n.dark {\n${body}\n}\n`;
}

describe("contrast", () => {
  it("is 21 for black on white, in either order", () => {
    expect(contrast("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 1);
    expect(contrast("oklch(1 0 0)", "oklch(0 0 0)")).toBeCloseTo(21, 1);
  });

  it("is 1 for a colour against itself", () => {
    expect(contrast("oklch(0.52 0.22 285)", "oklch(0.52 0.22 285)")).toBe(1);
  });

  it("matches the WCAG ratio of a mid grey on white", () => {
    // oklch(0.6 0 0) is sRGB #808080, 3.95:1 on white.
    expect(contrast("oklch(0.6 0 0)", "oklch(1 0 0)")).toBeCloseTo(3.95, 1);
  });

  it("counts hue and chroma, not only lightness", () => {
    // Blue is far darker than yellow at the same OKLCH lightness.
    const blue = contrast("oklch(0.6 0.2 260)", "oklch(1 0 0)");
    const yellow = contrast("oklch(0.6 0.2 90)", "oklch(1 0 0)");
    expect(blue).toBeGreaterThan(yellow);
  });

  it.each([
    ["red", "oklch(0.628 0.2577 29.23)", 0.2126],
    ["green", "oklch(0.8664 0.2948 142.5)", 0.7152],
    ["blue", "oklch(0.452 0.3132 264.05)", 0.0722],
    ["yellow", "oklch(0.968 0.211 109.77)", 0.9278],
    ["magenta", "oklch(0.7017 0.3225 328.36)", 0.2848],
    ["cyan", "oklch(0.9054 0.1546 194.77)", 0.7874],
  ])("gives sRGB %s its WCAG luminance against black", (_, colour, y) => {
    expect(contrast(colour, "oklch(0 0 0)")).toBeCloseTo((y + 0.05) / 0.05, 1);
  });

  it("accepts loose spacing inside oklch()", () => {
    expect(contrast("oklch( 0  0  0 )", "oklch(1 0 0 /100% )")).toBeCloseTo(
      21,
      1
    );
  });

  it.each([
    "xoklch(0 0 0)",
    "oklch(0 0 0) x",
    " oklch(0 0 0)",
    "oklch(0 0 0 / 1) x",
  ])("throws on %j", (value) => {
    expect(() => contrast(value, "oklch(1 0 0)")).toThrow(value);
  });

  it("throws on a translucent colour, whose contrast depends on what is under it", () => {
    expect(() => contrast("oklch(0 0 0 / 50%)", "oklch(1 0 0)")).toThrow(
      "oklch(0 0 0 / 50%)"
    );
    expect(() => contrast("oklch(0 0 0)", "oklch(1 0 0 / 0.5)")).toThrow(
      "oklch(1 0 0 / 0.5)"
    );
  });

  it("throws on a value that is not oklch()", () => {
    expect(() => contrast("#fff", "oklch(0 0 0)")).toThrow("#fff");
    expect(() => contrast("oklch(0 0 0)", "red")).toThrow("red");
  });
});

describe("checkThemeContrast", () => {
  it("passes the app's theme in light and dark mode", () => {
    expect(checkThemeContrast(appCss)).toEqual([]);
  });

  it("passes a theme where every pair clears AA", () => {
    expect(checkThemeContrast(theme())).toEqual([]);
  });

  it("reports a text pair under 4.5:1 in both modes", () => {
    const failures = checkThemeContrast(
      theme({ "muted-foreground": "oklch(0.7 0 0)" })
    );
    expect(failures.map((f) => [f.mode, f.foreground, f.background])).toEqual([
      ["light", "muted-foreground", "muted"],
      ["light", "muted-foreground", "background"],
      ["dark", "muted-foreground", "muted"],
      ["dark", "muted-foreground", "background"],
    ]);
    expect(failures[0].required).toBe(4.5);
    expect(failures[0].ratio).toBeGreaterThan(1);
    expect(failures[0].ratio).toBeLessThan(4.5);
  });

  it("holds the focus ring to 3:1, not 4.5:1", () => {
    // oklch(0.6 0 0) is 3.95:1 on white: enough for a ring, not for text.
    expect(checkThemeContrast(theme({ ring: "oklch(0.6 0 0)" }))).toEqual([]);
    const failures = checkThemeContrast(theme({ ring: "oklch(0.8 0 0)" }));
    expect(failures).toHaveLength(2);
    expect(failures[0]).toMatchObject({ foreground: "ring", required: 3 });
  });

  it("reports only the mode that fails", () => {
    const css = theme().replace(
      /(\.dark \{[^}]*--foreground: )oklch\(0\.15 0 0\)/,
      "$1oklch(0.95 0 0)"
    );
    expect(checkThemeContrast(css)).toEqual([
      expect.objectContaining({ mode: "dark", foreground: "foreground" }),
    ]);
  });

  it("fails a pair whose token is missing or not oklch()", () => {
    const failures = checkThemeContrast(theme({ accent: "#eee" }));
    expect(failures).toContainEqual(
      expect.objectContaining({ foreground: "accent-foreground", ratio: 0 })
    );
    expect(checkThemeContrast(":root {}\n.dark {}")).toHaveLength(26);
    expect(checkThemeContrast("")).toHaveLength(26);
  });

  it("fails a translucent colour, whose contrast depends on what is under it", () => {
    const failures = checkThemeContrast(
      theme({ foreground: "oklch(0.15 0 0 / 50%)" })
    );
    expect(failures.map((f) => f.foreground)).toEqual([
      "foreground",
      "foreground",
    ]);
  });

  it("reads alpha as a fraction as well as a percentage", () => {
    expect(
      checkThemeContrast(theme({ foreground: "oklch(0.15 0 0 / 1)" }))
    ).toEqual([]);
    expect(
      checkThemeContrast(theme({ foreground: "oklch(0.15 0 0 / 100%)" }))
    ).toEqual([]);
  });

  it("reads a declaration however it is spaced", () => {
    const css = theme()
      .replace("--foreground: ", "--foreground:")
      .replace("--card-foreground: ", "--card-foreground : ")
      .replace(
        "--muted-foreground: oklch(0.4 0 0);",
        "--muted-foreground:\n    oklch(0.4 0 0)  ;"
      );
    expect(checkThemeContrast(css)).toEqual([]);
  });

  it("fails a translucent background as well as a translucent foreground", () => {
    const failures = checkThemeContrast(
      theme({ accent: "oklch(0.97 0 0 / 50%)" })
    );
    expect(failures.map((f) => f.background)).toEqual(["accent", "accent"]);
  });

  it("ignores tokens in other blocks such as @theme", () => {
    const css = `@theme inline {\n  --foreground: oklch(1 0 0);\n}\n${theme()}`;
    expect(checkThemeContrast(css)).toEqual([]);
  });
});
