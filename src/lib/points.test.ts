import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatPoints, formatSignedPoints, toPoints } from "./points.ts";

describe("formatPoints", () => {
  it("formats with es-ES grouping", () => {
    assert.equal(formatPoints(15000), "15.000");
    assert.equal(formatPoints(150), "150");
    assert.equal(formatPoints(0), "0");
  });
});

describe("formatSignedPoints", () => {
  it("signs credits and debits", () => {
    assert.equal(formatSignedPoints(150), "+150");
    assert.equal(formatSignedPoints(-50), "−50");
    assert.equal(formatSignedPoints(-12000), "−12.000");
    assert.equal(formatSignedPoints(12000), "+12.000");
  });

  it("leaves zero unsigned", () => {
    assert.equal(formatSignedPoints(0), "0");
  });
});

describe("toPoints", () => {
  it("is ten points per euro", () => {
    assert.equal(toPoints(65), 650);
  });
});
