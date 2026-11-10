import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  anyPrizeAnswered,
  choiceToPrize,
  prizeCount,
  prizeField,
  prizeToChoice,
} from "./prize-answer.ts";

describe("the prize answer of a catalogue row", () => {
  it("keeps never said apart from no", () => {
    assert.equal(prizeToChoice(null), "");
    assert.equal(prizeToChoice(undefined), "");
    assert.equal(prizeToChoice(false), "no");
    assert.equal(prizeToChoice(true), "si");
  });

  it("reads the select back as the same three states", () => {
    assert.equal(choiceToPrize("si"), true);
    assert.equal(choiceToPrize("no"), false);
    assert.equal(choiceToPrize(""), null);
  });

  it("sends nothing for a row whose answer is the one it was loaded with", () => {
    assert.deepEqual(prizeField(null, null), {});
    assert.deepEqual(prizeField(true, true), {});
    assert.deepEqual(prizeField(false, false), {});
  });

  it("sends the new answer when it changed, and null when it was cleared", () => {
    assert.deepEqual(prizeField(true, null), { prize: true });
    assert.deepEqual(prizeField(false, true), { prize: false });
    assert.deepEqual(prizeField(null, true), { prize: null });
  });

  it("says the filter is on as soon as any row answers, and counts the Y rows", () => {
    const rows = [{ prize: null }, { prize: false }, { prize: true }, { prize: true }];

    assert.equal(anyPrizeAnswered([{ prize: null }]), false);
    assert.equal(anyPrizeAnswered(rows), true);
    assert.equal(prizeCount(rows), 2);
  });
});
