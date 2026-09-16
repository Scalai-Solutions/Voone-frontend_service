import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * Creates the clinic's template.
 *
 * The clinic is taken from the session and sent as x-clinic-id, so the backend's
 * header-based scoping is fed something the caller cannot choose. The body is forwarded
 * unvalidated on purpose — the backend owns that schema, and duplicating it here would
 * give two places to keep in step and a second set of error messages.
 */
export async function POST(request: Request) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch("/v1/templates", {
    method: "POST",
    headers: { "x-clinic-id": guard.session.clinicId },
    body: await request.text(),
  });

  return forwardResponse(response);
}
