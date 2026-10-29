import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { giftableItems, hiddenItemsNote } from "./giftable-items.ts";

const row = (externalId: string, giftable?: boolean) => ({
  externalId,
  name: externalId,
  priceEuro: 10,
  ...(giftable === undefined ? {} : { giftable }),
});

describe("giftableItems", () => {
  it("keeps only the rows the backend marks as giftable", () => {
    const rows = [row("a", true), row("b", false), row("c", true)];

    assert.deepEqual(
      giftableItems(rows).map((r) => r.externalId),
      ["a", "c"],
    );
  });

  it("keeps every row when the backend does not send the flag", () => {
    const rows = [row("a"), row("b"), row("c")];

    assert.deepEqual(giftableItems(rows), rows);
  });

  it("treats a missing flag as giftable and only an explicit false as not", () => {
    const rows = [row("a"), row("b", false), row("c", true)];

    assert.deepEqual(
      giftableItems(rows).map((r) => r.externalId),
      ["a", "c"],
    );
  });

  it("keeps the original order and does not modify the list it was given", () => {
    const rows = [row("z", true), row("y", false), row("x", true)];
    const copy = [...rows];

    assert.deepEqual(
      giftableItems(rows).map((r) => r.externalId),
      ["z", "x"],
    );
    assert.deepEqual(rows, copy);
  });

  it("returns nothing when no row is giftable, and for an empty catalogue", () => {
    assert.deepEqual(giftableItems([row("a", false), row("b", false)]), []);
    assert.deepEqual(giftableItems([]), []);
  });
});

describe("hiddenItemsNote", () => {
  it("counts the rows left out", () => {
    assert.equal(
      hiddenItemsNote([row("a", true), row("b", false), row("c", false)]),
      "2 artículos no aparecen: sin categoría, sin precio o de tipo médico.",
    );
  });

  it("uses the singular for one row", () => {
    assert.equal(
      hiddenItemsNote([row("a", true), row("b", false)]),
      "1 artículo no aparece: sin categoría, sin precio o de tipo médico.",
    );
  });

  it("is null when nothing is left out, including an old backend without the flag", () => {
    assert.equal(hiddenItemsNote([row("a", true), row("b")]), null);
    assert.equal(hiddenItemsNote([row("a"), row("b")]), null);
    assert.equal(hiddenItemsNote([]), null);
  });
});
