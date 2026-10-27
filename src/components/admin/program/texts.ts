import type { TextEdits } from "@/lib/onboarding-api";

/**
 * Building the PATCH body for editing a draft's texts. Pure, so the rules live in one place and
 * are tested without rendering. The limits are the backend's (`textsSchema`): texts trimmed to
 * 1..120 characters (a perk's description up to 200) with no control characters. The backend
 * stays the authority; this only spares a round trip for the obvious cases.
 */
export const MAX_TEXT_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 200;

export type TextsPayload =
  | { ok: true; edits: TextEdits }
  | { ok: false; error: string };

export type TextCheck =
  | { ok: true; value: string }
  | { ok: false; error: string };

const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;

/** The trimmed text, or why it cannot be saved. Length is measured after trimming. */
export const checkText = (text: string, max: number): TextCheck => {
  const value = text.trim();

  if (!value) return { ok: false, error: "El texto no puede estar vacío." };
  if (value.length > max) {
    return { ok: false, error: `Máximo ${max} caracteres.` };
  }
  if (CONTROL.test(value)) {
    return { ok: false, error: "El texto contiene caracteres no permitidos." };
  }

  return { ok: true, value };
};

const isPosition = (n: number): boolean => Number.isInteger(n) && n >= 0;
const isMilestone = (n: number): boolean => Number.isInteger(n) && n >= 1;

/** `index` is the 0-based position in `program.referrals`, not the referral's `n`. */
export const referralTextEdit = (index: number, name: string): TextsPayload => {
  if (!isPosition(index)) {
    return { ok: false, error: "No se ha encontrado el premio por referido." };
  }

  const checked = checkText(name, MAX_TEXT_LENGTH);

  return checked.ok
    ? { ok: true, edits: { referral: [{ index, name: checked.value }] } }
    : checked;
};

/** `milestone` is the ladder number `n` of the `ventaja` row. */
export const perkNameEdit = (milestone: number, name: string): TextsPayload => {
  if (!isMilestone(milestone)) {
    return { ok: false, error: "No se ha encontrado la ventaja." };
  }

  const checked = checkText(name, MAX_TEXT_LENGTH);

  return checked.ok
    ? { ok: true, edits: { perks: [{ milestone, name: checked.value }] } }
    : checked;
};

export const perkDescriptionEdit = (
  milestone: number,
  description: string,
): TextsPayload => {
  if (!isMilestone(milestone)) {
    return { ok: false, error: "No se ha encontrado la ventaja." };
  }

  const checked = checkText(description, MAX_DESCRIPTION_LENGTH);

  return checked.ok
    ? { ok: true, edits: { perks: [{ milestone, desc: checked.value }] } }
    : checked;
};

/** `milestone` is the ladder number `n` of the `premio` row. `null` restores the original name. */
export const rewardLabelEdit = (
  milestone: number,
  label: string | null,
): TextsPayload => {
  if (!isMilestone(milestone)) {
    return { ok: false, error: "No se ha encontrado el premio." };
  }

  if (label === null) {
    return { ok: true, edits: { rewards: [{ milestone, label: null }] } };
  }

  const checked = checkText(label, MAX_TEXT_LENGTH);

  return checked.ok
    ? { ok: true, edits: { rewards: [{ milestone, label: checked.value }] } }
    : checked;
};

/** The reward after Diamante. `null` restores the original name. */
export const recurringLabelEdit = (label: string | null): TextsPayload => {
  if (label === null) {
    return { ok: true, edits: { recurring: { label: null } } };
  }

  const checked = checkText(label, MAX_TEXT_LENGTH);

  return checked.ok
    ? { ok: true, edits: { recurring: { label: checked.value } } }
    : checked;
};
