export type Oklch = { l: number; c: number; h: number; alpha: number };

export function parseOklch(value: string | undefined): Oklch | null {
  const match =
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/.exec(
      value ?? ""
    );
  if (!match) return null;
  const [, l, c, h, alpha, percent] = match;
  const rawAlpha = alpha === undefined ? 1 : Number.parseFloat(alpha);
  return {
    l: Number.parseFloat(l),
    c: Number.parseFloat(c),
    h: Number.parseFloat(h),
    alpha: percent ? rawAlpha / 100 : rawAlpha,
  };
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** WCAG relative luminance of an opaque OKLCH colour, clipped to sRGB. */
export function relativeLuminance({ l, c, h }: Oklch): number {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((x) => x ** 3);
  const [L, M, S] = lms;
  const red = clamp(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S);
  const green = clamp(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S);
  const blue = clamp(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(one: Oklch, other: Oklch): number {
  const [light, dark] = [relativeLuminance(one), relativeLuminance(other)].sort(
    (x, y) => y - x
  );
  return (light + 0.05) / (dark + 0.05);
}
