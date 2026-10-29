/**
 * Whether the next payment of a member earns double points, as the backend reports it on
 * `GET .../members/:id/rewards`.
 *
 * "perk" is a waiting double-points advantage (it lapses at `until`); "referral" is the first
 * visit of a client who joined through a recommendation (it does not lapse).
 */
export type DoubleReason = "perk" | "referral";

export interface DoublePoints {
  applies: boolean;
  reason: DoubleReason | null;
  /** When the waiting perk lapses (ISO); null for a referral or when nothing applies. */
  until: string | null;
}

export const NO_DOUBLE_POINTS: DoublePoints = { applies: false, reason: null, until: null };

/**
 * Reads the `doublePoints` field of a rewards answer. A backend that predates the field sends
 * none, and a malformed one is not trusted: both mean "nothing applies", so the visit form
 * behaves exactly as it did before.
 */
export const normalizeDoublePoints = (raw: unknown): DoublePoints => {
  if (typeof raw !== "object" || raw === null) return NO_DOUBLE_POINTS;

  const { applies, reason, until } = raw as Record<string, unknown>;

  if (applies !== true) return NO_DOUBLE_POINTS;

  return {
    applies: true,
    reason: reason === "perk" || reason === "referral" ? reason : null,
    until: typeof until === "string" ? until : null,
  };
};
