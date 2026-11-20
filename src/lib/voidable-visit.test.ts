import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { voidableVisitRowId } from "./voidable-visit.ts";

const NOW = new Date("2026-11-20T12:00:00Z");

describe("voidableVisitRowId", () => {
  it("offers the newest visit when it is from today", () => {
    assert.equal(
      voidableVisitRowId(
        [
          { id: "l2", date: "2026-11-20", visitId: "v2" },
          { id: "l1", date: "2026-11-18", visitId: "v1" },
        ],
        NOW,
      ),
      "l2",
    );
  });

  it("offers a visit from yesterday, and none older", () => {
    assert.equal(
      voidableVisitRowId([{ id: "l1", date: "2026-11-19", visitId: "v1" }], NOW),
      "l1",
    );
    assert.equal(
      voidableVisitRowId([{ id: "l1", date: "2026-11-18", visitId: "v1" }], NOW),
      null,
    );
  });

  it("skips rows that are not visits, such as a redeemed reward", () => {
    assert.equal(
      voidableVisitRowId(
        [
          { id: "r1", date: "2026-11-20" },
          { id: "l1", date: "2026-11-20", visitId: "v1" },
        ],
        NOW,
      ),
      "l1",
    );
  });

  it("does not offer a visit that is already voided, nor the one before it", () => {
    assert.equal(
      voidableVisitRowId(
        [
          { id: "a2", date: "2026-11-20", visitId: "v2", voided: true },
          { id: "l2", date: "2026-11-20", visitId: "v2" },
          { id: "l1", date: "2026-11-20", visitId: "v1" },
        ],
        NOW,
      ),
      "l1",
    );
  });

  it("offers nothing for an empty history", () => {
    assert.equal(voidableVisitRowId([], NOW), null);
  });
});
