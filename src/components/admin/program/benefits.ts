/**
 * Editing the benefits a centre wrote for a tier. Pure, so the rules live in one place and are
 * tested without rendering. The limits are the backend's (`tierBenefitsSchema`): at most 6 per
 * tier, each 1 to 80 characters once trimmed. The backend stays the authority; this only spares
 * a round trip for the obvious cases.
 */
export const MAX_BENEFITS = 6;
export const MAX_BENEFIT_LENGTH = 80;

export type BenefitEdit =
  | { ok: true; benefits: string[] }
  | { ok: false; error: string };

/** The list with the benefit at `index` replaced by `text`; the input list is not modified. */
export const replaceBenefit = (
  list: readonly string[],
  index: number,
  text: string,
): BenefitEdit => {
  if (!Number.isInteger(index) || index < 0 || index >= list.length) {
    return { ok: false, error: "No se ha encontrado el beneficio." };
  }

  const value = text.trim();

  if (!value) {
    return { ok: false, error: "Un beneficio no puede estar vacío." };
  }

  if (value.length > MAX_BENEFIT_LENGTH) {
    return {
      ok: false,
      error: `Máximo ${MAX_BENEFIT_LENGTH} caracteres.`,
    };
  }

  return {
    ok: true,
    benefits: list.map((current, i) => (i === index ? value : current)),
  };
};
