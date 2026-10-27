/** The backend caps the wallet "Beneficios" and "Información" texts at this many characters. */
export const WALLET_TEXT_MAX = 500;

/** Amber warning starts here. */
export const WALLET_TEXT_WARN_AT = 450;

export const WALLET_TEXT_MAX_MESSAGE = `Máximo ${WALLET_TEXT_MAX} caracteres`;

/**
 * Counts characters the way the backend does: UTF-16 units (`string.length`), because the card
 * schema's max(500) counts them that way. An emoji therefore counts as two here and in the API.
 */
export function countChars(text: string): number {
  return text.length;
}

/** Cuts text to at most `max` UTF-16 units without splitting a surrogate pair. */
export function clampChars(text: string, max: number = WALLET_TEXT_MAX): string {
  if (text.length <= max) return text;

  const last = text.charCodeAt(max - 1);
  const cut = last >= 0xd800 && last <= 0xdbff ? max - 1 : max;

  return text.slice(0, cut);
}
