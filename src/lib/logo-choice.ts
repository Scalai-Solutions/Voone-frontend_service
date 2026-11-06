/**
 * The logo a card shows, chosen the way the backend chooses it for Apple and Google alike: the
 * dark-background logo on a dark card, the ordinary one on a light card, and whichever exists when
 * the other does not. Keeps the preview showing what members will see.
 */

const DEFAULT_BACKGROUND = "#30221f";

/** WCAG relative luminance of a #rrggbb colour (an invalid value counts as the default). */
const luminance = (hex: string): number => {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : DEFAULT_BACKGROUND.slice(1);
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The luminance below which white reads better than black: same cut-off as the backend. */
const DARK_BELOW = 0.179;

export const chooseLogoUrl = ({
  logoUrl,
  logoOnDarkUrl,
  color,
}: {
  logoUrl?: string | null;
  logoOnDarkUrl?: string | null;
  color: string;
}): string => {
  const plain = logoUrl?.trim() ?? "";
  const onDark = logoOnDarkUrl?.trim() ?? "";

  return luminance(color) < DARK_BELOW ? onDark || plain : plain || onDark;
};
