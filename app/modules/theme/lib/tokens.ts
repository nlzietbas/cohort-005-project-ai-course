/** Reads the custom properties declared directly in one selector's block. */
export function readTokens(css: string, selector: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  if (!block) return tokens;
  for (const declaration of block[1].split(";")) {
    const match = /--([\w-]+)\s*:\s*(.+?)\s*$/s.exec(declaration);
    if (match) tokens.set(match[1], match[2]);
  }
  return tokens;
}
