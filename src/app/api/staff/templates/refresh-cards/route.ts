import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

/**
 * Asks the backend to rebuild every installed wallet card of the signed-in clinic.
 *
 * Saving a template already does this; this is the retry for a clinic whose members report an
 * old card. The clinic comes from the session, never from the request.
 */
export async function POST() {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch("/v1/templates/refresh-cards", {
    method: "POST",
    headers: { "x-clinic-id": guard.session.clinicId },
  });

  return forwardResponse(response);
}
