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

const dayMonth = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  day: "numeric",
  month: "short",
});

export interface DoubleDescription {
  /** What reception is told about this visit; null when nothing applies. */
  text: string | null;
  /** True while the manual x2/x3/x5/x10 slider must stay off: a double already applies. */
  sliderDisabled: boolean;
}

const NOTHING: DoubleDescription = { text: null, sliderDisabled: false };

/**
 * What the visit form says about double points, and whether the manual slider is locked.
 *
 * A perk whose `until` has passed no longer applies (the answer may be older than the page), so
 * it reads as nothing: the backend honours a perk only while expiresAt is after the visit. A perk
 * without a usable date still applies, just without naming one.
 */
export const describeDouble = (doublePoints: DoublePoints, now: Date): DoubleDescription => {
  if (!doublePoints.applies) return NOTHING;

  const until = doublePoints.until === null ? null : new Date(doublePoints.until);
  const lapse = until !== null && !Number.isNaN(until.getTime()) ? until : null;

  if (lapse !== null && lapse.getTime() <= now.getTime()) return NOTHING;

  const base = "Esta visita suma el doble de puntos";

  if (doublePoints.reason === "referral") {
    return { text: `${base}: primera visita por recomendación`, sliderDisabled: true };
  }

  if (doublePoints.reason === "perk" && lapse !== null) {
    return {
      text: `${base} (ventaja hasta el ${dayMonth.format(lapse)})`,
      sliderDisabled: true,
    };
  }

  return { text: base, sliderDisabled: true };
};
