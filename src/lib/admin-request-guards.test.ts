import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_BODY_BYTES,
  declaredTooLarge,
  isSafeId,
} from "./admin-request-guards.ts";

describe("isSafeId", () => {
  it("accepts backend-shaped ids", () => {
    for (const id of ["abc", "c1", "clx_9-Z", "a".repeat(64)])
      assert.equal(isSafeId(id), true, id);
  });

  it("refuses traversal, encoded dots, separators, empties and long ids", () => {
    for (const id of [
      "",
      "..",
      ".",
      "%2E%2E",
      "%2e%2e",
      "a/b",
      "a?b",
      "a#b",
      "a b",
      "a\\b",
      "a".repeat(65),
    ])
      assert.equal(isSafeId(id), false, id);

    assert.equal(isSafeId(undefined), false);
  });
});

describe("declaredTooLarge", () => {
  it("compares Content-Length with the cap", () => {
    assert.equal(declaredTooLarge(String(MAX_BODY_BYTES)), false);
    assert.equal(declaredTooLarge(String(MAX_BODY_BYTES + 1)), true);
    assert.equal(declaredTooLarge("100", 50), true);
  });

  it("a missing or odd header says nothing", () => {
    assert.equal(declaredTooLarge(null), false);
    assert.equal(declaredTooLarge("abc"), false);
    assert.equal(declaredTooLarge("-5"), false);
  });
});
