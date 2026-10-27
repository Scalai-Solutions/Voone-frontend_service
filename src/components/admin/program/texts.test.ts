import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkText,
  MAX_DESCRIPTION_LENGTH,
  MAX_TEXT_LENGTH,
  perkDescriptionEdit,
  perkNameEdit,
  recurringLabelEdit,
  referralTextEdit,
  rewardLabelEdit,
} from "./texts.ts";

describe("checkText", () => {
  it("trims, and measures the length after trimming", () => {
    assert.deepEqual(checkText("  Hola  ", 10), { ok: true, value: "Hola" });
    assert.equal(checkText(` ${"a".repeat(MAX_TEXT_LENGTH)} `, MAX_TEXT_LENGTH).ok, true);
  });

  it("accepts exactly the maximum and rejects one more", () => {
    assert.equal(checkText("a".repeat(120), 120).ok, true);
    assert.equal(checkText("a".repeat(121), 120).ok, false);
  });

  it("rejects empty, whitespace-only and control characters", () => {
    for (const text of ["", "   ", "\t\n", "a\nb", "a\u0000b", "a\u007fb", "a\u0085b"]) {
      assert.equal(checkText(text, 120).ok, false, JSON.stringify(text));
    }
  });

  it("keeps accents and symbols", () => {
    assert.deepEqual(checkText("Limpieza facial · 10 % dto.", 120), {
      ok: true,
      value: "Limpieza facial · 10 % dto.",
    });
  });
});

describe("referralTextEdit", () => {
  it("sends the 0-based position and the trimmed name", () => {
    assert.deepEqual(referralTextEdit(0, " Un masaje "), {
      ok: true,
      edits: { referral: [{ index: 0, name: "Un masaje" }] },
    });
  });

  it("rejects an invalid position or text without building a body", () => {
    for (const index of [-1, 1.5, Number.NaN]) {
      assert.equal(referralTextEdit(index, "x").ok, false, String(index));
    }
    assert.equal(referralTextEdit(0, "  ").ok, false);
  });
});

describe("perk edits", () => {
  it("sends only the name, or only the description, with the ladder number", () => {
    assert.deepEqual(perkNameEdit(7, "Doble progreso"), {
      ok: true,
      edits: { perks: [{ milestone: 7, name: "Doble progreso" }] },
    });
    assert.deepEqual(perkDescriptionEdit(7, " Durante un mes "), {
      ok: true,
      edits: { perks: [{ milestone: 7, desc: "Durante un mes" }] },
    });
  });

  it("allows a description up to 200 and a name up to 120", () => {
    assert.equal(perkDescriptionEdit(1, "a".repeat(MAX_DESCRIPTION_LENGTH)).ok, true);
    assert.equal(perkDescriptionEdit(1, "a".repeat(MAX_DESCRIPTION_LENGTH + 1)).ok, false);
    assert.equal(perkNameEdit(1, "a".repeat(MAX_TEXT_LENGTH + 1)).ok, false);
  });

  it("rejects a milestone that is not a positive integer", () => {
    for (const milestone of [0, -3, 2.5, Number.NaN]) {
      assert.equal(perkNameEdit(milestone, "x").ok, false, String(milestone));
      assert.equal(perkDescriptionEdit(milestone, "x").ok, false, String(milestone));
    }
  });
});

describe("rewardLabelEdit and recurringLabelEdit", () => {
  it("sends the trimmed label", () => {
    assert.deepEqual(rewardLabelEdit(4, " Facial gratis "), {
      ok: true,
      edits: { rewards: [{ milestone: 4, label: "Facial gratis" }] },
    });
    assert.deepEqual(recurringLabelEdit(" Un regalo "), {
      ok: true,
      edits: { recurring: { label: "Un regalo" } },
    });
  });

  it("sends label null to restore the original name", () => {
    assert.deepEqual(rewardLabelEdit(4, null), {
      ok: true,
      edits: { rewards: [{ milestone: 4, label: null }] },
    });
    assert.deepEqual(recurringLabelEdit(null), {
      ok: true,
      edits: { recurring: { label: null } },
    });
  });

  it("does not turn blank text into a restore", () => {
    assert.equal(rewardLabelEdit(4, "   ").ok, false);
    assert.equal(recurringLabelEdit("").ok, false);
  });

  it("rejects an invalid milestone", () => {
    assert.equal(rewardLabelEdit(0, "x").ok, false);
    assert.equal(rewardLabelEdit(0, null).ok, false);
  });
});
