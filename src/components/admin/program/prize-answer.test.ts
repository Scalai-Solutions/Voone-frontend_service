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

  it("sends nothing for a row with no answer, and the answer otherwise", () => {
    assert.deepEqual(prizeField(null), {});
    assert.deepEqual(prizeField(true), { prize: true });
    assert.deepEqual(prizeField(false), { prize: false });
  });

  it("says the filter is on as soon as any row answers, and counts the Y rows", () => {
    const rows = [{ prize: null }, { prize: false }, { prize: true }, { prize: true }];

    assert.equal(anyPrizeAnswered([{ prize: null }]), false);
    assert.equal(anyPrizeAnswered(rows), true);
    assert.equal(prizeCount(rows), 2);
  });
});
