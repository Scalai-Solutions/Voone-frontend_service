import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * The signed-in centre's live loyalty programme, or a 404 when it has none.
 *
 * The slug comes from the session, never from the request: a member of one centre must not be
 * able to read another's programme by changing a URL. A 404 is meaningful here — it is how the
 * dashboard learns this centre is still on the older points scheme.
 */
export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  return forwardResponse(
    await staffFetch(`/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/program`, {
      method: "GET",
    }),
  );
}
