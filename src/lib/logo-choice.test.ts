import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { chooseLogoUrl } from "./logo-choice.ts";

const both = { logoUrl: "https://cdn/plain.png", logoOnDarkUrl: "https://cdn/on-dark.png" };

describe("chooseLogoUrl", () => {
  it("uses the dark-background logo on a dark card", () => {
    assert.equal(chooseLogoUrl({ ...both, color: "#1f2a44" }), both.logoOnDarkUrl);
  });

  it("uses the ordinary logo on a light card", () => {
    assert.equal(chooseLogoUrl({ ...both, color: "#f1dccd" }), both.logoUrl);
  });

  it("uses whichever exists when only one was uploaded", () => {
    assert.equal(chooseLogoUrl({ logoUrl: both.logoUrl, color: "#101010" }), both.logoUrl);
    assert.equal(chooseLogoUrl({ logoOnDarkUrl: both.logoOnDarkUrl, color: "#fafafa" }), both.logoOnDarkUrl);
  });

  it("is empty with no logo, and ignores blank values", () => {
    assert.equal(chooseLogoUrl({ logoUrl: "  ", logoOnDarkUrl: "", color: "#ffffff" }), "");
  });
});
