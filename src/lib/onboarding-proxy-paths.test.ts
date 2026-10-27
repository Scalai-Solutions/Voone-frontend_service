import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isForwardableOnboardingPath } from "./onboarding-proxy-paths.ts";

/**
 * Run with `npm test` (Node's built-in runner; no extra dependency).
 *
 * Every call in `onboarding-api.ts` goes through the admin proxy, which answers 404 to anything
 * not on its allowlist. A new API call without a matching allowlist entry therefore looks fine in
 * code and fails only in the deployed UI: that is how adding tier benefits broke. This lists
 * every path and method `onboarding-api.ts` uses, so adding a call there without adding it to
 * the allowlist fails here. Keep this list in step with that file.
 */
const USED_BY_ONBOARDING_API: Array<[method: string, path: string]> = [
  ["GET", "catalog"],
  ["PUT", "catalog"],
  ["POST", "catalog/import"],
  ["GET", "estimates"],
  ["POST", "preview"],
  ["GET", "programs"],
  ["POST", "programs"],
  ["GET", "programs/prog_1"],
  ["POST", "programs/prog_1/publish"],
  ["PATCH", "programs/prog_1/milestones/3"],
  ["PUT", "programs/prog_1/tiers/oro/benefits"],
  ["PATCH", "programs/prog_1/texts"],
  ["POST", "programs/prog_1/draft"],
  ["POST", "programs/prog_1/calculator"],
  ["GET", "recalibration"],
  ["GET", "bonos"],
  ["POST", "bonos"],
  ["PATCH", "bonos/bono_1"],
  ["DELETE", "bonos/bono_1"],
];

const segments = (path: string) => path.split("/");

describe("onboarding proxy allowlist", () => {
  for (const [method, path] of USED_BY_ONBOARDING_API) {
    it(`forwards ${method} /${path}`, () => {
      assert.equal(isForwardableOnboardingPath(segments(path), method), true);
    });
  }

  it("matches the method case-insensitively", () => {
    assert.equal(
      isForwardableOnboardingPath(
        segments("programs/p/tiers/oro/benefits"),
        "put",
      ),
      true,
    );
  });

  it("does not forward other methods on the tier benefits path", () => {
    for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
      assert.equal(
        isForwardableOnboardingPath(
          segments("programs/p/tiers/oro/benefits"),
          method,
        ),
        false,
        method,
      );
    }
  });

  it("does not forward neighbouring tier paths or empty segments", () => {
    for (const path of [
      "programs/p/tiers",
      "programs/p/tiers/oro",
      "programs/p/tiers/oro/benefits/extra",
      "programs//tiers/oro/benefits",
      "programs/p/tiers//benefits",
    ]) {
      assert.equal(
        isForwardableOnboardingPath(segments(path), "PUT"),
        false,
        path,
      );
    }
  });

  it("forwards texts only as PATCH and draft only as POST", () => {
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      assert.equal(
        isForwardableOnboardingPath(segments("programs/p/texts"), method),
        false,
        `texts ${method}`,
      );
    }
    for (const method of ["GET", "PUT", "PATCH", "DELETE"]) {
      assert.equal(
        isForwardableOnboardingPath(segments("programs/p/draft"), method),
        false,
        `draft ${method}`,
      );
    }
    for (const path of ["programs/p/texts/extra", "programs//texts", "programs/p/draft/x"]) {
      assert.equal(isForwardableOnboardingPath(segments(path), "PATCH"), false, path);
      assert.equal(isForwardableOnboardingPath(segments(path), "POST"), false, path);
    }
  });

  it("does not forward unknown paths", () => {
    assert.equal(isForwardableOnboardingPath(["admin"], "GET"), false);
    assert.equal(isForwardableOnboardingPath([], "GET"), false);
  });
});
