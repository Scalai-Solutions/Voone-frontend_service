import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { serviceWriteHandlers } from "@/lib/service-write-handlers";
import { requireServiceWriteAllowed, requireStaffSession } from "@/lib/staff-guard";

const handlers = serviceWriteHandlers("bonos", {
  requireAllowed: requireServiceWriteAllowed,
  staffFetch,
  forwardResponse,
});

/**
 * The signed-in centre's bono plans: list (any staff member, the visit form reads it) and
 * create (owners and managers). The slug comes from the session, never the request, and the
 * backend's Spanish validation copy passes through unchanged.
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
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/bonos`,
      {
        method: "GET",
      },
    ),
  );
}

export const POST = handlers.POST;
