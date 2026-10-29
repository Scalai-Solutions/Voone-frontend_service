import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NO_DOUBLE_POINTS, normalizeDoublePoints } from "./double-points.ts";

describe("normalizeDoublePoints", () => {
  it("passes a well-formed perk through", () => {
    assert.deepEqual(
      normalizeDoublePoints({ applies: true, reason: "perk", until: "2026-09-12T21:59:59.000Z" }),
      { applies: true, reason: "perk", until: "2026-09-12T21:59:59.000Z" },
    );
  });

  it("passes a referral through", () => {
    assert.deepEqual(normalizeDoublePoints({ applies: true, reason: "referral", until: null }), {
      applies: true,
      reason: "referral",
      until: null,
    });
  });

  it("treats an old backend (field missing) as nothing applying", () => {
    assert.deepEqual(normalizeDoublePoints(undefined), NO_DOUBLE_POINTS);
    assert.deepEqual(normalizeDoublePoints(null), NO_DOUBLE_POINTS);
  });

  it("treats a malformed value as nothing applying", () => {
    assert.deepEqual(normalizeDoublePoints("yes"), NO_DOUBLE_POINTS);
    assert.deepEqual(normalizeDoublePoints({ applies: "true" }), NO_DOUBLE_POINTS);
    assert.deepEqual(normalizeDoublePoints({}), NO_DOUBLE_POINTS);
  });

  it("drops an unknown reason or a non-string until instead of trusting it", () => {
    assert.deepEqual(normalizeDoublePoints({ applies: true, reason: "gift", until: 5 }), {
      applies: true,
      reason: null,
      until: null,
    });
  });

  it("returns the neutral value when applies is false, whatever else came with it", () => {
    assert.deepEqual(
      normalizeDoublePoints({ applies: false, reason: "perk", until: "2026-09-12T00:00:00.000Z" }),
      NO_DOUBLE_POINTS,
    );
  });
});
