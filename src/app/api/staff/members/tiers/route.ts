import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

/** The tiers the clinic's members are shown under, with a count each; clinic from the session. */
export async function GET() {
  const guard = await requirePermission(PERMISSIONS.membersManage);

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/tiers`,
    { method: "GET" },
  );

  return forwardResponse(response);
}
