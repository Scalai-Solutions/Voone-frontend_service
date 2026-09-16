/**
 * Contrast helpers for clinic-chosen colours.
 *
 * A clinic picks its own pass and page background, so the ink cannot be a fixed brand
 * colour and stay readable. The brand inks below only reach 3.98:1 on a mid-grey, which is
 * under WCAG AA — so they are tried first, to match the designed look, and pure black or
 * white is the guaranteed fallback. This mirrors how the Apple pass builder picks its
 * label colour, so a clinic's preview, its page and its pass agree.
 */

const BRAND_INK_DARK = "#2b211c";
const BRAND_INK_LIGHT = "#fff9f2";

/** WCAG AA for normal-size text. */
export const AA_CONTRAST = 4.5;

const expand = (hex: string): string => {
  const clean = hex.replace("#", "");

  // #abc and #aabbcc are both valid CSS; only the long form is safe to slice in pairs.
  return clean.length === 3
    ? clean
        .split("")
        .map((char) => char + char)
        .join("")
    : clean;
};

export const relativeLuminance = (hex: string): number => {
  const clean = expand(hex);
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (a: string, b: string): number => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * The ink to use on a background: the first candidate that clears AA, and otherwise
 * whichever scores highest. Preference-ordered rather than a luminance threshold, because a
 * threshold silently returns a brand ink that fails AA on mid-tone backgrounds.
 */
export const readableInkOn = (background: string): string => {
  const candidates = [BRAND_INK_DARK, BRAND_INK_LIGHT, "#000000", "#ffffff"];
  const passing = candidates.find((ink) => contrastRatio(ink, background) >= AA_CONTRAST);

  if (passing) {
    return passing;
  }

  return candidates.reduce((best, ink) =>
    contrastRatio(ink, background) > contrastRatio(best, background) ? ink : best
  );
};
