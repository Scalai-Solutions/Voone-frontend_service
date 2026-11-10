import type { PerkKey, PerkValues } from "@/lib/onboarding-api";

/**
 * What a centre says each perk is worth to a member. Only these three: the double-points perk is
 * points, not money, so it never counts towards what a member has saved.
 */
export const PERKS: ReadonlyArray<{ key: PerkKey; label: string }> = [
  { key: "diag", label: "Diagnóstico gratis" },
  { key: "mejora", label: "Mejora del tratamiento o 10 minutos extra" },
  { key: "sorpresa", label: "Premio sorpresa" },
];

/** The box's text for a stored value, with a comma: "40" or "25,5"; empty when none is set. */
export const valueToText = (euros: number | null): string =>
  euros === null ? "" : String(euros).replace(".", ",");

/** The euros typed, null when blank, undefined when it is not a valid amount. */
export const textToValue = (text: string): number | null | undefined => {
  if (text.trim() === "") return null;

  const euros = Number(text.trim().replace(",", "."));

  return Number.isFinite(euros) && euros >= 0 && euros <= 10_000
    ? Math.round(euros * 100) / 100
    : undefined;
};

/**
 * What to send: only the perks whose box differs from what is stored, so saving one never rewrites
 * the others. `invalid` names a box that holds something that is not an amount.
 */
export const perkEdits = (
  stored: PerkValues,
  typed: Record<PerkKey, string>,
): { edits: Partial<PerkValues>; invalid: PerkKey | null } => {
  const edits: Partial<PerkValues> = {};

  for (const { key } of PERKS) {
    const value = textToValue(typed[key]);

    if (value === undefined) return { edits: {}, invalid: key };
    if (value !== stored[key]) edits[key] = value;
  }

  return { edits, invalid: null };
};
