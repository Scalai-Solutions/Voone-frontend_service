/**
 * A price as typed into a box: "60", "60,5" and "60.5" all mean what they look like.
 *
 * Returns null for anything that is not a non-negative number, so an unfinished row can be told
 * apart from a row with a zero price. A dot is treated as a decimal mark here, unlike in a CSV
 * import: nobody types a thousands separator into a treatment price, and "60.5" is far more
 * likely to mean sixty euros fifty than six thousand and fifty.
 */
export const parsePriceInput = (text: string): number | null => {
  const cleaned = text.replace(/€|eur(os)?/gi, "").replace(/\s+/g, "").replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const value = Number(cleaned);

  return Number.isFinite(value) ? value : null;
};
