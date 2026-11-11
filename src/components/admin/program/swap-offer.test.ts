import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { offersSwap } from "./swap-offer.ts";

describe("offersSwap", () => {
  it("is offered on every reward the screen can swap, catalogue or not", () => {
    assert.equal(offersSwap({ hasReward: true, canSwap: true }), true);
  });

  it("is offered on a perk too", () => {
    assert.equal(
      offersSwap({ hasReward: false, hasPerk: true, canSwap: true }),
      true,
    );
  });

  it("is never offered on a tier milestone", () => {
    assert.equal(offersSwap({ hasReward: false, canSwap: true }), false);
  });

  it("is not offered when the screen cannot swap (a live programme)", () => {
    assert.equal(offersSwap({ hasReward: true, canSwap: false }), false);
    assert.equal(
      offersSwap({ hasReward: false, hasPerk: true, canSwap: false }),
      false,
    );
  });
});
