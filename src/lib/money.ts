/** What a figure shows when the backend did not send it. Never NaN, never a made-up 0. */
export const MISSING = "—";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const euroFormat = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const countFormat = new Intl.NumberFormat("es-ES");

/** Cents to euros, or null when the figure is absent or not a finite number. */
export const centsToEuros = (cents: number | null | undefined): number | null =>
  isNumber(cents) ? cents / 100 : null;

/**
 * An amount held in cents as es-ES euros ("12.345,67 €"); "—" when absent. es-ES does not group
 * four-digit numbers ("1234,50 €"), as Spanish orthography has it.
 */
export const formatCents = (cents: number | null | undefined): string => {
  const euros = centsToEuros(cents);

  return euros === null ? MISSING : euroFormat.format(euros);
};

/** A whole-number count as es-ES ("15.000"); "—" when absent. */
export const formatCount = (value: number | null | undefined): string =>
  isNumber(value) ? countFormat.format(value) : MISSING;

/**
 * Euros a client has spent, whole and es-ES ("30 €", "1500 €"); "—" when there is no figure.
 * Reads exactly like the admin programme page's "El cliente ha gastado" (`formatProgress`), so
 * the owner and admin views of one `realSpend` never disagree.
 */
export const formatSpentEuros = (euros: number | null | undefined): string =>
  isNumber(euros) ? `${Math.round(euros).toLocaleString("es-ES")} €` : MISSING;
