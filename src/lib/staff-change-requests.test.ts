import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isValidRequestId,
  listQueryString,
  parseCreateRequest,
  parseListQuery,
  parseMessageBody,
  parseReopenBody,
  type CreateChangeRequestBody,
} from "./staff-change-requests.ts";

/** Run with `npm test`. The shapes mirror the backend README of the change-requests module. */

const base = { title: "Cambiar precio", reason: "Hemos subido el precio" };

const ok = (input: unknown): CreateChangeRequestBody => {
  const result = parseCreateRequest(input);

  assert.ok(result.ok, result.ok ? "" : result.message);

  return result.value;
};

const refused = (input: unknown): string => {
  const result = parseCreateRequest(input);

  assert.equal(result.ok, false, "expected a refusal");

  return result.ok ? "" : result.message;
};

describe("parseCreateRequest: common rules", () => {
  it("refuses a body that is not an object", () => {
    for (const input of [null, "x", 3, [], undefined]) refused(input);
  });

  it("refuses keys it does not know, so clinicId, status or createdByEmail never travel", () => {
    for (const key of ["clinicId", "status", "createdByEmail", "programId"]) {
      refused({ ...base, type: "OTHER", [key]: "x" });
    }
  });

  it("refuses an unknown type", () => {
    assert.match(refused({ ...base, type: "ADMIN" }), /tipo/);
    refused({ ...base });
  });

  it("limits the title to 120 and requires it", () => {
    assert.equal(ok({ ...base, type: "OTHER", title: "a".repeat(120) }).title.length, 120);
    refused({ ...base, type: "OTHER", title: "a".repeat(121) });
    refused({ ...base, type: "OTHER", title: "   " });
    refused({ ...base, type: "OTHER", title: 4 });
  });

  it("limits the reason to 3..2000 after cleaning and keeps line breaks", () => {
    assert.equal(ok({ ...base, type: "OTHER", reason: "abc" }).reason, "abc");
    refused({ ...base, type: "OTHER", reason: "ab" });
    // Control characters must not pad a text past its minimum.
    refused({ ...base, type: "OTHER", reason: "\u0007\u0000 a\u0007\u0000" });
    refused({ ...base, type: "OTHER", reason: "a".repeat(2001) });
    assert.equal(ok({ ...base, type: "OTHER", reason: "a".repeat(2000) }).reason.length, 2000);
    assert.equal(ok({ ...base, type: "OTHER", reason: "uno\r\ndos" }).reason, "uno\ndos");
  });

  it("makes the title one line and strips control characters", () => {
    assert.equal(ok({ ...base, type: "OTHER", title: " a\nb\u0000c " }).title, "a bc");
  });

  it("accepts OTHER with neither reference nor proposal and refuses either", () => {
    const body = ok({ ...base, type: "OTHER" });

    assert.deepEqual(Object.keys(body).sort(), ["reason", "title", "type"]);
    ok({ ...base, type: "OTHER", targetRef: null, proposed: null });
    refused({ ...base, type: "OTHER", targetRef: { treatmentId: "t1" } });
    refused({ ...base, type: "OTHER", proposed: { text: "x" } });
  });
});

describe("parseCreateRequest: SERVICE_EDIT", () => {
  const type = "SERVICE_EDIT";

  it("needs a target and at least one change", () => {
    refused({ ...base, type });
    refused({ ...base, type, targetRef: { treatmentId: "t1" } });
    refused({ ...base, type, targetRef: { treatmentId: "t1" }, proposed: {} });
    refused({ ...base, type, proposed: { priceEuro: 50 } });
  });

  it("accepts name, price and category and keeps only what was given", () => {
    const body = ok({
      ...base,
      type,
      targetRef: { treatmentId: "t1" },
      proposed: { name: " Peeling ", priceEuro: 49.5, categoryId: "FAC" },
    });

    assert.deepEqual(body.proposed, { name: "Peeling", priceEuro: 49.5, categoryId: "FAC" });
    assert.deepEqual(body.targetRef, { treatmentId: "t1" });
  });

  it("refuses an empty category, a string price and more than two decimals", () => {
    const target = { treatmentId: "t1" };

    refused({ ...base, type, targetRef: target, proposed: { categoryId: "" } });
    refused({ ...base, type, targetRef: target, proposed: { priceEuro: "50" } });
    refused({ ...base, type, targetRef: target, proposed: { priceEuro: 50.123 } });
    refused({ ...base, type, targetRef: target, proposed: { priceEuro: 0 } });
    refused({ ...base, type, targetRef: target, proposed: { priceEuro: 100001 } });
    ok({ ...base, type, targetRef: target, proposed: { priceEuro: 0.01 } });
    ok({ ...base, type, targetRef: target, proposed: { priceEuro: 100000 } });
  });

  it("refuses a treatmentId repeated with a different value", () => {
    refused({
      ...base,
      type,
      targetRef: { treatmentId: "t1" },
      proposed: { treatmentId: "t2", priceEuro: 5 },
    });
    ok({
      ...base,
      type,
      targetRef: { treatmentId: "t1" },
      proposed: { treatmentId: "t1", priceEuro: 5 },
    });
  });
});

describe("parseCreateRequest: SERVICE_ADD and SERVICE_REMOVE", () => {
  it("SERVICE_ADD needs name and price, takes no reference", () => {
    const body = ok({
      ...base,
      type: "SERVICE_ADD",
      proposed: { name: "Hydrafacial", priceEuro: 80 },
    });

    assert.equal(body.targetRef, undefined);
    refused({ ...base, type: "SERVICE_ADD" });
    refused({ ...base, type: "SERVICE_ADD", proposed: { name: "x" } });
    refused({ ...base, type: "SERVICE_ADD", proposed: { priceEuro: 3 } });
    refused({
      ...base,
      type: "SERVICE_ADD",
      targetRef: { treatmentId: "t1" },
      proposed: { name: "x", priceEuro: 3 },
    });
  });

  it("SERVICE_REMOVE needs the treatment and nothing else", () => {
    assert.deepEqual(
      ok({ ...base, type: "SERVICE_REMOVE", targetRef: { treatmentId: "t1" } }).targetRef,
      { treatmentId: "t1" },
    );
    refused({ ...base, type: "SERVICE_REMOVE" });
    refused({
      ...base,
      type: "SERVICE_REMOVE",
      targetRef: { treatmentId: "t1" },
      proposed: { name: "x" },
    });
  });
});

describe("parseCreateRequest: BONO", () => {
  it("add: needs name, pack price and sessions, refuses a reference", () => {
    const proposed = { action: "add", name: "Bono facial", priceEuro: 199.5, totalSessions: 5 };

    assert.deepEqual(ok({ ...base, type: "BONO", proposed }).proposed, proposed);
    refused({ ...base, type: "BONO", proposed: { action: "add", name: "x", priceEuro: 3 } });
    refused({ ...base, type: "BONO", targetRef: { bonoId: "b1" }, proposed });
    refused({ ...base, type: "BONO", proposed: { ...proposed, totalSessions: 101 } });
    refused({ ...base, type: "BONO", proposed: { ...proposed, totalSessions: 2.5 } });
    refused({ ...base, type: "BONO", proposed: { ...proposed, totalSessions: 0 } });
  });

  it("edit: needs the bono and a change", () => {
    const target = { bonoId: "b1" };

    ok({ ...base, type: "BONO", targetRef: target, proposed: { action: "edit", totalSessions: 6 } });
    refused({ ...base, type: "BONO", proposed: { action: "edit", totalSessions: 6 } });
    refused({ ...base, type: "BONO", targetRef: target, proposed: { action: "edit" } });
  });

  it("remove: needs the bono", () => {
    ok({ ...base, type: "BONO", targetRef: { bonoId: "b1" }, proposed: { action: "remove" } });
    refused({ ...base, type: "BONO", proposed: { action: "remove" } });
  });

  it("refuses an unknown or missing action", () => {
    assert.match(
      refused({ ...base, type: "BONO", proposed: { action: "burn" } }),
      /añadir, editar o quitar/,
    );
    refused({ ...base, type: "BONO", proposed: { name: "x" } });
    refused({ ...base, type: "BONO", proposed: "add" });
  });
});

describe("parseCreateRequest: REWARD and LEVEL", () => {
  it("REWARD: reference and proposal are optional; the milestone is an integer from 1", () => {
    ok({ ...base, type: "REWARD" });
    assert.deepEqual(
      ok({ ...base, type: "REWARD", targetRef: { milestone: 3 }, proposed: { text: "Un masaje" } })
        .targetRef,
      { milestone: 3 },
    );
    refused({ ...base, type: "REWARD", targetRef: { milestone: 0 } });
    refused({ ...base, type: "REWARD", targetRef: { milestone: 1.5 } });
    refused({ ...base, type: "REWARD", targetRef: { milestone: "3" } });
    refused({ ...base, type: "REWARD", targetRef: { tier: "oro" } });
  });

  it("REWARD: the proposed text is capped at 120 (longer goes in the reason)", () => {
    ok({ ...base, type: "REWARD", proposed: { text: "a".repeat(120) } });
    refused({ ...base, type: "REWARD", proposed: { text: "a".repeat(121) } });
    refused({ ...base, type: "REWARD", proposed: { text: "" } });
  });

  it("REWARD: a milestone repeated with a different value is refused", () => {
    refused({
      ...base,
      type: "REWARD",
      targetRef: { milestone: 2 },
      proposed: { milestone: 3, text: "x" },
    });
  });

  it("LEVEL: tier up to 32 characters, text up to 120", () => {
    ok({ ...base, type: "LEVEL", targetRef: { tier: "oro" }, proposed: { text: "Más descuento" } });
    refused({ ...base, type: "LEVEL", targetRef: { tier: "a".repeat(33) } });
    refused({ ...base, type: "LEVEL", targetRef: { milestone: 1 } });
    refused({ ...base, type: "LEVEL", proposed: { text: "a".repeat(121) } });
  });
});

describe("parseMessageBody and parseReopenBody", () => {
  it("accepts a body of 1..2000 characters and nothing else", () => {
    assert.deepEqual(parseMessageBody({ body: " hola " }), { ok: true, value: { body: "hola" } });
    assert.equal(parseMessageBody({ body: "" }).ok, false);
    assert.equal(parseMessageBody({ body: "a".repeat(2001) }).ok, false);
    assert.equal(parseMessageBody({ body: "x", status: "RESOLVED" }).ok, false);
    assert.equal(parseMessageBody(null).ok, false);
  });

  it("reopen: the message is optional", () => {
    assert.deepEqual(parseReopenBody(undefined), { ok: true, value: {} });
    assert.deepEqual(parseReopenBody({}), { ok: true, value: {} });
    assert.deepEqual(parseReopenBody({ message: "Sigue mal" }), {
      ok: true,
      value: { message: "Sigue mal" },
    });
    assert.equal(parseReopenBody({ message: "x", extra: 1 }).ok, false);
    assert.equal(parseReopenBody({ message: "a".repeat(2001) }).ok, false);
  });
});

describe("request ids and list queries", () => {
  it("accepts opaque ids only", () => {
    assert.ok(isValidRequestId("cmabc123_-X"));
    for (const bad of ["", ".", "..", "a/b", "a b", "a".repeat(65), "a?b", "%2e%2e"]) {
      assert.equal(isValidRequestId(bad), false, bad);
    }
  });

  it("keeps status, limit and cursor and drops everything else", () => {
    const parsed = parseListQuery(
      new URLSearchParams("status=OPEN&limit=20&cursor=abc_-=&clinicId=other&q=x"),
    );

    assert.deepEqual(parsed, { ok: true, value: { status: "OPEN", limit: 20, cursor: "abc_-=" } });
    assert.equal(listQueryString(parsed.ok ? parsed.value : {}), "?status=OPEN&limit=20&cursor=abc_-%3D");
    assert.equal(listQueryString({}), "");
  });

  it("refuses a bad status, limit or cursor", () => {
    for (const q of ["status=DONE", "limit=0", "limit=51", "limit=abc", "limit=1e1", "cursor=a/b", `cursor=${"a".repeat(201)}`]) {
      assert.equal(parseListQuery(new URLSearchParams(q)).ok, false, q);
    }
  });
});
