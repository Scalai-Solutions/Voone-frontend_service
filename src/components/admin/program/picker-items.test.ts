import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { catalogPickerItems, selectableCategoryItems } from "./picker-items.ts";

describe("catalogPickerItems", () => {
  it("maps rows to picker items grouped by the category label, retail as Productos", () => {
    const items = catalogPickerItems([
      { externalId: "t1", name: "Masaje", priceEuro: 45, category: "MAS", isProduct: false },
      { externalId: "p1", name: "Crema", priceEuro: 28, category: "COS", isProduct: true },
      { externalId: "x1", name: "Algo", priceEuro: 10, category: null, isProduct: false },
      { externalId: "x2", name: "Sin dato", priceEuro: 12 },
    ]);

    assert.deepEqual(items, [
      { value: "t1", label: "Masaje", priceEuro: 45, group: "Masaje" },
      { value: "p1", label: "Crema", priceEuro: 28, group: "Productos" },
      { value: "x1", label: "Algo", priceEuro: 10, group: "Otros" },
      { value: "x2", label: "Sin dato", priceEuro: 12, group: "Otros" },
    ]);
  });

  it("falls back to Otros for a category it has no label for", () => {
    const [item] = catalogPickerItems([
      { externalId: "z", name: "Z", priceEuro: 1, category: "???", isProduct: false },
    ]);

    assert.equal(item.group, "Otros");
  });
});

describe("selectableCategoryItems", () => {
  it("starts with the empty choice, then the selectable categories, with no group", () => {
    const items = selectableCategoryItems("Sin categoría");

    assert.deepEqual(items[0], { value: "", label: "Sin categoría" });
    assert.equal(items.length, 12);
    assert.deepEqual(items[1], { value: "FAC", label: "Facial de cabina" });
    assert.ok(items.every((item) => item.group === undefined));
    assert.ok(!items.some((item) => item.value === "PEL"));
  });
});
