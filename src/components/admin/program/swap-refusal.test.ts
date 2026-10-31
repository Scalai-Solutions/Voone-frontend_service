import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { swapRefusalMessage } from "./swap-refusal.ts";

const FALLBACK = "No se ha podido cambiar el premio.";

describe("swapRefusalMessage", () => {
  it("shows the backend's own refusal untouched", () => {
    for (const detail of [
      "Ese artículo no se puede dar como premio: no tiene categoría.",
      "El cliente recibiría el mismo premio dos veces seguidas.",
    ]) {
      assert.equal(swapRefusalMessage({ detail }, FALLBACK), detail);
    }
  });

  it("falls back when the failure says nothing", () => {
    assert.equal(swapRefusalMessage(new Error("network"), FALLBACK), FALLBACK);
    assert.equal(swapRefusalMessage({ detail: "  " }, FALLBACK), FALLBACK);
    assert.equal(swapRefusalMessage({ detail: undefined }, FALLBACK), FALLBACK);
    assert.equal(swapRefusalMessage(null, FALLBACK), FALLBACK);
  });
});
