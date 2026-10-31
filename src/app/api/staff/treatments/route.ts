import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireServiceWriteAllowed, requireStaffSession } from "@/lib/staff-guard";

/**
 * The signed-in centre's treatments: list (any staff member) and create (owners and managers).
 *
 * Why this is a dedicated route and not left to the staff catch-all: the catch-all forwards
 * the path it is given, so the centre's slug would come from the request, and it only checks
 * for a signed-in session, not for the permission to edit the centre. Here the slug comes from
 * the session and writes require `clinicEdit`. The backend's 422 messages are Spanish copy for
 * the form and pass through unchanged.
 *
 * Writes are closed to the centre itself: services change through a change request that Voone
 * resolves (`requireServiceWriteAllowed` answers 403 USE_CHANGE_REQUEST before the body is read).
 * The handlers stay so the contract is explicit and a Voone-side caller could reuse them.
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
  const guard = await requireServiceWriteAllowed();

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
