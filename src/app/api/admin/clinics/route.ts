import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

export async function GET() {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch("/v1/admin/clinics", { method: "GET" });

  return forwardResponse(response);
}

/**
 * Onboards a clinic.
 *
 * Requires a voone_admin session, which is the check the backend cannot make: its key only
 * proves a request came from this app, not who is behind it. The body is forwarded
 * unvalidated on purpose — the backend owns that schema, and duplicating it here would give
 * two places to keep in step and two sets of error messages for the form to render.
 */
export async function POST(request: Request) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch("/v1/admin/clinics", {
    method: "POST",
    body: await request.text()
  });

  return forwardResponse(response);
}
