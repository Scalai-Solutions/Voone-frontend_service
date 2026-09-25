import "server-only";

import { cache } from "react";

import { ApiError, type Clinic } from "@/lib/api-client";
import { getCurrentSession, isDashboardRole } from "@/lib/auth";
import { staffFetch } from "@/lib/staff-api";

export const getCurrentStaffClinic = cache(async (): Promise<Clinic> => {
  const session = await getCurrentSession();

  if (!session || !isDashboardRole(session.role)) {
    throw new ApiError("Voone staff request failed: 403", 403, "FORBIDDEN", "Forbidden");
  }

  if (!session.clinicId) {
    throw new ApiError(
      "Voone staff request failed: 409",
      409,
      "NO_CLINIC",
      "La sesión no tiene una clínica asociada."
    );
  }

  const response = await staffFetch(`/v1/admin/clinics/${encodeURIComponent(session.clinicId)}`, {
    method: "GET",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone staff request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message
    );
  }

  return response.json() as Promise<Clinic>;
});