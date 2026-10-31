/**
 * The one way the app writes an amount of euros, on the owner dashboard and the admin portal
 * alike: es-ES, symbol after the number, a no-break space between them so the amount never wraps
 * ("65 €", "60,50 €", "15.000 €").
 *
 * Whole amounts drop the decimals, as a price tag would; anything fractional shows two.
 *
 * es-ES (CLDR) only groups thousands from five digits: "1500 €" but "15.000 €". That is the
 * standard Spanish orthography (RAE: a four-digit number is written without a separator) and is
 * kept on purpose, not worked around, so every screen agrees with what Intl gives everywhere
 * else (formatPoints, counts and the admin figures all use the same locale).
 *
 * Exact-cents amounts held in cents (billing figures) go through formatCents in money.ts, which
 * always shows two decimals.
 */
const wholeEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroAndCents = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 65 -> "65 €"; 60.5 -> "60,50 €"; 15000 -> "15.000 €". */
export const formatEuros = (euros: number): string =>
  Number.isInteger(euros) ? wholeEuros.format(euros) : euroAndCents.format(euros);

/**
 * Progress is counted in euros, so it reads like money without being any: rounded to whole
 * euros, since a client's progress towards a reward is never shown in cents.
 */
export const formatProgress = (value: number): string => formatEuros(Math.round(value));
