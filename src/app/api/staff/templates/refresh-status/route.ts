import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * How many cards a design change reaches and where the last change stands, for the signed-in
 * centre. The backend needs the staff key and the clinic header, so the browser cannot call it
 * directly; x-clinic-id comes from the session, never from the request. A read, so a staff
 * session is enough.
 */
export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  return forwardResponse(
    await staffFetch("/v1/templates/refresh-status", {
      method: "GET",
      headers: { "x-clinic-id": guard.session.clinicId },
    }),
  );
}
