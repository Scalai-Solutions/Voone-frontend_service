import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildChangeRequest,
  clip,
  initialValues,
  type FormValues,
  type RequestContext,
} from "./change-request-form.ts";

const treatment = { id: "t1", name: "Limpieza facial", priceEuro: 60, categoryId: "FAC" };
const plan = { id: "b1", name: "Bono facial", totalEuro: 200, totalSessions: 5 };
const reason = "Hemos cambiado la carta";

const fill = (context: RequestContext, patch: Partial<FormValues>): FormValues => ({
  ...initialValues(context),
  reason,
  ...patch,
});

const okBody = (context: RequestContext, patch: Partial<FormValues>) => {
  const result = buildChangeRequest(context, fill(context, patch));

  assert.ok(result.ok, result.ok ? "" : JSON.stringify(result.errors));

  return result.body;
};

const errorsOf = (context: RequestContext, patch: Partial<FormValues>) => {
  const result = buildChangeRequest(context, fill(context, patch));

  assert.equal(result.ok, false);

  return result.ok ? {} : result.errors;
};

describe("service edit", () => {
  const context: RequestContext = { kind: "service-edit", treatment, usesCatalogue: true };

  it("starts from the current values", () => {
    const values = initialValues(context);

    assert.equal(values.name, "Limpieza facial");
    assert.equal(values.price, "60");
    assert.equal(values.categoryId, "FAC");
  });

  it("sends only what changed", () => {
    const body = okBody(context, { price: "65,50" });

    assert.equal(body.type, "SERVICE_EDIT");
    assert.deepEqual(body.targetRef, { treatmentId: "t1" });
    assert.deepEqual(body.proposed, { priceEuro: 65.5 });
    assert.equal(body.reason, reason);
    assert.ok(body.title.length > 0 && body.title.length <= 120);
  });

  it("asks for a change when nothing differs", () => {
    assert.match(errorsOf(context, {}).form ?? "", /al menos un dato/);
  });

  it("keeps a missing price missing (old rows) and validates the rest", () => {
    const old: RequestContext = {
      kind: "service-edit",
      treatment: { ...treatment, priceEuro: null },
      usesCatalogue: true,
    };

    assert.deepEqual(okBody(old, { name: "Otro" }).proposed, { name: "Otro" });
    assert.ok(errorsOf(context, { price: "abc" }).price);
    assert.ok(errorsOf(context, { price: "0" }).price);
    assert.ok(errorsOf(context, { price: "100001" }).price);
    assert.ok(errorsOf(context, { name: "  " }).name);
    assert.ok(errorsOf(context, { name: "a".repeat(121) }).name);
  });

  it("allows only whole euros outside the catalogue", () => {
    const plain: RequestContext = { kind: "service-edit", treatment, usesCatalogue: false };

    assert.ok(errorsOf(plain, { price: "60,5" }).price);
    assert.deepEqual(okBody(plain, { price: "70" }).proposed, { priceEuro: 70 });
  });

  it("requires a reason of 3 to 2000 characters", () => {
    assert.ok(errorsOf(context, { price: "70", reason: "  " }).reason);
    assert.ok(errorsOf(context, { price: "70", reason: "ab" }).reason);
    assert.ok(errorsOf(context, { price: "70", reason: "a".repeat(2001) }).reason);
  });
});

describe("service add and remove", () => {
  it("add needs name, price and, on the catalogue, a category", () => {
    const context: RequestContext = { kind: "service-add", usesCatalogue: true };
    const body = okBody(context, { name: "Hydrafacial", price: "80", categoryId: "FAC" });

    assert.equal(body.type, "SERVICE_ADD");
    assert.deepEqual(body.proposed, { name: "Hydrafacial", priceEuro: 80, categoryId: "FAC" });
    assert.equal(body.targetRef, undefined);

    const errors = errorsOf(context, {});

    assert.ok(errors.name && errors.price && errors.categoryId);
  });

  it("add outside the catalogue sends no category", () => {
    const context: RequestContext = { kind: "service-add", usesCatalogue: false };

    assert.deepEqual(okBody(context, { name: "Masaje", price: "40", categoryId: "FAC" }).proposed, {
      name: "Masaje",
      priceEuro: 40,
    });
  });

  it("remove needs the confirmation and the reason", () => {
    const context: RequestContext = { kind: "service-remove", treatment };

    assert.ok(errorsOf(context, {}).confirm);

    const body = okBody(context, { confirm: true });

    assert.equal(body.type, "SERVICE_REMOVE");
    assert.deepEqual(body.targetRef, { treatmentId: "t1" });
    assert.equal(body.proposed, undefined);
  });
});

describe("bonos", () => {
  it("add sends the pack price and the sessions", () => {
    const body = okBody({ kind: "bono-add" }, { name: "Bono corporal", price: "199,50", sessions: "6" });

    assert.deepEqual(body.proposed, {
      action: "add",
      name: "Bono corporal",
      priceEuro: 199.5,
      totalSessions: 6,
    });
    assert.equal(body.targetRef, undefined);
  });

  it("add refuses missing or out-of-range values", () => {
    const errors = errorsOf({ kind: "bono-add" }, { sessions: "101" });

    assert.ok(errors.name && errors.price && errors.sessions);
    assert.ok(errorsOf({ kind: "bono-add" }, { name: "x", price: "10", sessions: "2,5" }).sessions);
    assert.ok(errorsOf({ kind: "bono-add" }, { name: "x", price: "10", sessions: "0" }).sessions);
  });

  it("edit starts from the plan and sends only the changes", () => {
    const context: RequestContext = { kind: "bono-edit", plan };

    assert.equal(initialValues(context).sessions, "5");
    assert.match(errorsOf(context, {}).form ?? "", /al menos un dato/);

    const body = okBody(context, { sessions: "8" });

    assert.deepEqual(body.targetRef, { bonoId: "b1" });
    assert.deepEqual(body.proposed, { action: "edit", totalSessions: 8 });
  });

  it("remove needs the confirmation", () => {
    const context: RequestContext = { kind: "bono-remove", plan };

    assert.ok(errorsOf(context, {}).confirm);
    assert.deepEqual(okBody(context, { confirm: true }).proposed, { action: "remove" });
  });
});

describe("reward, level and other", () => {
  it("a reward row is prefilled with its milestone", () => {
    const body = okBody(
      { kind: "reward", milestone: 4, label: "Masaje" },
      { text: "Un facial" },
    );

    assert.equal(body.type, "REWARD");
    assert.deepEqual(body.targetRef, { milestone: 4 });
    assert.deepEqual(body.proposed, { text: "Un facial" });
    assert.match(body.title, /Masaje/);
  });

  it("a general reward request has no target and may have no proposal", () => {
    const body = okBody({ kind: "reward" }, {});

    assert.equal(body.targetRef, undefined);
    assert.equal(body.proposed, undefined);
  });

  it("the short text is capped at 120", () => {
    assert.ok(errorsOf({ kind: "reward", milestone: 1 }, { text: "a".repeat(121) }).text);
    assert.ok(errorsOf({ kind: "level", tier: "oro" }, { text: "a".repeat(121) }).text);
  });

  it("a level is prefilled with its tier", () => {
    const body = okBody({ kind: "level", tier: "oro", label: "Oro" }, {});

    assert.equal(body.type, "LEVEL");
    assert.deepEqual(body.targetRef, { tier: "oro" });
  });

  it("other needs a title", () => {
    assert.ok(errorsOf({ kind: "other" }, {}).title);
    assert.ok(errorsOf({ kind: "other" }, { title: "a".repeat(121) }).title);

    const body = okBody({ kind: "other" }, { title: "Una duda" });

    assert.equal(body.type, "OTHER");
    assert.equal(body.title, "Una duda");
  });
});

describe("clip", () => {
  it("cuts long titles to the limit with an ellipsis", () => {
    assert.equal(clip("corto"), "corto");
    assert.equal(clip("a".repeat(130)).length, 120);
    assert.ok(clip("a".repeat(130)).endsWith("…"));
  });

  it("keeps a long treatment name within the title limit", () => {
    const long = { ...treatment, name: "N".repeat(120) };
    const body = okBody(
      { kind: "service-edit", treatment: long, usesCatalogue: true },
      { price: "70" },
    );

    assert.ok(body.title.length <= 120);
  });
});
