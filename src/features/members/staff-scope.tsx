"use client";

import * as React from "react";

import { STAFF_API_BASE } from "@/lib/api-client";

/**
 * Which clinic the members screens (list, profile, visits, rewards, bonos) talk to.
 *
 * The clinic dashboard renders them with no provider: the staff routes take the clinic from the
 * session, exactly as before. The admin portal wraps them in `StaffScopeProvider` for one
 * clinic, and the same screens then go through the admin proxy for that clinic id.
 */
export interface StaffScope {
  /** The browser-side API base the calls are made under. */
  apiBase: string;
  /** Set only in the admin portal: the clinic chosen there. */
  clinicId?: string;
  /** Where the members list lives; a profile is `${membersHref}/<id>`. */
  membersHref: string;
}

export const STAFF_SCOPE: StaffScope = {
  apiBase: STAFF_API_BASE,
  membersHref: "/dashboard/members",
};

export const adminClinicScope = (clinicId: string): StaffScope => ({
  apiBase: `/api/admin/clinics/${encodeURIComponent(clinicId)}/staff`,
  clinicId,
  membersHref: `/admin/clinics/${encodeURIComponent(clinicId)}/members`,
});

const StaffScopeContext = React.createContext<StaffScope>(STAFF_SCOPE);

export function StaffScopeProvider({
  clinicId,
  children,
}: {
  clinicId: string;
  children: React.ReactNode;
}) {
  const scope = React.useMemo(() => adminClinicScope(clinicId), [clinicId]);

  return (
    <StaffScopeContext.Provider value={scope}>
      {children}
    </StaffScopeContext.Provider>
  );
}

export const useStaffScope = (): StaffScope => React.useContext(StaffScopeContext);

/**
 * A clinic-wide query key (members list, programme, catalogue, bono plans) for this scope. The
 * staff key is returned unchanged; the admin's gets the clinic id appended, so two clinics opened
 * one after the other never share a cache entry, and prefix invalidations still reach both.
 */
export const scopedKey = <K extends readonly unknown[]>(
  key: K,
  scope: StaffScope,
): readonly unknown[] => (scope.clinicId ? [...key, scope.clinicId] : key);
