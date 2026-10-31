import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBonoPatch,
  buildTreatmentPatch,
  parsePriceInput,
  priceToText,
  readSessionsInput,
} from "./admin-services.ts";
import {
  parseBonoCreate,
  parseBonoUpdate,
  parseTreatmentCreate,
  parseTreatmentUpdate,
} from "./admin-catalogue-parsers.ts";

const value = (r: { ok: boolean; value?: unknown; message?: string }) => {
  assert.equal(r.ok, true, r.message);

  return r.value;
};
const refused = (r: { ok: boolean; message?: string }) => {
  assert.equal(r.ok, false);

  return r.message ?? "";
};

describe("parsePriceInput", () => {
  it("reads comma, dot, euro sign and thousands grouping", () => {
    assert.deepEqual(parsePriceInput("60", true), { value: 60 });
    assert.deepEqual(parsePriceInput("60,5", true), { value: 60.5 });
    assert.deepEqual(parsePriceInput("60.50 €", true), { value: 60.5 });
    assert.deepEqual(parsePriceInput("1.500", true), { value: 1500 });
    assert.deepEqual(parsePriceInput("1.234,50", true), { value: 1234.5 });
  });

  it("refuses empty, text, zero, too many decimals, too big", () => {
    for (const bad of ["", "abc", "0", "0,001", "12,345", "100000,01", "-5"]) {
      assert.ok("error" in parsePriceInput(bad, true), bad);
    }
  });

  it("whole-euro centres refuse cents", () => {
    assert.deepEqual(parsePriceInput("50", false), { value: 50 });
    assert.ok("error" in parsePriceInput("50,5", false));
  });

  it("priceToText uses a comma and tolerates null", () => {
    assert.equal(priceToText(12.5), "12,5");
    assert.equal(priceToText(null), "");
  });
});

describe("buildTreatmentPatch", () => {
  const t = { name: "Hydrafacial", priceEuro: 60, categoryId: "FAC" };

  it("sends only what changed", () => {
    assert.deepEqual(
      buildTreatmentPatch(t, { name: "Hydrafacial", price: "60", categoryId: "FAC" }, true),
      {},
    );
    assert.deepEqual(
      buildTreatmentPatch(t, { name: " Hydra ", price: "65,5", categoryId: "MAS" }, true),
      { name: "Hydra", priceEuro: 65.5, categoryId: "MAS" },
    );
  });

  it("a row with no price can be renamed without being given one", () => {
    assert.deepEqual(
      buildTreatmentPatch(
        { name: "Old", priceEuro: null, categoryId: null },
        { name: "New", price: "", categoryId: "" },
        true,
      ),
      { name: "New" },
    );
  });

  it("ignores the category outside the catalogue and flags a bad price", () => {
    assert.deepEqual(
      buildTreatmentPatch(t, { name: "Hydrafacial", price: "60", categoryId: "MAS" }, false),
      {},
    );
    assert.equal(
      buildTreatmentPatch(t, { name: "Hydrafacial", price: "x", categoryId: "FAC" }, true),
      null,
    );
  });
});

describe("buildBonoPatch", () => {
  const plan = { name: "Facial pack", totalEuro: 199.5, totalSessions: 5 };

  it("compares the pack total, not the per-session price", () => {
    assert.deepEqual(
      buildBonoPatch(plan, { name: "Facial pack", price: "199,50", sessions: "5" }),
      {},
    );
    assert.deepEqual(
      buildBonoPatch(plan, { name: "Facial pack", price: "210", sessions: "6" }),
      { priceEuro: 210, totalSessions: 6 },
    );
  });

  it("returns null for an invalid form", () => {
    assert.equal(buildBonoPatch(plan, { name: "", price: "10", sessions: "5" }), null);
    assert.equal(buildBonoPatch(plan, { name: "a", price: "x", sessions: "5" }), null);
    assert.equal(buildBonoPatch(plan, { name: "a", price: "10", sessions: "0" }), null);
  });

  it("readSessionsInput wants a whole number from 1 to 100", () => {
    assert.deepEqual(readSessionsInput(" 12 "), { value: 12 });
    for (const bad of ["", "0", "101", "2.5", "x"])
      assert.ok("error" in readSessionsInput(bad), bad);
  });
});

describe("treatment body parsers", () => {
  it("create keeps only the known fields", () => {
    assert.deepEqual(
      value(parseTreatmentCreate({ name: " Peel ", priceEuro: 45, categoryId: "PEL" })),
      { name: "Peel", priceEuro: 45, categoryId: "PEL" },
    );
    assert.deepEqual(value(parseTreatmentCreate({ name: "Peel", priceEuro: 45 })), {
      name: "Peel",
      priceEuro: 45,
    });
  });

  it("create refuses bad names, prices (also as text) and extra fields", () => {
    assert.ok(refused(parseTreatmentCreate({ name: "", priceEuro: 5 })));
    assert.ok(refused(parseTreatmentCreate({ name: "a", priceEuro: "5" })));
    assert.ok(refused(parseTreatmentCreate({ name: "a", priceEuro: 0 })));
    assert.ok(refused(parseTreatmentCreate({ name: "a", priceEuro: 1.234 })));
    assert.match(
      refused(parseTreatmentCreate({ name: "a", priceEuro: 5, clinicId: "x" })),
      /clinicId/,
    );
    assert.ok(refused(parseTreatmentCreate(null)));
  });

  it("update takes a partial and needs at least one field", () => {
    assert.deepEqual(value(parseTreatmentUpdate({ priceEuro: 50 })), { priceEuro: 50 });
    assert.match(refused(parseTreatmentUpdate({})), /Nothing to change/);
    assert.ok(refused(parseTreatmentUpdate({ name: 4 })));
  });
});

describe("bono body parsers", () => {
  it("create needs name, pack price and 1..100 sessions", () => {
    assert.deepEqual(
      value(parseBonoCreate({ name: "Pack", priceEuro: 199.5, totalSessions: 5 })),
      { name: "Pack", priceEuro: 199.5, totalSessions: 5 },
    );
    assert.ok(refused(parseBonoCreate({ name: "Pack", priceEuro: 10, totalSessions: 0 })));
    assert.ok(refused(parseBonoCreate({ name: "Pack", priceEuro: 10, totalSessions: 2.5 })));
    assert.ok(refused(parseBonoCreate({ name: "Pack", priceEuro: 10 })));
    assert.ok(refused(parseBonoCreate({ name: "Pack", priceEuro: 10, totalSessions: 2, active: true })));
  });

  it("update accepts active and refuses empty or unknown", () => {
    assert.deepEqual(value(parseBonoUpdate({ active: false })), { active: false });
    assert.ok(refused(parseBonoUpdate({})));
    assert.ok(refused(parseBonoUpdate({ active: "no" })));
    assert.ok(refused(parseBonoUpdate({ planId: "x" })));
  });
});
