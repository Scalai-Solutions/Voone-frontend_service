import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isForwardableStaffPath } from "./staff-proxy-paths.ts";

/**
 * Change requests, treatments and bonos have dedicated /api/staff handlers that take the clinic
 * from the session. If one of these paths were ever added to the catch-all's allowlist, a
 * request the dedicated handler does not match would be forwarded with the slug the caller
 * typed, so none of them may be forwardable.
 */
describe("staff catch-all allowlist", () => {
  it("does not forward change-request, treatment or bono paths", () => {
    const paths = [
      "clinics/some-clinic/change-requests",
      "clinics/some-clinic/change-requests/abc",
      "clinics/some-clinic/change-requests/abc/messages",
      "clinics/some-clinic/change-requests/abc/reopen",
      "clinics/some-clinic/treatments",
      "clinics/some-clinic/treatments/abc",
      "clinics/some-clinic/bonos",
      "clinics/some-clinic/bonos/abc",
      "admin/change-requests",
    ];

    for (const path of paths) {
      assert.equal(isForwardableStaffPath(path.split("/")), false, path);
    }
  });

  it("still forwards a known notification path", () => {
    assert.equal(isForwardableStaffPath(["clinics", "x", "notifications"]), true);
  });
});
