import "server-only";

import type { DashboardOverview } from "@/lib/api-client";
import { staffFetch } from "@/lib/staff-api";

/**
 * The clinic overview through the session-scoped proxy, or null when the backend answers with an error. The
 * caller decides what a missing overview looks like; it never gets invented figures.
 */
export async function fetchDashboardOverview(clinicId: string): Promise<DashboardOverview | null> {
  const response = await staffFetch(`/v1/dashboard/overview?clinicId=${encodeURIComponent(clinicId)}`, {
    method: "GET",
  });

  if (!response.ok) return null;

  return (await response.json()) as DashboardOverview;
}
