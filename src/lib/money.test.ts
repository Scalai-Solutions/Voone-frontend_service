import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MISSING, centsToEuros, formatCents, formatCount, formatSpentEuros } from "./money.ts";

// Intl uses a no-break space before the euro sign; normalise so the tests read plainly.
const plain = (text: string) => text.replace(/ /g, " ");

describe("centsToEuros", () => {
  it("divides by one hundred", () => {
    assert.equal(centsToEuros(12345), 123.45);
    assert.equal(centsToEuros(0), 0);
  });

  it("is null for anything that is not a finite number", () => {
    assert.equal(centsToEuros(undefined), null);
    assert.equal(centsToEuros(null), null);
    assert.equal(centsToEuros(Number.NaN), null);
    assert.equal(centsToEuros(Number.POSITIVE_INFINITY), null);
  });
});

describe("formatCents", () => {
  it("formats euros in es-ES with exact cents", () => {
    assert.equal(plain(formatCents(1234567)), "12.345,67 €");
    assert.equal(plain(formatCents(123450)), "1234,50 €");
    assert.equal(plain(formatCents(50)), "0,50 €");
    assert.equal(plain(formatCents(0)), "0,00 €");
    assert.equal(plain(formatCents(1000)), "10,00 €");
  });

  it("shows a dash, not NaN or 0, when the figure is absent", () => {
    assert.equal(formatCents(undefined), MISSING);
    assert.equal(formatCents(null), MISSING);
    assert.equal(formatCents(Number.NaN), MISSING);
  });
});

describe("formatCount", () => {
  it("groups thousands the es-ES way", () => {
    assert.equal(formatCount(15000), "15.000");
    assert.equal(formatCount(0), "0");
    assert.equal(formatCount(42), "42");
  });

  it("shows a dash when absent", () => {
    assert.equal(formatCount(undefined), MISSING);
    assert.equal(formatCount(null), MISSING);
    assert.equal(formatCount(Number.NaN), MISSING);
  });
});

describe("formatSpentEuros", () => {
  it("shows whole euros in es-ES, like the admin programme page", () => {
    assert.equal(formatSpentEuros(30), "30 €");
    assert.equal(formatSpentEuros(1500), "1500 €");
    assert.equal(formatSpentEuros(12500), "12.500 €");
    assert.equal(formatSpentEuros(0), "0 €");
    assert.equal(formatSpentEuros(29.6), "30 €");
  });

  it("shows a dash when there is no figure", () => {
    assert.equal(formatSpentEuros(undefined), MISSING);
    assert.equal(formatSpentEuros(null), MISSING);
    assert.equal(formatSpentEuros(Number.NaN), MISSING);
  });
});
