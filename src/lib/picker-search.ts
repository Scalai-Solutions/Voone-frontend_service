/**
 * The pure half of the search picker (src/components/ui/search-picker.tsx): folding, filtering,
 * grouping and highlighting. No React, no `@/` imports, so `node --test` runs it.
 */

export interface PickerItem {
  value: string;
  label: string;
  priceEuro?: number | null;
  /** Chip the item belongs to (a category label, "Productos"...). */
  group?: string;
  /** Second line under the label. Searched along with it. */
  hint?: string;
}

export interface Segment {
  text: string;
  match: boolean;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lowercase and strip diacritics: "Depilación" -> "depilacion". */
export const fold = (s: string): string =>
  s.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();

/** What a typed price is compared with: no spaces, no euro sign, "," read as ".". */
const priceQuery = (query: string): string =>
  fold(query).replace(/[\s€]/g, "").replace(",", ".");

/** The spellings a price can be typed in: "45", "45.00" ("45,00" once "," is read as "."). */
const priceSpellings = (priceEuro: number): string[] => [
  String(priceEuro),
  priceEuro.toFixed(2),
];

const matchesPrice = (item: PickerItem, query: string): boolean => {
  if (item.priceEuro == null || !Number.isFinite(item.priceEuro)) return false;

  const typed = priceQuery(query);

  if (!/^\d/.test(typed)) return false;

  return priceSpellings(item.priceEuro).some((spelling) => spelling.startsWith(typed));
};

/**
 * Items whose label (or hint) contains the query, accent- and case-insensitively, or whose price
 * starts with it ("45", "45 €"). `group` null means every group; an empty query matches all.
 */
export const filterItems = (
  items: PickerItem[],
  query: string,
  group: string | null,
): PickerItem[] => {
  const needle = fold(query.trim());

  return items.filter((item) => {
    if (group !== null && item.group !== group) return false;
    if (!needle) return true;

    return (
      fold(`${item.label} ${item.hint ?? ""}`).includes(needle) || matchesPrice(item, query)
    );
  });
};

/** Distinct groups in first-seen order; none when there are fewer than two (a lone chip filters nothing). */
export const groupsOf = (items: PickerItem[]): string[] => {
  const seen: string[] = [];

  for (const item of items) {
    if (item.group && !seen.includes(item.group)) seen.push(item.group);
  }

  return seen.length >= 2 ? seen : [];
};

/**
 * Splits `label` around the first accent-insensitive occurrence of `query`, keeping the original
 * characters. No query or no match gives the label as one plain segment.
 */
export const highlight = (label: string, query: string): Segment[] => {
  const needle = fold(query.trim());

  if (!needle) return [{ text: label, match: false }];

  // Fold one character at a time so every folded index maps back to an original index.
  const owner: number[] = [];
  let folded = "";
  let originalIndex = 0;

  for (const char of label) {
    const piece = fold(char);

    for (let i = 0; i < piece.length; i += 1) owner.push(originalIndex);
    folded += piece;
    originalIndex += char.length;
  }

  const at = folded.indexOf(needle);

  if (at === -1) return [{ text: label, match: false }];

  const start = owner[at];
  const lastOwner = owner[at + needle.length - 1];
  // The match ends after the whole original character that holds its last folded character.
  const end = lastOwner + (String.fromCodePoint(label.codePointAt(lastOwner) ?? 0).length || 1);
  const segments: Segment[] = [];

  if (start > 0) segments.push({ text: label.slice(0, start), match: false });
  segments.push({ text: label.slice(start, end), match: true });
  if (end < label.length) segments.push({ text: label.slice(end), match: false });

  return segments;
};
