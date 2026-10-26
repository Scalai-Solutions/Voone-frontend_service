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
