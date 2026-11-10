import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PERKS, perkEdits, textToValue, valueToText } from "./perk-values.ts";

const stored = { diag: 40, mejora: null, sorpresa: 25.5 };
const same = { diag: "40", mejora: "", sorpresa: "25,5" };

describe("what a centre says its perks are worth", () => {
  it("never offers the double-points perk, which is points and not money", () => {
    assert.deepEqual(
      PERKS.map((p) => p.key),
      ["diag", "mejora", "sorpresa"],
    );
  });

  it("shows a stored value with a comma and a blank when none is set", () => {
    assert.equal(valueToText(25.5), "25,5");
    assert.equal(valueToText(40), "40");
    assert.equal(valueToText(null), "");
  });

  it("reads what was typed as euros, blank as none, and nonsense as invalid", () => {
    assert.equal(textToValue("25,5"), 25.5);
    assert.equal(textToValue("25.50"), 25.5);
    assert.equal(textToValue("  "), null);
    assert.equal(textToValue("-3"), undefined);
    assert.equal(textToValue("abc"), undefined);
    assert.equal(textToValue("10001"), undefined);
  });

  it("sends nothing when nothing changed", () => {
    assert.deepEqual(perkEdits(stored, same), { edits: {}, invalid: null });
  });

  it("sends only the perks that changed, and null for one that was cleared", () => {
    assert.deepEqual(perkEdits(stored, { ...same, mejora: "10", diag: "" }), {
      edits: { mejora: 10, diag: null },
      invalid: null,
    });
  });

  it("names the box that cannot be read and sends nothing", () => {
    assert.deepEqual(perkEdits(stored, { ...same, sorpresa: "x" }), {
      edits: {},
      invalid: "sorpresa",
    });
  });
});
