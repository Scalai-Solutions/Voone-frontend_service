import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FREE_REWARD_MAX_NAME,
  REWARD_KINDS,
  isProductRow,
  parseFreeReward,
  parseSpend,
  rewardKindOf,
  spendRangeLabel,
} from "./reward-kinds.ts";

describe("REWARD_KINDS", () => {
  it("offers exactly the five kinds, in the panel's order", () => {
    assert.deepEqual(
      REWARD_KINDS.map((k) => k.kind),
      ["tratamiento", "producto", "doble", "sorpresa", "libre"],
    );
  });
});

describe("rewardKindOf", () => {
  it("reads the kind the backend sends, and a treatment from an older one", () => {
    assert.equal(rewardKindOf({ kind: "sorpresa" }), "sorpresa");
    assert.equal(rewardKindOf({}), "tratamiento");
    assert.equal(rewardKindOf(undefined), "tratamiento");
  });
});

describe("isProductRow", () => {
  it("is a product when marked as one or filed as retail, a treatment otherwise", () => {
    assert.equal(isProductRow({ isProduct: true, category: "COS" }), true);
    assert.equal(isProductRow({ isProduct: false, category: "COS" }), true);
    assert.equal(isProductRow({ isProduct: false, category: "FAC" }), false);
    assert.equal(isProductRow({ category: null }), false);
  });
});

describe("parseFreeReward", () => {
  it("reads the text trimmed and a price with a comma or a dot", () => {
    assert.deepEqual(parseFreeReward("  Manicura  ", "24,5"), {
      ok: true,
      name: "Manicura",
      priceEuro: 24.5,
    });
    assert.deepEqual(parseFreeReward("Manicura", "24.50"), {
      ok: true,
      name: "Manicura",
      priceEuro: 24.5,
    });
    assert.deepEqual(parseFreeReward("Manicura", "10000"), {
      ok: true,
      name: "Manicura",
      priceEuro: 10000,
    });
  });

  it("refuses what the backend would refuse", () => {
    for (const [name, price] of [
      ["   ", "10"],
      ["x".repeat(FREE_REWARD_MAX_NAME + 1), "10"],
      ["Manicura", ""],
      ["Manicura", "0"],
      ["Manicura", "-5"],
      ["Manicura", "12,345"],
      ["Manicura", "10000,01"],
      ["Manicura", "abc"],
    ]) {
      assert.equal(parseFreeReward(name, price).ok, false, `${name} / ${price}`);
    }
  });
});

describe("parseSpend", () => {
  const range = { min: 120, max: 480 };

  it("reads whole euros inside the range, both ends included", () => {
    assert.deepEqual(parseSpend("120", range), { ok: true, realSpend: 120 });
    assert.deepEqual(parseSpend(" 480 ", range), { ok: true, realSpend: 480 });
  });

  it("refuses decimals, nothing, zero, and anything outside the range", () => {
    for (const text of ["", "12,5", "12.5", "0", "119", "481", "abc"]) {
      assert.equal(parseSpend(text, range).ok, false, text);
    }
  });

  it("leaves the range to the backend when it is not known", () => {
    assert.deepEqual(parseSpend("9999", undefined), { ok: true, realSpend: 9999 });
  });

  it("names the range as the screen shows it", () => {
    assert.equal(spendRangeLabel(range), "Entre 120 € y 480 €");
  });
});
