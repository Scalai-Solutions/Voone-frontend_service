import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeReferralCode } from "./referral-code.ts";

describe("normalizeReferralCode", () => {
  it("trims and uppercases a valid code", () => {
    assert.equal(normalizeReferralCode("  k7m2x "), "K7M2X");
    assert.equal(normalizeReferralCode("AB234"), "AB234");
  });

  it("rejects values that are not five letters or digits", () => {
    for (const bad of ["", "   ", "ABCD", "ABCDEF", "AB CD", "AB-CD", "ÁBCDE", "AB23!"]) {
      assert.equal(normalizeReferralCode(bad), null, JSON.stringify(bad));
    }
  });

  it("rejects non-string input such as a repeated query parameter", () => {
    assert.equal(normalizeReferralCode(undefined), null);
    assert.equal(normalizeReferralCode(["AB234", "CD567"]), null);
    assert.equal(normalizeReferralCode(12345), null);
  });
});
