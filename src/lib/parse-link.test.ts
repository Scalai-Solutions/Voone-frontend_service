import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseLink } from "./parse-link.ts";

describe("parseLink", () => {
  it("accepts one https address", () => {
    assert.equal(parseLink("  https://clinica.es/reservar "), "https://clinica.es/reservar");
  });

  it("rejects http, bare words, hosts without a dot and extra text", () => {
    assert.equal(parseLink("http://clinica.es"), null);
    assert.equal(parseLink("clinica.es"), null);
    assert.equal(parseLink("https://localhost"), null);
    assert.equal(parseLink("https://clinica.es reserva"), null);
    assert.equal(parseLink(""), null);
  });
});
