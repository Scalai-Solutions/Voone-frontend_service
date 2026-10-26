import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission, requireStaffSession } from "@/lib/staff-guard";

/**
 * The signed-in centre's bono plans: list (any staff member, the visit form reads it) and
 * create (owners and managers). The slug comes from the session, never the request, and the
 * backend's Spanish validation copy passes through unchanged.
 */
export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  return forwardResponse(
    await staffFetch(`/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/bonos`, {
      method: "GET",
    }),
  );
}

export async function POST(request: Request) {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard.response;
  }

  return forwardResponse(
    await staffFetch(`/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/bonos`, {
      method: "POST",
      body: await request.text(),
    }),
  );
}
