import type { PickerItem } from "../../../lib/picker-search.ts";
import { CATEGORY_LABELS, SELECTABLE_CATEGORIES } from "./categories.ts";

/**
 * The lists the SearchPicker is given, built from the app's own data. Pure, so it is tested.
 */

const PRODUCTS_GROUP = "Productos";
const OTHER_GROUP = "Otros";

interface CatalogRowLike {
  externalId: string;
  name: string;
  priceEuro: number;
  category?: string | null;
  isProduct?: boolean;
}

/**
 * Catalogue rows as picker items: `value` is the externalId, the chip is the category label
 * ("Masaje"), retail items are "Productos", and a row the engine has not classified is "Otros".
 */
export const catalogPickerItems = (rows: CatalogRowLike[]): PickerItem[] =>
  rows.map((row) => ({
    value: row.externalId,
    label: row.name,
    priceEuro: row.priceEuro,
    group: row.isProduct
      ? PRODUCTS_GROUP
      : ((row.category ? (CATEGORY_LABELS as Record<string, string>)[row.category] : undefined) ??
        OTHER_GROUP),
  }));

/** The categories a centre may pick, behind one empty choice ("Sin categoría", "Automática"). No groups. */
export const selectableCategoryItems = (emptyLabel: string): PickerItem[] => [
  { value: "", label: emptyLabel },
  ...SELECTABLE_CATEGORIES.map((code) => ({ value: code, label: CATEGORY_LABELS[code] })),
];
