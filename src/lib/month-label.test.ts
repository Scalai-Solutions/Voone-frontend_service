import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { monthKeyIn, monthNameEs } from "./month-label.ts";

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

describe("monthKeyIn", () => {
  it("names the month in the given zone, not UTC", () => {
    // 23:30 UTC on 31 October is already 1 November in Madrid (CET, UTC+1).
    const at = new Date("2026-10-31T23:30:00.000Z");
    assert.equal(monthKeyIn("UTC", at), "2026-10");
    assert.equal(monthKeyIn("Europe/Madrid", at), "2026-11");
  });
});
