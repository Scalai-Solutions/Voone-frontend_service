import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  USE_CHANGE_REQUEST,
  changeRequestRole,
  serviceWriteRefusal,
} from "./change-request-guard.ts";

describe("changeRequestRole", () => {
  it("lets the owner and the manager open tickets, lowercase", () => {
    assert.equal(changeRequestRole({ role: "owner" }), "owner");
    assert.equal(changeRequestRole({ role: "manager" }), "manager");
  });

  it("refuses team members (even with clinic-edit), Voone admins and no session", () => {
    assert.equal(changeRequestRole({ role: "staff" }), null);
    assert.equal(changeRequestRole({ role: "voone_admin" }), null);
    assert.equal(changeRequestRole({ role: "OWNER" }), null);
    assert.equal(changeRequestRole(null), null);
    assert.equal(changeRequestRole(undefined), null);
  });
});

describe("serviceWriteRefusal", () => {
  it("refuses every clinic role with the ticket message", () => {
    for (const role of ["owner", "manager", "staff"]) {
      assert.deepEqual(serviceWriteRefusal(role), {
        code: "USE_CHANGE_REQUEST",
        message: "Para cambiar los servicios, solicita un cambio a Voone.",
      });
    }
  });

  it("refuses an unknown role or none at all", () => {
    assert.equal(serviceWriteRefusal(undefined), USE_CHANGE_REQUEST);
    assert.equal(serviceWriteRefusal(null), USE_CHANGE_REQUEST);
    assert.equal(serviceWriteRefusal("whatever"), USE_CHANGE_REQUEST);
  });

  it("lets a Voone admin through", () => {
    assert.equal(serviceWriteRefusal("voone_admin"), null);
  });
});
