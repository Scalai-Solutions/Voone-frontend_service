import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatEuros, formatProgress } from "./euros.ts";

// Intl puts a no-break space before the euro sign; normalise so the tests read plainly.
const plain = (text: string) => text.replace(/ /g, " ");

describe("formatEuros", () => {
  it("writes whole euros without decimals", () => {
    assert.equal(plain(formatEuros(65)), "65 €");
    assert.equal(plain(formatEuros(0)), "0 €");
  });

  it("writes fractional amounts with two decimals and a decimal comma", () => {
    assert.equal(plain(formatEuros(60.5)), "60,50 €");
    assert.equal(plain(formatEuros(0.05)), "0,05 €");
  });

  it("groups thousands with a dot from five digits, as es-ES does", () => {
    assert.equal(plain(formatEuros(15000)), "15.000 €");
    assert.equal(plain(formatEuros(1234567)), "1.234.567 €");
  });

  it("leaves four-digit numbers ungrouped (standard es-ES, documented behaviour)", () => {
    assert.equal(plain(formatEuros(1500)), "1500 €");
    assert.equal(plain(formatEuros(9999)), "9999 €");
  });

  it("keeps the amount and the sign on one line", () => {
    assert.ok(formatEuros(65).includes(" €"));
  });

  it("signs negatives", () => {
    assert.equal(plain(formatEuros(-120)), "-120 €");
  });
});

describe("formatProgress", () => {
  it("rounds to whole euros, then formats like any amount", () => {
    assert.equal(plain(formatProgress(1499.6)), "1500 €");
    assert.equal(plain(formatProgress(20000.4)), "20.000 €");
    assert.equal(plain(formatProgress(0)), "0 €");
  });
});
