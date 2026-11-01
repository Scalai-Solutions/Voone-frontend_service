import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLINIC_INFO_FIELDS, parseClinicInfoBody } from "./clinic-info-fields.ts";

const refused = (raw: string) => {
  const result = parseClinicInfoBody(raw);

  assert.equal(result.ok, false);

  return result.ok ? "" : result.message;
};

describe("parseClinicInfoBody", () => {
  it("accepts every allowed field and returns exactly what was sent", () => {
    const body = Object.fromEntries(CLINIC_INFO_FIELDS.map((key) => [key, `${key} value`]));
    const result = parseClinicInfoBody(JSON.stringify(body));

    assert.deepEqual(result, { ok: true, value: body });
  });

  it("accepts a partial body and empty strings (clearing a billing field)", () => {
    assert.deepEqual(parseClinicInfoBody('{"billingTaxId":""}'), {
      ok: true,
      value: { billingTaxId: "" },
    });
    assert.deepEqual(parseClinicInfoBody("{}"), { ok: true, value: {} });
  });

  it("refuses the privileged fields with a Spanish message", () => {
    for (const body of [
      { name: "Centro", voonePlan: "ENTERPRISE" },
      { isActive: false },
      { name: "Centro", isActive: true },
      { slug: "otro-centro" },
      { notificationMonthlyQuota: 100000 },
      { name: "Centro", extra: 1 },
    ]) {
      assert.equal(
        refused(JSON.stringify(body)),
        "Solo se pueden modificar los datos del centro y de facturación.",
      );
    }
  });

  it("refuses a privileged key even when it looks harmless or is set to null", () => {
    refused('{"voonePlan":null}');
    refused('{"__proto__":{"voonePlan":"X"},"name":"a"}');
    refused('{"constructor":"x"}');
  });

  it("refuses anything that is not a JSON object", () => {
    for (const raw of ["", "not json", "null", "[]", '"name"', "42", '[{"name":"a"}]']) {
      assert.equal(refused(raw), "La solicitud no es válida.");
    }
  });

  it("refuses non-string values", () => {
    assert.equal(refused('{"name":5}'), "Los datos del centro deben ser texto.");
    assert.equal(refused('{"billingEmail":null}'), "Los datos del centro deben ser texto.");
    assert.equal(refused('{"name":{"a":1}}'), "Los datos del centro deben ser texto.");
  });
});
