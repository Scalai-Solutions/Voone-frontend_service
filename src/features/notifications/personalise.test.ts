import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { personalise, usesName } from "./personalise.ts";

describe("personalise", () => {
  it("uses the member's first name", () => {
    assert.equal(
      personalise("¡Hola {first_name}!", "María José López"),
      "¡Hola María!",
    );
  });

  it("closes up the punctuation when there is no name", () => {
    assert.equal(personalise("¡Hola {first_name}!", null), "¡Hola!");
    assert.equal(
      personalise("Hola {first_name}, tienes un 20%", ""),
      "Hola, tienes un 20%",
    );
  });

  it("leaves text without the variable alone", () => {
    assert.equal(
      personalise("Tienes un 20% de descuento", "Ana"),
      "Tienes un 20% de descuento",
    );
  });
});

describe("usesName", () => {
  it("is true when any text holds the variable", () => {
    assert.equal(usesName("Hola", "Hola {first_name}"), true);
    assert.equal(usesName("Hola", "Adiós"), false);
  });
});
