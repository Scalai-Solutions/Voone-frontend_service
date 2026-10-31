import type { ProgramComparison } from "@/lib/onboarding-api";
import { formatEuros } from "../../../lib/euros.ts";

/**
 * Words and numbers for the 5-year comparison with the recommended plan. Pure, so the sentence,
 * the tone and the table rows are tested without a screen.
 *
 * Money is shown as whole es-ES euros. No individual gift's cost or value is anywhere in here:
 * the backend sends yearly totals only.
 */

export type ComparisonKind = "more" | "less" | "same";

/** "Same" is judged on the euros shown, so "0 € less" is never printed. */
export const deltaKind = (delta: number): ComparisonKind => {
  const rounded = Math.round(delta);

  return rounded > 0 ? "more" : rounded < 0 ? "less" : "same";
};

/**
 * How the banner is toned. Better than the recommendation reads calm green, worse reads amber
 * (never a red alarm), equal reads neutral, and no recommendation to compare with reads muted.
 */
export type ComparisonTone = "positive" | "negative" | "neutral" | "unavailable";

export const comparisonTone = (
  comparison: Pick<ProgramComparison, "delta" | "recommendedNet5y">,
): ComparisonTone => {
  if (comparison.delta === null || comparison.recommendedNet5y === null) {
    return "unavailable";
  }

  const kind = deltaKind(comparison.delta);

  return kind === "more" ? "positive" : kind === "less" ? "negative" : "neutral";
};

/** "this plan earns 1.200 € less net over 5 years": the money consequence, as a phrase. */
const consequence = (delta: number): string => {
  const kind = deltaKind(delta);

  if (kind === "same") return "the same";

  return `${formatEuros(Math.abs(Math.round(delta)))} ${kind}`;
};

/**
 * The one-sentence headline, or null when there is no recommended plan to compare with (then
 * `comparisonReason` says why).
 */
export const comparisonHeadline = (
  comparison: Pick<ProgramComparison, "delta" | "inputs" | "recommendedNet5y">,
): string | null => {
  if (comparison.delta === null || comparison.recommendedNet5y === null) {
    return null;
  }

  const { clients, ticket } = comparison.inputs;

  return (
    `Compared with our recommended plan, this plan earns ` +
    `${consequence(comparison.delta)} net over 5 years ` +
    `(standard values: ${clients.toLocaleString("es-ES")} clients, ${formatEuros(ticket)} ticket)`
  );
};

/** The backend's explanation for a missing comparison, or null when there is none to show. */
export const comparisonReason = (
  comparison: Pick<ProgramComparison, "reason">,
): string | null => comparison.reason?.trim() || null;

export interface ComparisonRow {
  year: number;
  /** Cumulative net of the recommended plan, or "—" when there is none. */
  recommended: string;
  /** Cumulative net of this plan. */
  thisPlan: string;
}

export const comparisonRows = (
  comparison: Pick<ProgramComparison, "years">,
): ComparisonRow[] =>
  [...comparison.years]
    .sort((a, b) => a.year - b.year)
    .map((row) => ({
      year: row.year,
      recommended:
        row.recommendedCumulative === null
          ? "—"
          : formatEuros(Math.round(row.recommendedCumulative)),
      thisPlan: formatEuros(Math.round(row.currentCumulative)),
    }));
