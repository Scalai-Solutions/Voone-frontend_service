import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STATUS_LABELS,
  TYPE_LABELS,
  canReply,
  describeRequest,
  formatRequestDate,
  formatRequestEuros,
  isReopenable,
  lastActivity,
} from "./change-request-display.ts";

const NOW = Date.parse("2026-11-01T12:00:00Z");
const future = "2026-11-10T12:00:00.000Z";
const past = "2026-10-20T12:00:00.000Z";

describe("labels", () => {
  it("names the four statuses in Spanish", () => {
    assert.deepEqual(STATUS_LABELS, {
      OPEN: "Abierta",
      IN_PROGRESS: "En curso",
      RESOLVED: "Resuelta",
      REJECTED: "Rechazada",
    });
  });

  it("has a label for every type", () => {
    assert.equal(Object.keys(TYPE_LABELS).length, 7);
  });
});

describe("describeRequest", () => {
  it("puts a service edit in plain words", () => {
    const lines = describeRequest(
      {
        type: "SERVICE_EDIT",
        targetRef: { treatmentId: "t1" },
        proposed: { name: "Peeling", priceEuro: 65.5, categoryId: "FAC" },
      },
      (id) => (id === "FAC" ? "Facial" : undefined),
    );

    assert.deepEqual(lines, [
      { label: "Nombre nuevo", value: "Peeling" },
      { label: "Precio nuevo", value: "65,50 €" },
      { label: "Categoría nueva", value: "Facial" },
    ]);
  });

  it("does not show a raw category id it cannot name", () => {
    const lines = describeRequest({
      type: "SERVICE_ADD",
      targetRef: null,
      proposed: { name: "Masaje", priceEuro: 40, categoryId: "XYZ" },
    });

    assert.deepEqual(lines.map((l) => l.label), ["Nombre", "Precio"]);
  });

  it("describes the three bono actions", () => {
    const add = describeRequest({
      type: "BONO",
      targetRef: null,
      proposed: { action: "add", name: "Facial x5", priceEuro: 199.5, totalSessions: 5 },
    });

    assert.deepEqual(add, [
      { label: "Qué pides", value: "Añadir un bono nuevo" },
      { label: "Nombre", value: "Facial x5" },
      { label: "Precio del bono", value: "199,50 €" },
      { label: "Sesiones", value: "5 sesiones" },
    ]);
    assert.equal(
      describeRequest({
        type: "BONO",
        targetRef: { bonoId: "b" },
        proposed: { action: "edit", totalSessions: 1 },
      }).at(-1)?.value,
      "1 sesión",
    );
    assert.deepEqual(
      describeRequest({ type: "BONO", targetRef: { bonoId: "b" }, proposed: { action: "remove" } }),
      [{ label: "Qué pides", value: "Dar de baja este bono" }],
    );
  });

  it("describes rewards, levels, removals and nothing for OTHER", () => {
    assert.deepEqual(
      describeRequest({
        type: "REWARD",
        targetRef: { milestone: 3 },
        proposed: { text: "Un masaje" },
      }),
      [
        { label: "Hito", value: "Hito 3" },
        { label: "Premio propuesto", value: "Un masaje" },
      ],
    );
    assert.deepEqual(
      describeRequest({ type: "LEVEL", targetRef: { tier: "oro" }, proposed: null }),
      [{ label: "Nivel", value: "Oro" }],
    );
    assert.equal(
      describeRequest({ type: "SERVICE_REMOVE", targetRef: { treatmentId: "t" }, proposed: null })[0]?.value,
      "Dar de baja este servicio",
    );
    assert.deepEqual(describeRequest({ type: "OTHER", targetRef: null, proposed: null }), []);
  });
});

describe("reopening and replying", () => {
  it("reopens a closed request only while reopenableUntil is in the future", () => {
    assert.equal(isReopenable({ status: "RESOLVED", reopenableUntil: future }, NOW), true);
    assert.equal(isReopenable({ status: "REJECTED", reopenableUntil: future }, NOW), true);
    assert.equal(isReopenable({ status: "RESOLVED", reopenableUntil: past }, NOW), false);
    assert.equal(isReopenable({ status: "RESOLVED", reopenableUntil: null }, NOW), false);
    assert.equal(isReopenable({ status: "OPEN", reopenableUntil: future }, NOW), false);
    assert.equal(isReopenable({ status: "RESOLVED", reopenableUntil: "nope" }, NOW), false);
  });

  it("takes a reply while open, and when closed only inside the window", () => {
    assert.equal(canReply({ status: "OPEN", reopenableUntil: null }, NOW), true);
    assert.equal(canReply({ status: "IN_PROGRESS", reopenableUntil: null }, NOW), true);
    assert.equal(canReply({ status: "RESOLVED", reopenableUntil: future }, NOW), true);
    assert.equal(canReply({ status: "RESOLVED", reopenableUntil: null }, NOW), false);
    assert.equal(canReply({ status: "REJECTED", reopenableUntil: past }, NOW), false);
  });
});

describe("dates and money", () => {
  it("picks the latest activity", () => {
    assert.equal(
      lastActivity({
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-03T00:00:00Z",
        lastMessageAt: "2026-10-05T00:00:00Z",
      }),
      "2026-10-05T00:00:00Z",
    );
    assert.equal(
      lastActivity({ createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-03T00:00:00Z", lastMessageAt: null }),
      "2026-10-03T00:00:00Z",
    );
  });

  it("formats dates in Spanish and prices as typed in Spain", () => {
    assert.match(formatRequestDate("2026-10-31T12:00:00Z", "UTC"), /^31 oct\.? 2026$/);
    assert.equal(formatRequestDate("garbage"), "");
    assert.equal(formatRequestEuros(60), "60 €");
    assert.equal(formatRequestEuros(60.5), "60,50 €");
    assert.equal(formatRequestEuros(1234.56), "1234,56 €");
  });
});
