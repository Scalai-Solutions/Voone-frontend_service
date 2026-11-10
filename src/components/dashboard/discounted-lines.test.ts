import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canDiscount,
  discountField,
  discountProblem,
  formatListPrice,
  listPriceOf,
  markedCount,
} from "./discounted-lines.ts";

const line = (over: Partial<Parameters<typeof discountField>[0]> = {}) => ({
  category: "COS",
  discounted: true,
  listPrice: "100",
  ...over,
});

describe("discounted cosmetics on a visit", () => {
  it("only a cosmetics line can be marked", () => {
    assert.equal(canDiscount("COS"), true);
    assert.equal(canDiscount("FAC"), false);
    assert.equal(canDiscount(""), false);
  });

  it("reads a list price the way people in Spain type it", () => {
    assert.equal(listPriceOf({ listPrice: "12,50" }), 12.5);
    assert.equal(listPriceOf({ listPrice: " 12.5 " }), 12.5);
    assert.equal(listPriceOf({ listPrice: "" }), null);
    assert.equal(listPriceOf({ listPrice: "0" }), null);
    assert.equal(listPriceOf({ listPrice: "abc" }), null);
  });

  it("starts the box from the price sheet, with a comma", () => {
    assert.equal(formatListPrice(32.5), "32,5");
    assert.equal(formatListPrice(30), "30");
  });

  it("sends the list price of a marked line and nothing for the others", () => {
    assert.deepEqual(discountField(line()), { discountedListPriceEuro: 100 });
    assert.deepEqual(discountField(line({ discounted: false })), {});
  });

  it("never sends a price a line was left with after it was unmarked", () => {
    assert.deepEqual(
      discountField(line({ discounted: false, listPrice: "55" })),
      {},
    );
  });

  it("counts the marked lines, which is the one number the allowance and the savings share", () => {
    assert.equal(markedCount([line(), line({ discounted: false }), line()]), 2);
    assert.equal(markedCount([]), 0);
  });

  it("explains a marked line that is not cosmetics, or has no price", () => {
    assert.equal(discountProblem([line()]), null);
    assert.equal(
      discountProblem([line({ discounted: false, listPrice: "" })]),
      null,
    );
    assert.match(
      discountProblem([line({ category: "FAC" })]) ?? "",
      /cosmética/,
    );
    assert.match(
      discountProblem([line({ listPrice: "" })]) ?? "",
      /precio de lista/,
    );
  });
});
