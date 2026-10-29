import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NO_DOUBLE_POINTS, describeDouble, normalizeDoublePoints } from "./double-points.ts";

describe("normalizeDoublePoints", () => {
  it("passes a well-formed perk through", () => {
    assert.deepEqual(
      normalizeDoublePoints({ applies: true, reason: "perk", until: "2026-09-12T21:59:59.000Z" }),
      { applies: true, reason: "perk", until: "2026-09-12T21:59:59.000Z" },
    );
  });

  it("passes a referral through", () => {
    assert.deepEqual(normalizeDoublePoints({ applies: true, reason: "referral", until: null }), {
      applies: true,
      reason: "referral",
      until: null,
    });
  });

  it("treats an old backend (field missing) as nothing applying", () => {
    assert.deepEqual(normalizeDoublePoints(undefined), NO_DOUBLE_POINTS);
    assert.deepEqual(normalizeDoublePoints(null), NO_DOUBLE_POINTS);
  });

  it("treats a malformed value as nothing applying", () => {
    assert.deepEqual(normalizeDoublePoints("yes"), NO_DOUBLE_POINTS);
    assert.deepEqual(normalizeDoublePoints({ applies: "true" }), NO_DOUBLE_POINTS);
    assert.deepEqual(normalizeDoublePoints({}), NO_DOUBLE_POINTS);
  });

  it("drops an unknown reason or a non-string until instead of trusting it", () => {
    assert.deepEqual(normalizeDoublePoints({ applies: true, reason: "gift", until: 5 }), {
      applies: true,
      reason: null,
      until: null,
    });
  });

  it("returns the neutral value when applies is false, whatever else came with it", () => {
    assert.deepEqual(
      normalizeDoublePoints({ applies: false, reason: "perk", until: "2026-09-12T00:00:00.000Z" }),
      NO_DOUBLE_POINTS,
    );
  });
});

describe("describeDouble", () => {
  const now = new Date("2026-08-20T10:00:00.000Z");

  it("names the perk and when it lapses, and locks the slider", () => {
    assert.deepEqual(
      describeDouble({ applies: true, reason: "perk", until: "2026-09-12T21:59:59.000Z" }, now),
      {
        text: "Esta visita suma el doble de puntos (ventaja hasta el 12 sept)",
        sliderDisabled: true,
      },
    );
  });

  it("names a referral and locks the slider", () => {
    assert.deepEqual(describeDouble({ applies: true, reason: "referral", until: null }, now), {
      text: "Esta visita suma el doble de puntos: primera visita por recomendación",
      sliderDisabled: true,
    });
  });

  it("says nothing and leaves the slider free when nothing applies", () => {
    assert.deepEqual(describeDouble(NO_DOUBLE_POINTS, now), { text: null, sliderDisabled: false });
  });

  it("treats the old-backend shape (normalised to nothing) as nothing applying", () => {
    assert.deepEqual(describeDouble(normalizeDoublePoints(undefined), now), {
      text: null,
      sliderDisabled: false,
    });
  });

  it("treats a perk whose until has passed as nothing applying", () => {
    assert.deepEqual(
      describeDouble({ applies: true, reason: "perk", until: "2026-08-19T21:59:59.000Z" }, now),
      { text: null, sliderDisabled: false },
    );
    // Lapsing exactly now counts as lapsed: the backend only honours expiresAt > at.
    assert.deepEqual(
      describeDouble({ applies: true, reason: "perk", until: now.toISOString() }, now),
      { text: null, sliderDisabled: false },
    );
  });

  it("still applies when the perk has no usable date", () => {
    assert.deepEqual(describeDouble({ applies: true, reason: "perk", until: "not a date" }, now), {
      text: "Esta visita suma el doble de puntos",
      sliderDisabled: true,
    });
    assert.deepEqual(describeDouble({ applies: true, reason: null, until: null }, now), {
      text: "Esta visita suma el doble de puntos",
      sliderDisabled: true,
    });
  });

  it("writes the lapse day in Madrid time", () => {
    // 22:30 UTC on the 11th is already the 12th in Madrid (CEST, UTC+2).
    assert.equal(
      describeDouble({ applies: true, reason: "perk", until: "2026-09-11T22:30:00.000Z" }, now).text,
      "Esta visita suma el doble de puntos (ventaja hasta el 12 sept)",
    );
  });
});
