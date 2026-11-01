import type { Parsed } from "./change-request-parsers.ts";

/**
 * Validation of what the admin services proxy forwards to the backend's treatment and bono
 * routes. Same idea as the ticket parsers: build a fresh object from the known fields only.
 * The backend re-validates (and its Spanish messages still pass through unchanged); this
 * keeps a stray field from riding along on a shared-key call and fails fast on bad shapes.
 */

const ok = <T>(value: T): Parsed<T> => ({ ok: true, value });
const fail = (message: string): { ok: false; message: string } => ({
  ok: false,
  message,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const NAME_MAX = 120;
const PRICE_MIN = 0.01;
const PRICE_MAX = 100_000;

const readName = (value: unknown): Parsed<string> => {
  if (typeof value !== "string" || !value.trim()) return fail("Enter a name.");

  const name = value.trim();

  if (name.length > NAME_MAX)
    return fail(`The name can have up to ${NAME_MAX} characters.`);

  return ok(name);
};

const readPrice = (value: unknown): Parsed<number> => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < PRICE_MIN ||
    value > PRICE_MAX
  ) {
    return fail("The price must be a number between 0.01 and 100,000.");
  }

  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-7)
    return fail("The price can have at most two decimals.");

  return ok(value);
};

const readCategory = (value: unknown): Parsed<string> => {
  if (typeof value !== "string" || !value.trim() || value.length > 32)
    return fail("Choose a category from the list.");

  return ok(value.trim());
};

const readSessions = (value: unknown): Parsed<number> =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 100
    ? ok(value)
    : fail("A voucher has between 1 and 100 sessions.");

const unexpectedKey = (
  body: Record<string, unknown>,
  allowed: readonly string[],
): string | null => {
  const extra = Object.keys(body).find((key) => !allowed.includes(key));

  return extra ? `Unexpected field "${extra}".` : null;
};

export interface TreatmentCreate {
  name: string;
  priceEuro: number;
  categoryId?: string;
}

export const parseTreatmentCreate = (raw: unknown): Parsed<TreatmentCreate> => {
  if (!isRecord(raw)) return fail("Send a JSON object.");

  const extra = unexpectedKey(raw, ["name", "priceEuro", "categoryId"]);
  if (extra) return fail(extra);

  const name = readName(raw.name);
  if (!name.ok) return name;

  const price = readPrice(raw.priceEuro);
  if (!price.ok) return price;

  if (raw.categoryId === undefined || raw.categoryId === null)
    return ok({ name: name.value, priceEuro: price.value });

  const category = readCategory(raw.categoryId);
  if (!category.ok) return category;

  return ok({
    name: name.value,
    priceEuro: price.value,
    categoryId: category.value,
  });
};

export type TreatmentUpdate = Partial<TreatmentCreate>;

export const parseTreatmentUpdate = (raw: unknown): Parsed<TreatmentUpdate> => {
  if (!isRecord(raw)) return fail("Send a JSON object.");

  const extra = unexpectedKey(raw, ["name", "priceEuro", "categoryId"]);
  if (extra) return fail(extra);

  const out: TreatmentUpdate = {};

  if (raw.name !== undefined) {
    const name = readName(raw.name);
    if (!name.ok) return name;
    out.name = name.value;
  }

  if (raw.priceEuro !== undefined) {
    const price = readPrice(raw.priceEuro);
    if (!price.ok) return price;
    out.priceEuro = price.value;
  }

  if (raw.categoryId !== undefined && raw.categoryId !== null) {
    const category = readCategory(raw.categoryId);
    if (!category.ok) return category;
    out.categoryId = category.value;
  }

  if (Object.keys(out).length === 0) return fail("Nothing to change.");

  return ok(out);
};

export interface BonoCreate {
  name: string;
  /** The whole pack, not one session. */
  priceEuro: number;
  totalSessions: number;
}

export const parseBonoCreate = (raw: unknown): Parsed<BonoCreate> => {
  if (!isRecord(raw)) return fail("Send a JSON object.");

  const extra = unexpectedKey(raw, ["name", "priceEuro", "totalSessions"]);
  if (extra) return fail(extra);

  const name = readName(raw.name);
  if (!name.ok) return name;

  const price = readPrice(raw.priceEuro);
  if (!price.ok) return price;

  const sessions = readSessions(raw.totalSessions);
  if (!sessions.ok) return sessions;

  return ok({
    name: name.value,
    priceEuro: price.value,
    totalSessions: sessions.value,
  });
};

export type BonoUpdate = Partial<BonoCreate> & { active?: boolean };

export const parseBonoUpdate = (raw: unknown): Parsed<BonoUpdate> => {
  if (!isRecord(raw)) return fail("Send a JSON object.");

  const extra = unexpectedKey(raw, [
    "name",
    "priceEuro",
    "totalSessions",
    "active",
  ]);
  if (extra) return fail(extra);

  const out: BonoUpdate = {};

  if (raw.name !== undefined) {
    const name = readName(raw.name);
    if (!name.ok) return name;
    out.name = name.value;
  }

  if (raw.priceEuro !== undefined) {
    const price = readPrice(raw.priceEuro);
    if (!price.ok) return price;
    out.priceEuro = price.value;
  }

  if (raw.totalSessions !== undefined) {
    const sessions = readSessions(raw.totalSessions);
    if (!sessions.ok) return sessions;
    out.totalSessions = sessions.value;
  }

  if (raw.active !== undefined) {
    if (typeof raw.active !== "boolean") return fail("Active must be true or false.");
    out.active = raw.active;
  }

  if (Object.keys(out).length === 0) return fail("Nothing to change.");

  return ok(out);
};
