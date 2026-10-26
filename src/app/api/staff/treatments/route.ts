import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission, requireStaffSession } from "@/lib/staff-guard";

/**
 * The signed-in centre's treatments: list (any staff member) and create (owners and managers).
 *
 * Why this is a dedicated route and not left to the staff catch-all: the catch-all forwards
 * the path it is given, so the centre's slug would come from the request, and it only checks
 * for a signed-in session, not for the permission to edit the centre. Here the slug comes from
 * the session and writes require `clinicEdit`. The backend's 422 messages are Spanish copy for
 * the form and pass through unchanged.
 */
export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  return forwardResponse(
    await staffFetch(`/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/treatments`, {
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
    await staffFetch(`/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/treatments`, {
      method: "POST",
      body: await request.text(),
    }),
  );
}
