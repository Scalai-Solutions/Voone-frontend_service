/**
 * Which catalogue rows the "any item from the catalogue" list may offer as a reward.
 *
 * The backend decides (a row needs a price and a category the centre chose, and medical items are
 * never a reward) and says so per row with `giftable`. Filtering here by that flag means the
 * dropdown never offers what the backend would refuse, without repeating the rule. A backend that
 * does not send the flag yet leaves it undefined, and then every row is listed, as before.
 */
export interface MaybeGiftable {
  giftable?: boolean;
}

export const giftableItems = <T extends MaybeGiftable>(rows: T[]): T[] =>
  rows.filter((row) => row.giftable !== false);

/** The note shown under the list about the rows it leaves out, or null when none are left out. */
export const hiddenItemsNote = (rows: MaybeGiftable[]): string | null => {
  const hidden = rows.length - giftableItems(rows).length;

  if (hidden === 0) return null;

  return hidden === 1
    ? "1 artículo no aparece: sin categoría, sin precio o de tipo médico."
    : `${hidden} artículos no aparecen: sin categoría, sin precio o de tipo médico.`;
};
