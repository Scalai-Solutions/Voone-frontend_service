/**
 * What the admin services editor does with what a person types, kept pure so it can be
 * tested: reading a price, and working out the smallest patch from an edit form.
 */

export type PriceResult = { value: number } | { error: string };

/**
 * Reads a price as typed: "60", "60,5", "60.50", "1.234,50". A dot followed by exactly three
 * digits is a thousands separator ("1.500" is 1500). Centres on the catalogue may use cents;
 * the others only whole euros.
 */
export const parsePriceInput = (
  raw: string,
  allowCents: boolean,
): PriceResult => {
  let text = raw.replace(/[\s€]/g, "");

  if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(text))
    text = text.replace(/\./g, "");

  if (!text) return { error: "Enter the price." };
  if (!/^\d+([.,]\d+)?$/.test(text))
    return { error: "The price must be a number, for example 60 or 60.50." };

  const value = Number(text.replace(",", "."));

  if (!Number.isFinite(value) || value < 0.01)
    return { error: "The price must be at least 0.01." };
  if (value > 100_000) return { error: "The price can be at most 100,000." };
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6)
    return { error: "The price can have at most two decimals." };
  if (!allowCents && !Number.isInteger(value))
    return { error: "This centre prices in whole euros, without cents." };

  return { value };
};

export const priceToText = (price: number | null): string =>
  price === null ? "" : String(price).replace(".", ",");

export interface TreatmentFormValues {
  name: string;
  price: string;
  categoryId: string;
}

export interface TreatmentLike {
  name: string;
  priceEuro: number | null;
  categoryId: string | null;
}

/**
 * Only what changed, so an unchanged price is never rewritten. Returns null when the price
 * typed is not valid (the form shows the error before this is called) and {} for no change.
 */
export const buildTreatmentPatch = (
  treatment: TreatmentLike,
  values: TreatmentFormValues,
  usesCatalogue: boolean,
): { name?: string; priceEuro?: number; categoryId?: string } | null => {
  const patch: { name?: string; priceEuro?: number; categoryId?: string } = {};
  const name = values.name.trim();

  if (name !== treatment.name) patch.name = name;

  if (values.price.trim()) {
    const price = parsePriceInput(values.price, usesCatalogue);

    if ("error" in price) return null;
    if (price.value !== treatment.priceEuro) patch.priceEuro = price.value;
  }

  if (
    usesCatalogue &&
    values.categoryId &&
    values.categoryId !== treatment.categoryId
  ) {
    patch.categoryId = values.categoryId;
  }

  return patch;
};

export interface BonoFormValues {
  name: string;
  /** The whole pack, as typed. */
  price: string;
  sessions: string;
}

export interface BonoLike {
  name: string;
  totalEuro: number;
  totalSessions: number;
}

export const readSessionsInput = (
  raw: string,
): { value: number } | { error: string } => {
  const n = Number(raw.trim());

  return raw.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= 100
    ? { value: n }
    : { error: "A voucher has between 1 and 100 sessions." };
};

/** Same idea for a bono plan; the price compared is the pack total (`totalEuro`). */
export const buildBonoPatch = (
  plan: BonoLike,
  values: BonoFormValues,
): { name?: string; priceEuro?: number; totalSessions?: number } | null => {
  const patch: { name?: string; priceEuro?: number; totalSessions?: number } =
    {};
  const name = values.name.trim();
  const price = parsePriceInput(values.price, true);
  const sessions = readSessionsInput(values.sessions);

  if (!name || "error" in price || "error" in sessions) return null;

  if (name !== plan.name) patch.name = name;
  if (price.value !== plan.totalEuro) patch.priceEuro = price.value;
  if (sessions.value !== plan.totalSessions)
    patch.totalSessions = sessions.value;

  return patch;
};
