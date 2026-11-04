import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { offersSwap } from "./swap-offer.ts";

const base = {
  hasReward: true,
  canSwap: true,
  alternatives: 0,
  catalogItems: 0,
};

describe("offersSwap", () => {
  it("is offered on a reward with an alternative or a catalogue item", () => {
    assert.equal(offersSwap({ ...base, alternatives: 2 }), true);
    assert.equal(offersSwap({ ...base, catalogItems: 12 }), true);
  });

  it("is never offered on a perk milestone, even with a catalogue", () => {
    assert.equal(
      offersSwap({ ...base, hasReward: false, catalogItems: 12 }),
      false,
    );
    assert.equal(
      offersSwap({ ...base, hasReward: false, alternatives: 2 }),
      false,
    );
  });

  it("is not offered when the screen cannot swap or there is nothing to swap to", () => {
    assert.equal(
      offersSwap({ ...base, canSwap: false, catalogItems: 12 }),
      false,
    );
    assert.equal(offersSwap(base), false);
  });
});
