const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroCents = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 65 -> "65 €"; 60.5 -> "60,50 €". Whole amounts drop the decimals, as a price tag would. */
export const formatEuro = (value: number): string =>
  Number.isInteger(value) ? euro.format(value) : euroCents.format(value);

/** Progress is counted in euros, so it reads like money without being any. */
export const formatProgress = (value: number): string => `${Math.round(value).toLocaleString("es-ES")} €`;

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
