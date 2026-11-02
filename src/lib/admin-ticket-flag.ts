import { deltaKind } from "../components/admin/program/comparison.ts";
import { formatEuros } from "./euros.ts";

/**
 * What a reward or price ticket would do to the clinic's plan, as the admin sees it: exact
 * figures against two baselines, the LIVE plan (what the flag is computed against) and our
 * RECOMMENDATION. Pure, so the sentence and the table are tested without a screen.
 *
 * The shapes mirror the backend's `GET /v1/admin/change-requests/:id/comparison`. Money is whole
 * euros through `formatEuros`, the same way the plan comparison banner writes it. This is the
 * admin's view only: the owner never gets any of these figures.
 */

export interface AdminTicketCell {
  year: number;
  euros: number;
  /** Relative change, one decimal; null when the baseline is too small to express as a percent. */
  percent: number | null;
}

export interface AdminTicketYear {
  year: number;
  live: number;
  proposed: number;
  recommended: number | null;
  vsLive: AdminTicketCell;
  vsRecommended: AdminTicketCell | null;
}

export interface AdminTicketFlag {
  status: "ok";
  inputs: { clients: number; ticket: number };
  years: AdminTicketYear[];
  reason: string | null;
  /** A REWARD ticket's catalogue item name, so a raw id is never shown. */
  itemName?: string | null;
}

export type TicketComparison =
  | AdminTicketFlag
  | { status: "unpriced"; itemName?: string | null }
  | { status: "none"; reason: string; itemName?: string | null };

const DASH = "—";
const MINUS = "−";
const NBSP = " ";
const UNAVAILABLE = "Comparison unavailable";
const UNPRICED =
  "Free-text reward: nothing to compare. Choose a catalogue item when you create the draft.";

const unavailable = (): TicketComparison => ({ status: "none", reason: UNAVAILABLE });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const finiteOrNull = (value: unknown): value is number | null => value === null || finite(value);

/** Reads one cell, or undefined when it is malformed. */
const readCell = (value: unknown): AdminTicketCell | undefined => {
  if (!isRecord(value)) return undefined;
  if (!finite(value.year) || !finite(value.euros) || !finiteOrNull(value.percent)) return undefined;

  return { year: value.year, euros: value.euros, percent: value.percent };
};

const readYear = (value: unknown): AdminTicketYear | undefined => {
  if (!isRecord(value)) return undefined;

  const { year, live, proposed, recommended } = value;

  if (!finite(year) || !finite(live) || !finite(proposed) || !finiteOrNull(recommended)) {
    return undefined;
  }

  const vsLive = readCell(value.vsLive);

  if (!vsLive) return undefined;

  if (value.vsRecommended === null || value.vsRecommended === undefined) {
    return { year, live, proposed, recommended, vsLive, vsRecommended: null };
  }

  const vsRecommended = readCell(value.vsRecommended);

  return vsRecommended
    ? { year, live, proposed, recommended, vsLive, vsRecommended }
    : undefined;
};

/**
 * The backend's answer, checked. Anything unreadable (not an object, unknown status, a missing
 * or non-finite number, no years) becomes `none` with "Comparison unavailable", so a screen never
 * has to guess at a half-formed flag.
 */
export const parseTicketComparison = (value: unknown): TicketComparison => {
  if (!isRecord(value)) return unavailable();

  const itemName =
    typeof value.itemName === "string" || value.itemName === null
      ? { itemName: value.itemName }
      : {};

  if (value.status === "unpriced") return { status: "unpriced", ...itemName };

  if (value.status === "none") {
    return typeof value.reason === "string"
      ? { status: "none", reason: value.reason, ...itemName }
      : unavailable();
  }

  if (value.status !== "ok") return unavailable();

  const inputs = value.inputs;

  if (!isRecord(inputs) || !finite(inputs.clients) || !finite(inputs.ticket)) {
    return unavailable();
  }

  if (!Array.isArray(value.years) || value.years.length === 0) return unavailable();

  const years = value.years.map(readYear);

  if (years.some((year) => year === undefined)) return unavailable();

  if (value.reason !== null && value.reason !== undefined && typeof value.reason !== "string") {
    return unavailable();
  }

  return {
    status: "ok",
    inputs: { clients: inputs.clients, ticket: inputs.ticket },
    years: years as AdminTicketYear[],
    reason: typeof value.reason === "string" ? value.reason : null,
    ...itemName,
  };
};

const byYear = (years: AdminTicketYear[]): AdminTicketYear[] =>
  [...years].sort((a, b) => a.year - b.year);

/** "1200 € more", "300 € less", or null when the euros shown come to zero. */
const amount = (euros: number): string | null => {
  const kind = deltaKind(euros);

  return kind === "same" ? null : `${formatEuros(Math.abs(Math.round(euros)))} ${kind}`;
};

/**
 * "If applied, this plan earns 1200 € more net over 5 years than the live plan, and 300 € less
 * than our recommendation (standard values: 80 clients, 65 € ticket)". Year 5 (the last year)
 * speaks. With no recommended plan only the live clause appears. "The same" is judged on the
 * euros shown, so "0 € more" is never printed.
 */
export const ticketFlagHeadline = (flag: AdminTicketFlag): string => {
  const final = byYear(flag.years).at(-1);

  if (!final) return "";

  const { clients, ticket } = flag.inputs;
  const values = `(standard values: ${clients.toLocaleString("es-ES")} clients, ${formatEuros(ticket)} ticket)`;
  const vsLive = amount(final.vsLive.euros);
  const live = vsLive
    ? `${vsLive} net over 5 years than the live plan`
    : "the same net over 5 years as the live plan";
  const vsRecommended = final.vsRecommended ? amount(final.vsRecommended.euros) : null;
  const recommended = final.vsRecommended
    ? `, and ${vsRecommended ? `${vsRecommended} than` : "the same as"} our recommendation`
    : "";

  return `If applied, this plan earns ${live}${recommended} ${values}`;
};

const signed = (value: number, text: string): string =>
  value > 0 ? `+${text}` : value < 0 ? `${MINUS}${text}` : text;

const cellText = (cell: AdminTicketCell | null): string => {
  if (!cell) return DASH;

  const euros = Math.round(cell.euros);
  const money = signed(euros, formatEuros(Math.abs(euros)));

  if (cell.percent === null) return money;

  const percent = signed(cell.percent, `${Math.abs(cell.percent).toFixed(1)}${NBSP}%`);

  return `${money} (${percent})`;
};

export interface TicketFlagRow {
  year: number;
  live: string;
  proposed: string;
  vsLive: string;
  vsRecommended: string;
}

/** The "See by year" table: cumulative net of the live plan and of this change, and both deltas. */
export const ticketFlagRows = (flag: AdminTicketFlag): TicketFlagRow[] =>
  byYear(flag.years).map((row) => ({
    year: row.year,
    live: formatEuros(Math.round(row.live)),
    proposed: formatEuros(Math.round(row.proposed)),
    vsLive: cellText(row.vsLive),
    vsRecommended: cellText(row.vsRecommended),
  }));

/** Why there is no comparison to show, or null when there is one. */
export const ticketFlagUnavailable = (flag: TicketComparison): string | null => {
  if (flag.status === "ok") return null;
  if (flag.status === "unpriced") return UNPRICED;

  return flag.reason.trim() || UNAVAILABLE;
};
