import "server-only";

import { ApiError, type Clinic, type Member } from "@/lib/api-client";
import { staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

async function adminFetch<T>(path: string): Promise<T> {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    const body = (await guard.response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone admin request failed: ${guard.response.status}`,
      guard.response.status,
      body?.code,
      body?.message,
    );
  }

  const response = await staffFetch(path, { method: "GET" });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone admin request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

export function getAdminClinics() {
  return adminFetch<Clinic[]>("/v1/admin/clinics");
}

export function getAdminClinic(clinicId: string) {
  return adminFetch<Clinic>(`/v1/admin/clinics/${encodeURIComponent(clinicId)}`);
}

export function getAdminMembers() {
  return adminFetch<Member[]>("/v1/admin/members");
}