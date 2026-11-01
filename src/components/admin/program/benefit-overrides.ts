import type {
  BenefitLine,
  BenefitOverrideEntry,
  PresentedTier,
} from "@/lib/onboarding-api";

/**
 * Editing and hiding the lines the engine generates for a tier. Pure, so the rules live in one
 * place and are tested without rendering.
 *
 * DISPLAY ONLY: an override changes the sentence clients read, never the multiplier, the
 * discount or any other rule. The backend replaces a line's override as a WHOLE with each entry
 * (an absent field clears that aspect), so every helper below carries the aspect it is not
 * changing forward: hiding an edited line keeps the edit, showing a hidden line keeps the edit,
 * restoring the words of a hidden line keeps it hidden. The limits are the backend's
 * (`benefitOverridesSchema`): 1 to 120 characters once trimmed (the lines the centre adds keep
 * their own 80), no control or invisible characters. The backend stays the authority.
 */

/** The longest an edited generated line may be: the longest line a card carries. */
export const MAX_OVERRIDE_LENGTH = 120;

/** Shown inline before a generated line is edited or hidden. */
export const OVERRIDE_WARNING =
  "Solo cambia el texto que ven tus clientes; el beneficio real no cambia.";

export type LineEdit =
  { ok: true; entry: BenefitOverrideEntry } | { ok: false; error: string };

const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;

/** Zero-width and direction-changing characters: the line would say one thing and show another. */
const INVISIBLE = /[\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/;

/** Why a tier may not lose its last visible line. Also the backend's own message. */
export const LAST_LINE_NOTE = "Cada nivel debe mostrar al menos un beneficio.";

/**
 * Whether `line` is the only one of its tier a client would still read. Hiding or removing it
 * would leave the tier with nothing to show, which the backend refuses.
 */
export const isLastVisible = (
  lines: readonly BenefitLine[],
  line: BenefitLine,
): boolean =>
  !line.hidden && lines.filter((other) => !other.hidden).length === 1;

/** The edit currently on the line, if any, to send again so another change does not drop it. */
const keptText = (line: BenefitLine): string | null =>
  line.edited ? line.text : null;

/** The line's own hidden state, to send again so a text change does not show it. */
const keptHidden = (line: BenefitLine): true | null =>
  line.hidden ? true : null;

/**
 * New words for a generated line. Words equal to the original are sent as `text: null`, never as
 * the original itself: a generated line can be longer than the 80 characters an edit may have,
 * and "the same as before" is no edit.
 */
export const editLineOverride = (line: BenefitLine, text: string): LineEdit => {
  if (line.kind !== "generated") {
    return {
      ok: false,
      error: "Este beneficio lo escribiste tú: edítalo desde su propia lista.",
    };
  }

  const value = text.trim();

  if (!value) return { ok: false, error: "Un beneficio no puede estar vacío." };

  if (value === line.original) {
    return {
      ok: true,
      entry: { key: line.key, text: null, hidden: keptHidden(line) },
    };
  }

  if (value.length > MAX_OVERRIDE_LENGTH) {
    return { ok: false, error: `Máximo ${MAX_OVERRIDE_LENGTH} caracteres.` };
  }

  if (CONTROL.test(value) || INVISIBLE.test(value)) {
    return { ok: false, error: "El texto contiene caracteres no permitidos." };
  }

  return {
    ok: true,
    entry: { key: line.key, text: value, hidden: keptHidden(line) },
  };
};

/** Hides a line from clients, keeping any edit so showing it again returns the edited words. */
export const hideLineOverride = (line: BenefitLine): BenefitOverrideEntry => ({
  key: line.key,
  text: keptText(line),
  hidden: true,
});

/** "Mostrar de nuevo": the line is visible again, with the edit it had. */
export const showLineOverride = (line: BenefitLine): BenefitOverrideEntry => ({
  key: line.key,
  text: keptText(line),
  hidden: null,
});

/** "Restaurar": the engine's words again; a hidden line stays hidden. */
export const restoreLineOverride = (
  line: BenefitLine,
): BenefitOverrideEntry => ({
  key: line.key,
  text: null,
  hidden: keptHidden(line),
});

/** The position in the centre's own list of a `custom:<index>` key, or null for any other. */
export const customIndexOf = (key: string): number | null => {
  const match = /^custom:(\d+)$/.exec(key);

  return match ? Number(match[1]) : null;
};

/**
 * What a tier card lists. From `benefitLines` when the backend sends them (`overridable`); from
 * an older backend only `benefits` arrives, so the card renders as it always did: the last
 * `customBenefits.length` lines are the centre's own and nothing generated can be changed.
 */
export const tierLines = (
  tier: PresentedTier,
): { lines: BenefitLine[]; overridable: boolean } => {
  if (tier.benefitLines) return { lines: tier.benefitLines, overridable: true };

  const firstCustom = tier.benefits.length - tier.customBenefits.length;

  return {
    overridable: false,
    lines: tier.benefits.map((text, index) => {
      const customIndex = index - firstCustom;

      return {
        key: customIndex >= 0 ? `custom:${customIndex}` : `legacy:${index}`,
        text,
        original: text,
        kind: customIndex >= 0 ? "custom" : "generated",
        edited: false,
        hidden: false,
      };
    }),
  };
};
