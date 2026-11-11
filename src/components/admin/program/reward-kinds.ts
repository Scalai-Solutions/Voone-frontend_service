import { formatEuros } from "../../../lib/euros.ts";
import type { RewardKind } from "../../../lib/onboarding-api.ts";

/**
 * The five things a reward milestone can be, as the "Cambiar" panel offers them, and the checks
 * the panel makes before it asks the backend. The backend decides; these only spare the admin a
 * round trip for what it would refuse anyway, with the same limits. Pure, so it is tested.
 */

export const REWARD_KINDS: ReadonlyArray<{ kind: RewardKind; label: string }> = [
  { kind: "tratamiento", label: "Tratamiento del catálogo" },
  { kind: "producto", label: "Producto del catálogo" },
  { kind: "doble", label: "Puntos dobles" },
  { kind: "sorpresa", label: "Premio sorpresa" },
  { kind: "libre", label: "Texto libre" },
];

/** What a presented reward is. An older backend sends no kind: its rewards are treatments. */
export const rewardKindOf = (reward: { kind?: RewardKind } | undefined): RewardKind =>
  reward?.kind ?? "tratamiento";

/**
 * Whether a catalogue row is a product: the backend calls a reward a product when its items are
 * retail (category COS), and a row marked as a product is always filed there.
 */
export const isProductRow = (row: { isProduct?: boolean; category?: string | null }): boolean =>
  Boolean(row.isProduct) || row.category === "COS";

/** The same limits as the backend's free-text reward. */
export const FREE_REWARD_MAX_NAME = 120;
export const FREE_REWARD_MAX_EURO = 10_000;

const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;

export type FreeReward =
  | { ok: true; name: string; priceEuro: number }
  | { ok: false; problem: string };

/** The free text and its price as typed, or what is wrong with them. "24,5" and "24.50" both read. */
export const parseFreeReward = (name: string, priceText: string): FreeReward => {
  const text = name.trim();

  if (!text) return { ok: false, problem: "Escribe el premio." };
  if (text.length > FREE_REWARD_MAX_NAME) {
    return { ok: false, problem: `El premio puede tener como mucho ${FREE_REWARD_MAX_NAME} caracteres.` };
  }
  if (CONTROL.test(text)) return { ok: false, problem: "El premio contiene caracteres no permitidos." };

  const price = priceText.trim().replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    return { ok: false, problem: "Escribe el precio en euros, con dos decimales como mucho." };
  }

  const priceEuro = Number(price);

  if (!(priceEuro > 0)) return { ok: false, problem: "El precio tiene que ser mayor que 0." };
  if (priceEuro > FREE_REWARD_MAX_EURO) {
    return { ok: false, problem: `El precio puede ser como mucho ${formatEuros(FREE_REWARD_MAX_EURO)}.` };
  }

  return { ok: true, name: text, priceEuro };
};

/** "Entre 120 € y 480 €": the room a reward has between the rows either side of it. */
export const spendRangeLabel = (range: { min: number; max: number }): string =>
  `Entre ${formatEuros(range.min)} y ${formatEuros(range.max)}`;

export type Spend = { ok: true; realSpend: number } | { ok: false; problem: string };

/** The spend as typed, in whole euros, or what is wrong with it. The range is checked when known. */
export const parseSpend = (
  text: string,
  range: { min: number; max: number } | undefined,
): Spend => {
  const value = text.trim();

  if (!/^\d+$/.test(value)) {
    return { ok: false, problem: "Escribe el gasto en euros, sin decimales." };
  }

  const realSpend = Number(value);

  if (realSpend < 1) return { ok: false, problem: "El gasto tiene que ser mayor que 0." };

  if (range && (realSpend < range.min || realSpend > range.max)) {
    return { ok: false, problem: `${spendRangeLabel(range)}.` };
  }

  return { ok: true, realSpend };
};
