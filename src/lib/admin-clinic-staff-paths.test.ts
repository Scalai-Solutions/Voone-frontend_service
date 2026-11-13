import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isForwardableClinicStaffPath } from "./admin-clinic-staff-paths.ts";

/**
 * Run with `npm test` (Node's built-in runner; no extra dependency).
 *
 * The admin's members screens reuse the clinic dashboard's, so every call they make must be on
 * the admin proxy's allowlist or it fails only in the deployed UI. This lists each call made by
 * the members hooks (features/members, features/program, features/bonos) and the audiences
 * table. Keep it in step with them.
 */
const USED_BY_MEMBER_SCREENS: Array<[method: string, path: string]> = [
  ["GET", "members"],
  ["GET", "members/m_1"],
  ["PATCH", "members/m_1"],
  ["DELETE", "members/m_1"],
  ["POST", "members/m_1/points"],
  ["POST", "members/m_1/pass"],
  ["POST", "members/m_1/visits"],
  ["GET", "members/m_1/rewards"],
  ["POST", "members/m_1/rewards/r_1/redeem"],
  ["GET", "members/m_1/bonos"],
  ["POST", "members/m_1/bonos/b_1/cancel"],
  ["GET", "bonos"],
  ["GET", "catalog"],
  ["GET", "program"],
  ["GET", "clinics/c_1/audiences"],
  ["POST", "clinics/c_1/audiences"],
  ["DELETE", "clinics/c_1/audiences/a_1"],
];

const split = (path: string) => path.split("/");

describe("admin members proxy allowlist", () => {
  it("forwards every call the members screens make", () => {
    for (const [method, path] of USED_BY_MEMBER_SCREENS) {
      assert.equal(isForwardableClinicStaffPath(split(path), method), true, `${method} ${path}`);
    }
  });

  it("refuses anything else: other routes, other methods, empty segments", () => {
    const refused: Array<[string, string]> = [
      ["POST", "members"],
      ["PUT", "members/m_1"],
      ["POST", "bonos"],
      ["PATCH", "bonos/b_1"],
      ["GET", "members/lookup/extra"],
      ["POST", "members/m_1/pass/email"],
      ["GET", "notifications"],
      ["POST", "clinics/c_1/notifications/broadcast"],
      ["GET", "clinics/c_1/users"],
      ["GET", "members//rewards"],
    ];

    for (const [method, path] of refused) {
      assert.equal(isForwardableClinicStaffPath(split(path), method), false, `${method} ${path}`);
    }
  });
});
