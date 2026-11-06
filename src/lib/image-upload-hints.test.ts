import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IMAGE_UPLOAD_HINTS } from "./image-upload-hints.ts";

describe("image upload hints", () => {
  it("state the sizes the backend checks and the wallets draw", () => {
    assert.match(IMAGE_UPLOAD_HINTS.logo, /480×150/);
    assert.match(IMAGE_UPLOAD_HINTS.logo, /160 px/);
    assert.match(IMAGE_UPLOAD_HINTS.logoOnDark, /480×150/);
    assert.match(IMAGE_UPLOAD_HINTS.hero, /1125×369/);
    assert.match(IMAGE_UPLOAD_HINTS.hero, /750 px/);
  });
});
