import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * The signed-in centre's own catalogue (name, price, category), for the visit form.
 *
 * The slug comes from the session, never from the request, so one centre cannot read another's.
 */
export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  return forwardResponse(
    await staffFetch(`/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/catalog`, {
      method: "GET",
    }),
  );
}
