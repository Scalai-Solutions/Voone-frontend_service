import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterItems,
  fold,
  groupsOf,
  highlight,
  initialActiveValue,
  moveActive,
  settleActive,
  shouldLeavePanel,
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

describe("highlight with unusual text", () => {
  const joined = (label: string, query: string) =>
    highlight(label, query)
      .map((segment) => segment.text)
      .join("");

  it("keeps a combining mark attached to the highlighted letter (NFD label)", () => {
    const nfd = "Depilacio\u0301n laser";

    assert.deepEqual(highlight(nfd, "depilacio"), [
      { text: "Depilacio\u0301", match: true },
      { text: "n laser", match: false },
    ]);
    assert.deepEqual(highlight(nfd, "depilacion"), [
      { text: "Depilacio\u0301n", match: true },
      { text: " laser", match: false },
    ]);
  });

  it("does not throw on ß or a ligature and keeps the original text intact", () => {
    for (const [label, query] of [
      ["Straße", "stra"],
      ["Straße", "ße"],
      ["Oﬁcina ﬁna", "fi"],
      ["Oﬁcina ﬁna", "ﬁn"],
      ["İstanbul", "ist"],
    ]) {
      assert.equal(joined(label, query), label);
    }
  });
});

describe("initialActiveValue", () => {
  const list: PickerItem[] = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ];

  it("highlights nothing when the value is empty and no item has an empty value", () => {
    assert.equal(initialActiveValue(list, ""), null);
  });

  it("highlights the chosen item", () => {
    assert.equal(initialActiveValue(list, "b"), "b");
  });

  it("highlights an item whose own value is empty when that is the current choice", () => {
    assert.equal(
      initialActiveValue([{ value: "", label: "Sin categoría" }, ...list], ""),
      "",
    );
  });

  it("highlights nothing for a value that is not in the list", () => {
    assert.equal(initialActiveValue(list, "zzz"), null);
  });
});

describe("moveActive", () => {
  const list: PickerItem[] = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
  ];

  it("goes to the first row on ArrowDown from nothing, the last on ArrowUp", () => {
    assert.equal(moveActive(list, null, 1), "a");
    assert.equal(moveActive(list, null, -1), "c");
  });

  it("wraps at both ends", () => {
    assert.equal(moveActive(list, "c", 1), "a");
    assert.equal(moveActive(list, "a", -1), "c");
    assert.equal(moveActive(list, "a", 1), "b");
  });

  it("treats a highlight that left the list as nothing, and an empty list as nothing", () => {
    assert.equal(moveActive(list, "gone", 1), "a");
    assert.equal(moveActive([], null, 1), null);
  });
});

describe("settleActive", () => {
  const list: PickerItem[] = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ];

  it("keeps a highlight that is still listed", () => {
    assert.equal(settleActive(list, "b", ""), "b");
  });

  it("falls to the first match when the user is typing", () => {
    assert.equal(settleActive(list, "gone", "a"), "a");
  });

  it("falls to nothing when the list changed without a query", () => {
    assert.equal(settleActive(list, "gone", ""), null);
    assert.equal(settleActive([], "gone", "zz"), null);
  });
});

describe("shouldLeavePanel", () => {
  it("Tab on the last control and Shift+Tab on the first leave the panel", () => {
    assert.equal(shouldLeavePanel("Tab", false, 4, 5), true);
    assert.equal(shouldLeavePanel("Tab", true, 0, 5), true);
  });

  it("anything else stays inside", () => {
    assert.equal(shouldLeavePanel("Tab", false, 0, 5), false);
    assert.equal(shouldLeavePanel("Tab", false, 3, 5), false);
    assert.equal(shouldLeavePanel("Tab", true, 4, 5), false);
    assert.equal(shouldLeavePanel("Tab", true, 2, 5), false);
    assert.equal(shouldLeavePanel("Enter", false, 4, 5), false);
    assert.equal(shouldLeavePanel("ArrowDown", true, 0, 5), false);
  });

  it("a single control is both first and last", () => {
    assert.equal(shouldLeavePanel("Tab", false, 0, 1), true);
    assert.equal(shouldLeavePanel("Tab", true, 0, 1), true);
  });

  it("focus outside the list of controls, or an empty list, never leaves", () => {
    assert.equal(shouldLeavePanel("Tab", false, -1, 5), false);
    assert.equal(shouldLeavePanel("Tab", true, -1, 5), false);
    assert.equal(shouldLeavePanel("Tab", false, 0, 0), false);
  });
});
