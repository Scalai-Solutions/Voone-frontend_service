import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { placeTooltip } from "./tooltip-position.ts";

const viewport = { width: 1000, height: 800 };
const tip = { width: 200, height: 40 };

describe("placeTooltip", () => {
  it("centres above the anchor", () => {
    const at = placeTooltip({ left: 400, top: 300, width: 32, height: 32 }, tip, viewport, "top");

    assert.equal(at.side, "top");
    assert.equal(at.left, 416 - 100);
    assert.equal(at.top, 300 - 40 - 8);
  });

  it("centres below the anchor", () => {
    const at = placeTooltip({ left: 400, top: 300, width: 32, height: 32 }, tip, viewport, "bottom");

    assert.equal(at.side, "bottom");
    assert.equal(at.top, 332 + 8);
  });

  it("flips to the other side when there is no room", () => {
    const top = placeTooltip({ left: 400, top: 10, width: 32, height: 32 }, tip, viewport, "top");
    const bottom = placeTooltip({ left: 400, top: 760, width: 32, height: 32 }, tip, viewport, "bottom");

    assert.equal(top.side, "bottom");
    assert.equal(bottom.side, "top");
  });

  it("keeps the bubble inside the viewport horizontally", () => {
    const left = placeTooltip({ left: 0, top: 300, width: 32, height: 32 }, tip, viewport, "top");
    const right = placeTooltip({ left: 980, top: 300, width: 32, height: 32 }, tip, viewport, "top");

    assert.equal(left.left, 8);
    assert.equal(right.left, 1000 - 8 - 200);
  });

  it("pins to the margin when the bubble is wider than the viewport", () => {
    const at = placeTooltip({ left: 100, top: 300, width: 32, height: 32 }, { width: 400, height: 40 }, { width: 300, height: 800 }, "top");

    assert.equal(at.left, 8);
  });
});
