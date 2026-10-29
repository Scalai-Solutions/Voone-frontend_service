import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { monthNameEs } from "./month-label.ts";

describe("monthNameEs", () => {
  it("returns the capitalised Spanish month", () => {
    assert.equal(monthNameEs("2026-09"), "Septiembre");
    assert.equal(monthNameEs("2026-10"), "Octubre");
    assert.equal(monthNameEs("2027-01"), "Enero");
  });

  it("returns null for anything that is not a year-month", () => {
    for (const bad of ["", "2026-13", "2026-00", "2026-9", "2026-10-05", "abc"]) {
      assert.equal(monthNameEs(bad), null, bad);
    }
  });
});
