/** The backend caps the wallet "Beneficios" and "Información" texts at this many characters. */
export const WALLET_TEXT_MAX = 500;

/** Amber warning starts here. */
export const WALLET_TEXT_WARN_AT = 450;

export const WALLET_TEXT_MAX_MESSAGE = `Máximo ${WALLET_TEXT_MAX} caracteres`;

/**
 * Counts characters the way the backend does: Unicode code points, not UTF-16 units, so an emoji
 * is one character here and in the API. `string.length` would count it as two.
 */
export function countChars(text: string): number {
  return Array.from(text).length;
}

/** Cuts text to at most `max` code points without splitting a character in two. */
export function clampChars(text: string, max: number = WALLET_TEXT_MAX): string {
  const chars = Array.from(text);

  return chars.length <= max ? text : chars.slice(0, max).join("");
}
