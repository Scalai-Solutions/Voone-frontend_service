/**
 * The owner's "what would this change do to my plan" flag, as pure functions: the shape the
 * backend answers (mirrors `OwnerFlag` in Voone-backend change-flag-present.ts), a parser that
 * keeps only that shape, and the Spanish copy for the signal, the marks and their tooltips.
 *
 * Pure on purpose: no framework, no alias imports, so `npm test` covers it. The parser is the
 * last gate before the screen: whatever the network carried, only status, signal, marks, euros
 * rounded to 100, percents rounded to 5 and `over20` can come out, and a payload that does not
 * fit is "no flag", never a half-drawn one.
 */

export type Mark = "up" | "same" | "down";
export type Signal = "good" | "costs-more" | "similar";
export type Baseline = "current" | "recommended";

export interface OwnerCell {
  year: number;
  mark: Mark;
  /** Signed, rounded to the nearest 100 (negative = worse). Null on a `same` cell. */
  euros: number | null;
  /** Rounded to the nearest 5; null on a `same` cell or when the baseline is too small. */
  percent: number | null;
  over20: boolean;
}

export type OwnerFlag =
  | {
      status: "ok";
      signal: Signal;
      vsCurrent: OwnerCell[];
      vsRecommended: OwnerCell[] | null;
      fiveYearEuros: number | null;
    }
  | { status: "unpriced" }
  | { status: "none" };

export const UNPRICED_LABEL = "Sin valorar";
export const UNPRICED_BODY =
  "Voone la valorará al revisar tu solicitud. No hay comparación todavía.";
export const FLAG_FOOTNOTE = "Estimación con valores estándar, redondeada a 100 €";

const NONE: OwnerFlag = { status: "none" };
const MAX_YEARS = 10;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isMark = (value: unknown): value is Mark =>
  value === "up" || value === "same" || value === "down";

const isSignal = (value: unknown): value is Signal =>
  value === "good" || value === "costs-more" || value === "similar";

const finiteOrNull = (value: unknown): number | null | undefined =>
  value === null ? null : typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Round half away from zero (the backend's rule), never returning negative zero. */
const roundTo = (value: number, step: number): number => {
  const rounded = Math.sign(value) * Math.round(Math.abs(value) / step) * step;

  return rounded === 0 ? 0 : rounded;
};

/** One cell with exactly the five keys it has, or null when the input is not a cell. */
const readCell = (raw: unknown): OwnerCell | null => {
  if (!isRecord(raw)) return null;

  const { year, mark, over20 } = raw;
  const euros = finiteOrNull(raw.euros);
  const percent = finiteOrNull(raw.percent);

  if (
    typeof year !== "number" ||
    !Number.isInteger(year) ||
    year < 1 ||
    !isMark(mark) ||
    typeof over20 !== "boolean" ||
    euros === undefined ||
    percent === undefined
  ) {
    return null;
  }

  const same: OwnerCell = { year, mark: "same", euros: null, percent: null, over20: false };

  // A `same` cell has nothing to say in numbers, whatever was sent.
  if (mark === "same") return same;

  // The screen promises rounded figures only: round again (idempotent on what the backend sends).
  // A cell whose euros round to 0 is `same`, exactly the backend's rule.
  const roundedEuros = euros === null ? null : roundTo(euros, 100);

  if (roundedEuros === 0) return same;

  return {
    year,
    mark,
    euros: roundedEuros,
    percent: percent === null ? null : roundTo(percent, 5),
    over20,
  };
};

const readCells = (raw: unknown): OwnerCell[] | null => {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_YEARS) return null;

  const cells: OwnerCell[] = [];

  for (const item of raw) {
    const cell = readCell(item);

    if (!cell) return null;

    cells.push(cell);
  }

  return cells;
};

/** Whatever the proxy returned, as an `OwnerFlag`: anything unexpected is `{ status: "none" }`. */
export const parseOwnerFlag = (json: unknown): OwnerFlag => {
  if (!isRecord(json)) return NONE;

  if (json.status === "unpriced") return { status: "unpriced" };
  if (json.status !== "ok") return NONE;

  const vsCurrent = readCells(json.vsCurrent);
  const fiveYearEuros = finiteOrNull(json.fiveYearEuros ?? null);
  const vsRecommended =
    json.vsRecommended === undefined || json.vsRecommended === null
      ? null
      : readCells(json.vsRecommended);

  if (
    !isSignal(json.signal) ||
    !vsCurrent ||
    fiveYearEuros === undefined ||
    (json.vsRecommended != null && vsRecommended === null)
  ) {
    return NONE;
  }

  const headline = fiveYearEuros === null ? null : roundTo(fiveYearEuros, 100);

  return {
    status: "ok",
    signal: json.signal,
    vsCurrent,
    vsRecommended,
    fiveYearEuros: headline === 0 ? null : headline,
  };
};

export const signalCopy = (
  signal: Signal,
): { label: string; tone: "good" | "costs-more" | "similar" } => {
  switch (signal) {
    case "good":
      return { label: "Buena opción", tone: "good" };
    case "costs-more":
      return { label: "Te cuesta más", tone: "costs-more" };
    case "similar":
      return { label: "Similar", tone: "similar" };
  }
};

export const markGlyph = (mark: Mark): "▲" | "＝" | "▼" =>
  mark === "up" ? "▲" : mark === "down" ? "▼" : "＝";

/**
 * 1200 -> "1.200 €" with a no-break space, so a tooltip never wraps the symbol onto its own line.
 * Deliberately differs from `formatEuros` (src/lib/euros.ts), which leaves four-digit amounts
 * ungrouped ("1200 €"): the flag always groups thousands.
 */
const euroText = (euros: number): string =>
  `${Math.round(Math.abs(euros))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}\u00a0€`;

const AGAINST: Record<Baseline, string> = {
  current: "tu plan actual",
  recommended: "la recomendación de Voone",
};

/** What a year mark says when hovered or focused, e.g. "Hasta el año 3: unos 1.200 € más (aprox. 10 %)". */
export const cellTip = (cell: OwnerCell, baseline: Baseline): string => {
  const prefix = `Hasta el año ${cell.year}: `;
  const against = AGAINST[baseline];

  if (cell.mark === "same") return `${prefix}prácticamente igual que ${against}`;

  const hasEuros = cell.euros !== null && cell.euros !== 0;

  if (!hasEuros) {
    const word = cell.mark === "up" ? "mejor" : "peor";

    return `${prefix}${cell.over20 ? "más del 20 % " : ""}${word} que ${against}`;
  }

  // Over 20 % the rounded percent is not shown: the tail says only that it is more than that.
  const tail = cell.over20
    ? " (más del 20 %)"
    : cell.percent === null || cell.percent === 0
      ? ""
      : ` (aprox. ${Math.abs(cell.percent)} %)`;
  // The current plan is what the row says; Voone's recommendation has to be named.
  const suffix = baseline === "recommended" ? ` que ${against}` : "";

  return `${prefix}unos ${euroText(cell.euros as number)} ${cell.mark === "up" ? "más" : "menos"}${suffix}${tail}`;
};

/** The headline: "unos 2.400 € más en 5 años que tu plan actual", or null when there is no figure. */
export const fiveYearSentence = (flag: OwnerFlag): string | null => {
  if (flag.status !== "ok" || flag.fiveYearEuros === null || flag.fiveYearEuros === 0) {
    return null;
  }

  return `unos ${euroText(flag.fiveYearEuros)} ${flag.fiveYearEuros > 0 ? "más" : "menos"} en 5 años que tu plan actual`;
};
