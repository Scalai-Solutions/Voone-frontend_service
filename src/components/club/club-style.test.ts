import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  badgeText,
  nextTierOf,
  numberLadder,
  recurringText,
  referralHeading,
  styleOfTier,
  tierPosition,
  welcomeText,
} from "./club-style.ts";

const tiers = ["bronce", "plata", "oro"].map((key) => ({ key, label: key, benefits: [] }));

describe("club style", () => {
  it("knows the five tiers and falls back to bronze for an unknown one", () => {
    assert.equal(styleOfTier("diamante").light, true);
    assert.equal(styleOfTier("plata").light, false);
    assert.equal(styleOfTier("secreto"), styleOfTier("bronce"));
  });

  it("writes a tier's place as roman numerals", () => {
    assert.equal(tierPosition(0, 5), "I / V");
    assert.equal(tierPosition(4, 5), "V / V");
  });

  it("labels badges and says nothing without one", () => {
    assert.equal(badgeText("new"), "Nuevo");
    assert.equal(badgeText("up"), "Mejora");
    assert.equal(badgeText(undefined), "");
  });

  it("pluralises the referral heading", () => {
    assert.equal(referralHeading(1), "Con 1 recomendación");
    assert.equal(referralHeading(3), "Con 3 recomendaciones");
  });

  it("finds the next tier, and none after the last", () => {
    assert.equal(nextTierOf(tiers, "bronce")?.key, "plata");
    assert.equal(nextTierOf(tiers, "oro"), undefined);
    assert.equal(nextTierOf(tiers, "nope"), undefined);
  });

  it("numbers steps continuously across tiers and gives each its place in its own tier", () => {
    const step = (title: string) => ({ title, detail: "", label: "Regalo", mark: null });
    const numbered = numberLadder([
      { tierKey: "bronce", tierLabel: "Bronce", steps: [step("a"), step("b")] },
      { tierKey: "plata", tierLabel: "Plata", steps: [step("c")] },
    ]);

    assert.deepEqual(
      numbered.flatMap((g) => g.steps.map((s) => [s.number, s.position])),
      [
        ["01", "1 de 2"],
        ["02", "2 de 2"],
        ["03", "1 de 1"],
      ],
    );
  });

  it("describes the welcome progress and the recurring reward", () => {
    assert.equal(welcomeText("Club Privé", 30), "Entra a Club Privé con 30 € de progreso ya conseguidos.");
    assert.equal(welcomeText("Club Privé", 0), "Entra a Club Privé desde el primer día.");
    assert.equal(
      recurringText({ every: 192, name: "láser lipolítico" }),
      "Después del último nivel, láser lipolítico por cada 192 € que pagues.",
    );
  });
});
