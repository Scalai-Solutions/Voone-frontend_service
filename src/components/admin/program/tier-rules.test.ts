import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  BenefitLine,
  PresentedTier,
} from "../../../lib/onboarding-api.ts";
import {
  buildTierSave,
  dialogDraft,
  isRuleKey,
  parseDiscount,
  parseMultiplier,
} from "./tier-rules.ts";

const line = (
  key: string,
  text: string,
  extra: Partial<BenefitLine> = {},
): BenefitLine => ({
  key,
  text,
  original: text,
  kind: key.startsWith("custom:") ? "custom" : "generated",
  edited: false,
  hidden: false,
  ...extra,
});

const tier = (benefitLines: BenefitLine[]): PresentedTier => ({
  key: "oro",
  label: "Oro",
  threshold: 500,
  minTenureMonths: 0,
  benefits: benefitLines.filter((l) => !l.hidden).map((l) => l.text),
  customBenefits: benefitLines
    .filter((l) => l.kind === "custom")
    .map((l) => l.text),
  benefitLines,
});

const rules = {
  multiplier: 1.1,
  discountPercent: 5,
  birthday: { name: "Limpieza facial", itemId: "t1" },
};

describe("parseMultiplier", () => {
  it("reads a comma, a dot and a leading ×; ×1 means none", () => {
    for (const text of ["1,5", "1.5", "×1,5", " x1.5 "]) {
      assert.deepEqual(parseMultiplier(text), { ok: true, value: 1.5 });
    }
    assert.deepEqual(parseMultiplier("1"), { ok: true, value: 1 });
    assert.deepEqual(parseMultiplier("3"), { ok: true, value: 3 });
  });

  it("refuses below ×1, above ×3, two decimals and words", () => {
    for (const text of ["0,9", "3,1", "1,25", "", "dos"]) {
      assert.equal(parseMultiplier(text).ok, false, text);
    }
  });
});

describe("parseDiscount", () => {
  it("reads a whole percent, with or without %; 0 means none", () => {
    assert.deepEqual(parseDiscount("10"), { ok: true, value: 10 });
    assert.deepEqual(parseDiscount("50 %"), { ok: true, value: 50 });
    assert.deepEqual(parseDiscount("0"), { ok: true, value: 0 });
  });

  it("refuses above 50, decimals and words", () => {
    for (const text of ["51", "5,5", "", "diez", "-5"]) {
      assert.equal(parseDiscount(text).ok, false, text);
    }
  });
});

describe("dialogDraft", () => {
  it("opens with what clients read: visible text-only lines, reworded ones as they read", () => {
    const draft = dialogDraft(
      tier([
        line("mult", "Cada euro suma ×1,1 de progreso"),
        line("discount", "Descuento del 5% en cosmética"),
        line("birthday", "Regalo de cumpleaños: Limpieza facial"),
        line("tests", "Prueba de nuevos tratamientos", { hidden: true }),
        line("happyhour", "Happy Hour para ti", { edited: true }),
        line("custom:0", "Café"),
      ]),
      rules,
    );

    assert.deepEqual(draft, {
      multiplier: "1,1",
      discount: "5",
      birthday: rules.birthday,
      freeText: ["Happy Hour para ti", "Café"],
      hiddenRules: [],
    });
  });

  it("flags a real line hidden before: it still applied", () => {
    const draft = dialogDraft(
      tier([
        line("birthday", "Regalo de cumpleaños: Limpieza facial", {
          hidden: true,
        }),
        line("card", "Tarjeta con su nombre"),
      ]),
      rules,
    );

    assert.deepEqual(draft.hiddenRules, ["birthday"]);
    assert.deepEqual(draft.freeText, ["Tarjeta con su nombre"]);
  });
});

describe("buildTierSave", () => {
  it("sends numbers and the whole list, and no birthday when it was not changed", () => {
    assert.deepEqual(
      buildTierSave({
        multiplier: "1,5",
        discount: "10",
        freeText: [" Café ", "", "Parking"],
      }),
      {
        ok: true,
        change: {
          multiplier: 1.5,
          discountPercent: 10,
          freeText: ["Café", "Parking"],
        },
      },
    );
  });

  it("sends the birthday when it was changed, null included", () => {
    const saved = buildTierSave({
      multiplier: "1",
      discount: "0",
      freeText: [],
      birthday: null,
    });

    assert.deepEqual(saved, {
      ok: true,
      change: {
        multiplier: 1,
        discountPercent: 0,
        freeText: [],
        birthday: null,
      },
    });
  });

  it("refuses a bad number, too many points and a long point", () => {
    const base = { multiplier: "1", discount: "0", freeText: [] as string[] };

    assert.equal(buildTierSave({ ...base, multiplier: "4" }).ok, false);
    assert.equal(buildTierSave({ ...base, discount: "60" }).ok, false);
    assert.equal(
      buildTierSave({ ...base, freeText: Array(11).fill("a") }).ok,
      false,
    );
    assert.equal(
      buildTierSave({ ...base, freeText: ["x".repeat(121)] }).ok,
      false,
    );
  });
});

describe("isRuleKey", () => {
  it("knows the three lines driven by a real value and nothing else", () => {
    assert.deepEqual(
      ["mult", "discount", "birthday", "events", "custom:0"].map(isRuleKey),
      [true, true, true, false, false],
    );
  });
});
