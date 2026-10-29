import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveWalletInstallUrl } from "./wallet-links.ts";

describe("resolveWalletInstallUrl", () => {
  it("returns the url when the provider issued the pass", () => {
    assert.equal(
      resolveWalletInstallUrl({ available: true, url: "https://x.test/apple" }),
      "https://x.test/apple",
    );
  });

  it("returns null when the provider is unavailable, even with a url", () => {
    assert.equal(resolveWalletInstallUrl({ available: false, url: "https://x.test/apple" }), null);
  });

  it("returns null when available but there is no url (no fallback route)", () => {
    assert.equal(resolveWalletInstallUrl({ available: true, url: null }), null);
    assert.equal(resolveWalletInstallUrl({ available: true, url: "" }), null);
  });

  it("returns null for a missing provider entry", () => {
    assert.equal(resolveWalletInstallUrl(undefined), null);
    assert.equal(resolveWalletInstallUrl(null), null);
  });
});
