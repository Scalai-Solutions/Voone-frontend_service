"use client";

import { ShieldCheck } from "lucide-react";

import type { Role } from "@/lib/auth";
import { formatRole } from "@/lib/roles";

const ROLES: Role[] = ["owner", "manager", "staff", "voone_admin"];

export function DevRoleSwitcher({ initialRole }: { initialRole: Role }) {
  return (
    <label className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-md border border-[#e3bc76]/25 bg-[#1d120e]/95 px-2.5 py-2 text-xs font-medium text-[#f7ead9] shadow-xl backdrop-blur md:bottom-5 md:right-5">
      <ShieldCheck className="h-3.5 w-3.5 text-[#e8c17e]" />
      <span className="sr-only">Rol de desarrollo</span>
      <select
        defaultValue={initialRole}
        className="max-w-28 bg-transparent text-[11px] capitalize outline-none"
        onChange={(event) => {
          document.cookie = `voone-dev-role=${event.target.value}; path=/; max-age=31536000; SameSite=Lax`;
          window.location.reload();
        }}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {formatRole(role)}
          </option>
        ))}
      </select>
    </label>
  );
}