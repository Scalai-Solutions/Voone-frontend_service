import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterItems,
  fold,
  groupsOf,
  highlight,
  type PickerItem,
} from "./picker-search.ts";

const items: PickerItem[] = [
  { value: "a", label: "Depilación láser", priceEuro: 45, group: "Depilación" },
  { value: "b", label: "Masaje relajante", priceEuro: 60, group: "Masaje" },
  { value: "c", label: "Crema hidratante", priceEuro: 145, group: "Productos" },
  { value: "d", label: "Sin precio", priceEuro: null, group: "Masaje" },
];

describe("fold", () => {
  it("lowercases and strips diacritics", () => {
    assert.equal(fold("Depilación"), "depilacion");
    assert.equal(fold("ÁÉÍÓÚ ñ ü"), "aeiou n u");
  });
});

describe("filterItems", () => {
  it("is accent- and case-insensitive on the label", () => {
    assert.deepEqual(
      filterItems(items, "depilacion", null).map((i) => i.value),
      ["a"],
    );
    assert.deepEqual(
      filterItems(items, "DEPIL", null).map((i) => i.value),
      ["a"],
    );
  });

  it("finds by price text", () => {
    // A price matches from its first digit, so "45" does not drag in 145.
    assert.deepEqual(
      filterItems(items, "45", null).map((i) => i.value),
      ["a"],
    );
    assert.deepEqual(
      filterItems(items, "14", null).map((i) => i.value),
      ["c"],
    );
    assert.deepEqual(
      filterItems(items, "45 €", null).map((i) => i.value),
      ["a"],
    );
    assert.deepEqual(
      filterItems(items, "45€", null).map((i) => i.value),
      ["a"],
    );
  });

  it("respects the group", () => {
    assert.deepEqual(
      filterItems(items, "", "Masaje").map((i) => i.value),
      ["b", "d"],
    );
    assert.deepEqual(
      filterItems(items, "relaj", "Productos").map((i) => i.value),
      [],
    );
  });

  it("returns everything for an empty query and no group", () => {
    assert.equal(filterItems(items, "", null).length, items.length);
    assert.equal(filterItems(items, "   ", null).length, items.length);
  });

  it("does not match a price on items without one", () => {
    assert.deepEqual(filterItems(items, "null", null), []);
  });
});

describe("groupsOf", () => {
  it("is empty for none or a single group", () => {
    assert.deepEqual(groupsOf([{ value: "x", label: "X" }]), []);
    assert.deepEqual(
      groupsOf([
        { value: "x", label: "X", group: "G" },
        { value: "y", label: "Y", group: "G" },
      ]),
      [],
    );
  });

  it("lists distinct groups in first-seen order", () => {
    assert.deepEqual(groupsOf(items), ["Depilación", "Masaje", "Productos"]);
  });
});

describe("highlight", () => {
  it("splits at the match and keeps the original text", () => {
    assert.deepEqual(highlight("Masaje relajante", "mas"), [
      { text: "Mas", match: true },
      { text: "aje relajante", match: false },
    ]);
  });

  it("matches without accents but keeps the accented characters", () => {
    assert.deepEqual(highlight("Masaje relájante", "relajante"), [
      { text: "Masaje ", match: false },
      { text: "relájante", match: true },
    ]);
    assert.deepEqual(highlight("Depilación láser", "depilacion"), [
      { text: "Depilación", match: true },
      { text: " láser", match: false },
    ]);
  });

  it("returns one plain segment for an empty or missing query", () => {
    assert.deepEqual(highlight("Masaje", ""), [{ text: "Masaje", match: false }]);
    assert.deepEqual(highlight("Masaje", "zzz"), [{ text: "Masaje", match: false }]);
  });
});
