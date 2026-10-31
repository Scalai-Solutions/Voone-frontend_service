/** What a figure shows when the backend did not send it. Never NaN, never a made-up 0. */
export const MISSING = "—";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * The app's money style: a dot for the decimal separator and a comma for thousands, with the
 * euro sign after a space ("75.00 €", "12,345.67 €") — the founders' preference over es-ES
 * orthography ("75,00 €"), which the product decided against. A decimal style rather than
 * `currency` so the suffix is a plain space + €, and so the separator is chosen by locale.
 */
const euroFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const countFormat = new Intl.NumberFormat("es-ES");

/** Cents to euros, or null when the figure is absent or not a finite number. */
export const centsToEuros = (cents: number | null | undefined): number | null =>
  isNumber(cents) ? cents / 100 : null;

/**
 * An amount held in cents as the app shows money everywhere ("12,345.67 €" — dot decimals,
 * comma thousands, euro sign after a space); "—" when absent. See euroFormat for the style.
 */
export const formatCents = (cents: number | null | undefined): string => {
  const euros = centsToEuros(cents);

  return euros === null ? MISSING : `${euroFormat.format(euros)} €`;
};

/** A whole-number count as es-ES ("15.000"); "—" when absent. */
export const formatCount = (value: number | null | undefined): string =>
  isNumber(value) ? countFormat.format(value) : MISSING;
