/**
 * The cosmetics a client bought at the tier discount, marked line by line on the visit form.
 *
 * Marking a line is what lets the member's savings be worked out: the backend takes the tier's
 * share of the product's list price. The list price starts from the centre's price sheet, which
 * is what the product costs before any discount, and reception may correct it.
 */

/** The cosmetics category: the only one a tier discount applies to. */
export const DISCOUNTABLE_CATEGORY = "COS";

export interface DiscountDraft {
  category: string;
  discounted: boolean;
  /** Typed as people in Spain type it ("12,50"), so it is parsed here. */
  listPrice: string;
}

const parseEuro = (value: string): number =>
  Number(value.trim().replace(",", "."));

export const formatListPrice = (priceEuro: number): string =>
  String(priceEuro).replace(".", ",");

/** A line can only be a discounted product while it is a cosmetics line. */
export const canDiscount = (category: string): boolean =>
  category === DISCOUNTABLE_CATEGORY;

/** The list price of a marked line, or null when what was typed is not a price above zero. */
export const listPriceOf = (
  line: Pick<DiscountDraft, "listPrice">,
): number | null => {
  const price = parseEuro(line.listPrice);

  return Number.isFinite(price) && price > 0 ? price : null;
};

export const markedCount = (
  lines: Array<Pick<DiscountDraft, "discounted">>,
): number => lines.filter((line) => line.discounted).length;

/** What is wrong with the marked lines, in words for reception; null when they are fine. */
export const discountProblem = (lines: DiscountDraft[]): string | null => {
  const marked = lines.filter((line) => line.discounted);

  if (marked.some((line) => !canDiscount(line.category))) {
    return "El descuento de nivel solo se aplica a productos de cosmética.";
  }

  if (marked.some((line) => listPriceOf(line) === null)) {
    return "Indica el precio de lista de cada producto con descuento.";
  }

  return null;
};

/**
 * What a line sends for its discount: its list price when marked, nothing otherwise. A line that is
 * not marked never carries a price, whatever was left typed in its box.
 */
export const discountField = (
  line: DiscountDraft,
): { discountedListPriceEuro?: number } => {
  if (!line.discounted) return {};

  const price = listPriceOf(line);

  return price === null ? {} : { discountedListPriceEuro: price };
};
