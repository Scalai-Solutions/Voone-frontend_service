import type {
  PresentedTier,
  TierRules,
  TierRulesChange,
} from "../../../lib/onboarding-api.ts";

/**
 * A tier's edit dialog, without rendering: what it opens with and what it saves. The backend
 * decides; these only spare the admin a round trip with the same limits. Pure, so it is tested.
 *
 * The dialog shows the tier in four categories: the birthday gift, the cosmetics discount and the
 * points multiplier (one REAL value each), and free text (any number of points, display only).
 */

/** The generated lines a real value drives. Every other line of a tier is text only. */
export type RuleKey = "mult" | "discount" | "birthday";

export const isRuleKey = (key: string): key is RuleKey =>
  key === "mult" || key === "discount" || key === "birthday";

/** Same limits as the backend's tierRulesSchema. ×1 and 0% mean "none". */
export const MULT_MAX = 3;
export const DISCOUNT_MAX = 50;
export const MAX_FREE_TEXT = 10;
export const MAX_FREE_TEXT_LENGTH = 120;

type Parsed = { ok: true; value: number } | { ok: false; problem: string };

/** "1,5", "1.5" and "×1,5" all read as ×1.5; "1" means no multiplier. */
export const parseMultiplier = (text: string): Parsed => {
  const value = text
    .trim()
    .replace(/^[×x]\s*/i, "")
    .replace(",", ".");

  if (!/^\d+(\.\d)?$/.test(value)) {
    return {
      ok: false,
      problem:
        "Escribe el multiplicador con un decimal como mucho, p. ej. 1,5.",
    };
  }

  const multiplier = Number(value);

  if (multiplier < 1 || multiplier > MULT_MAX) {
    return {
      ok: false,
      problem: `El multiplicador tiene que estar entre ×1 (sin multiplicador) y ×${MULT_MAX}.`,
    };
  }

  return { ok: true, value: multiplier };
};

/** "10" and "10 %" both read as 10%; "0" means no discount. */
export const parseDiscount = (text: string): Parsed => {
  const value = text.trim().replace(/\s*%$/, "");

  if (!/^\d+$/.test(value)) {
    return {
      ok: false,
      problem: "Escribe el descuento como un porcentaje entero, p. ej. 10.",
    };
  }

  const discountPercent = Number(value);

  if (discountPercent > DISCOUNT_MAX) {
    return {
      ok: false,
      problem: `El descuento puede ser como mucho del ${DISCOUNT_MAX}%.`,
    };
  }

  return { ok: true, value: discountPercent };
};

export interface TierDialogDraft {
  multiplier: string;
  discount: string;
  birthday: TierRules["birthday"];
  /** What clients read today that is text only: the engine's fixed sentences, then the centre's. */
  freeText: string[];
  /** Real lines hidden before typed rules existed: they still applied, the dialog says so. */
  hiddenRules: RuleKey[];
}

/**
 * What the dialog opens with, built from what clients read NOW (visible lines, reworded text
 * included), so saving it unchanged leaves the card saying exactly the same.
 */
export const dialogDraft = (
  tier: PresentedTier,
  rules: TierRules,
): TierDialogDraft => {
  const lines = tier.benefitLines ?? [];

  return {
    multiplier: String(rules.multiplier).replace(".", ","),
    discount: String(rules.discountPercent),
    birthday: rules.birthday,
    freeText: lines
      .filter((line) => !isRuleKey(line.key) && !line.hidden)
      .map((line) => line.text),
    hiddenRules: lines
      .filter((line) => line.hidden)
      .map((line) => line.key)
      .filter(isRuleKey),
  };
};

export type TierSave =
  { ok: true; change: TierRulesChange } | { ok: false; problem: string };

/**
 * The one request the dialog saves. Numbers and the free-text list always travel (the list
 * REPLACES the tier's); the birthday gift only when it was changed (`undefined` = untouched), so
 * a gift the engine chose is never re-priced by opening the dialog.
 */
export const buildTierSave = (input: {
  multiplier: string;
  discount: string;
  freeText: string[];
  birthday?: TierRulesChange["birthday"];
}): TierSave => {
  const multiplier = parseMultiplier(input.multiplier);

  if (!multiplier.ok) return multiplier;

  const discount = parseDiscount(input.discount);

  if (!discount.ok) return discount;

  // An empty row is one the admin added and never filled: dropped, not refused.
  const freeText = input.freeText.map((text) => text.trim()).filter(Boolean);

  if (freeText.length > MAX_FREE_TEXT) {
    return {
      ok: false,
      problem: `Como mucho ${MAX_FREE_TEXT} puntos de texto libre.`,
    };
  }

  if (freeText.some((text) => text.length > MAX_FREE_TEXT_LENGTH)) {
    return {
      ok: false,
      problem: `Cada punto puede tener como mucho ${MAX_FREE_TEXT_LENGTH} caracteres.`,
    };
  }

  return {
    ok: true,
    change: {
      multiplier: multiplier.value,
      discountPercent: discount.value,
      freeText,
      ...(input.birthday !== undefined ? { birthday: input.birthday } : {}),
    },
  };
};
