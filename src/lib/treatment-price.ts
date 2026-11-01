export type PriceResult = { value: number } | { error: string };

/**
 * Reads a price as typed. Accepts "60", "60,5" and "60.50". A dot followed by exactly three
 * digits is Spanish thousands grouping ("1.500" is 1500, "1.234,50" is 1234.5). The result is a
 * number, which is what the API wants. Centres on the catalogue may use cents; the others only
 * whole euros.
 */
export function parsePrice(raw: string, allowCents: boolean): PriceResult {
  let text = raw.replace(/[\s€]/g, "");

  if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(text))
    text = text.replace(/\./g, "");

  if (!text) return { error: "Indica el precio." };
  if (!/^\d+([.,]\d+)?$/.test(text))
    return { error: "El precio debe ser un número, por ejemplo 60 o 60,50." };

  const value = Number(text.replace(",", "."));

  if (!Number.isFinite(value))
    return { error: "El precio debe ser un número, por ejemplo 60 o 60,50." };
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
    return { error: "El precio admite como máximo dos decimales." };
  }
  if (!allowCents && !Number.isInteger(value)) {
    return { error: "El precio debe ser en euros enteros, sin céntimos." };
  }

  return { value };
}

/** A price back into the field's own style: "60,5". Empty for a missing price. */
export const priceToText = (price: number | null): string =>
  price === null ? "" : String(price).replace(".", ",");
