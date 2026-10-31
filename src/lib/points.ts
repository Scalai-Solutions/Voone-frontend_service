/**
 * The unit a client sees. The loyalty engine keeps progress in euros; what a client or staff
 * member reads as "points" is that progress times this constant (one euro, ten points).
 *
 * Must match the backend's POINTS_PER_EURO in
 * Voone-backend_service/src/modules/onboarding/runtime/points-unit.ts. This is the one copy in
 * the frontend.
 */
export const POINTS_PER_EURO = 10;

export const toPoints = (progress: number): number => Math.round(progress * POINTS_PER_EURO);

const pointsFormat = new Intl.NumberFormat("es-ES");

/** A points value for display, always in es-ES ("15.000"), never the runtime's default locale. */
export const formatPoints = (points: number): string => pointsFormat.format(points);

const eurosFormat = new Intl.NumberFormat("en-US");

/**
 * A whole-euros amount in the app's money style (dot decimals, comma thousands), with the euro
 * sign after a plain space ("1,500 €") — the same style formatCents gives, shared by every
 * euro figure a screen shows.
 */
export const formatEuros = (euros: number): string => `${eurosFormat.format(euros)} €`;

/**
 * A points movement with an explicit sign: "+150" for a credit, "−50" (a real minus sign, not a
 * hyphen) for a debit, "0" for nothing.
 */
export const formatSignedPoints = (points: number): string => {
  if (points > 0) return `+${formatPoints(points)}`;
  if (points < 0) return `−${formatPoints(Math.abs(points))}`;

  return formatPoints(0);
};
