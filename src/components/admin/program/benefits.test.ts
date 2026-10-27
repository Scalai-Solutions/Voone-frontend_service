import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MAX_BENEFIT_LENGTH, replaceBenefit } from "./benefits.ts";

describe("replaceBenefit", () => {
  const list = ["Café", "Parking", "Revisión anual"];

  it("replaces only the benefit at the index, keeping order and length", () => {
    const result = replaceBenefit(list, 1, "Parking gratuito");

    assert.deepEqual(result, {
      ok: true,
      benefits: ["Café", "Parking gratuito", "Revisión anual"],
    });
  });

  it("trims the text it saves", () => {
    const result = replaceBenefit(list, 0, "  Té  ");

    assert.deepEqual(result, {
      ok: true,
      benefits: ["Té", "Parking", "Revisión anual"],
    });
  });

  it("does not modify the list it was given", () => {
    replaceBenefit(list, 0, "Té");

    assert.deepEqual(list, ["Café", "Parking", "Revisión anual"]);
  });

  it("rejects empty and whitespace-only text instead of removing the benefit", () => {
    for (const text of ["", "   ", "\t\n"]) {
      const result = replaceBenefit(list, 0, text);

      assert.equal(result.ok, false, JSON.stringify(text));
    }
  });

  it("accepts exactly the maximum length and rejects one more", () => {
    assert.equal(
      replaceBenefit(list, 0, "a".repeat(MAX_BENEFIT_LENGTH)).ok,
      true,
    );
    assert.equal(
      replaceBenefit(list, 0, "a".repeat(MAX_BENEFIT_LENGTH + 1)).ok,
      false,
    );
  });

  it("measures the length after trimming, as the backend does", () => {
    assert.equal(
      replaceBenefit(list, 0, ` ${"a".repeat(MAX_BENEFIT_LENGTH)} `).ok,
      true,
    );
  });

  it("rejects an index outside the list", () => {
    for (const index of [-1, 3, 1.5, Number.NaN]) {
      assert.equal(replaceBenefit(list, index, "x").ok, false, String(index));
    }
  });
});
