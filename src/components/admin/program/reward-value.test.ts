import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatEuros } from "../../../lib/euros.ts";
import { infoNotes, rewardValueLabel } from "./reward-value.ts";

describe("rewardValueLabel", () => {
  it("shows the retail value as es-ES euros, labelled", () => {
    assert.equal(
      rewardValueLabel({ rewardValueEuro: 45 }),
      `Reward value ${formatEuros(45)}`,
    );
    assert.match(rewardValueLabel({ rewardValueEuro: 45 }) ?? "", /^Reward value 45\s€$/);
  });

  it("shows nothing for an older backend or an empty value", () => {
    assert.equal(rewardValueLabel({}), null);
    assert.equal(rewardValueLabel({ rewardValueEuro: 0 }), null);
    assert.equal(rewardValueLabel({ rewardValueEuro: Number.NaN }), null);
    assert.equal(
      rewardValueLabel({ rewardValueEuro: undefined }),
      null,
    );
  });
});

describe("infoNotes", () => {
  it("is empty without notes", () => {
    assert.deepEqual(infoNotes({}), []);
    assert.deepEqual(infoNotes({ notes: [] }), []);
  });

  it("keeps the notes, dropping blanks and repeats", () => {
    assert.deepEqual(infoNotes({ notes: [" a ", "", "a", "b"] }), ["a", "b"]);
  });
});
