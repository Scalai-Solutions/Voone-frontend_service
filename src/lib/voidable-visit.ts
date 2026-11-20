/**
 * Which visit in a member's history reception may still take back.
 *
 * The backend decides for real (within 24 hours of recording, the client's latest visit, nothing
 * used) and says why in Spanish when it refuses. This only decides whether to OFFER the button, so
 * it is deliberately a little generous about time: the history carries a date, not a moment, so
 * "today or yesterday" stands in for the backend's 24 hours.
 */
export interface VisitHistoryRow {
  id: string;
  date: string;
  visitId?: string;
  voided?: boolean;
}

const day = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * The history row to offer "Anular" on: the newest visit not already voided, and only if it is from
 * today or yesterday. History arrives newest first. Null when there is nothing to offer.
 */
export const voidableVisitRowId = (
  history: readonly VisitHistoryRow[],
  now: Date = new Date(),
): string | null => {
  const voided = new Set(history.filter((row) => row.voided).map((row) => row.visitId));
  const newest = history.find((row) => row.visitId && !row.voided && !voided.has(row.visitId));

  if (!newest) return null;

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return newest.date === day(now) || newest.date === day(yesterday) ? newest.id : null;
};
