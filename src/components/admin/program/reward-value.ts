import { formatEuro } from "./format.ts";

/**
 * The reward's retail price as a short label for its milestone row, or null when there is
 * nothing to say: an older backend (no field), the owner's programme (never sent), or a row
 * that is not a reward.
 */
export const rewardValueLabel = (milestone: {
  rewardValueEuro?: number;
}): string | null => {
  const value = milestone.rewardValueEuro;

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return `Reward value ${formatEuro(value)}`;
};

/** Informational notes to show, trimmed, without blanks or repeats. Never part of the blocking review. */
export const infoNotes = (program: { notes?: string[] }): string[] => [
  ...new Set(
    (program.notes ?? []).map((note) => note.trim()).filter(Boolean),
  ),
];
