import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * Takes back a visit recorded by mistake, for the signed-in centre.
 *
 * The backend checks the visit is this centre's and decides whether it may still be voided (within
 * 24 hours, the client's latest, nothing already used), answering in the Spanish copy the history
 * shows. What this handler adds is the one thing the browser must not supply: which centre.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ visitId: string }> },
) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { visitId } = await context.params;
  const body = await request.text();

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/visits/${encodeURIComponent(visitId)}/void`,
      { method: "POST", body: body || "{}" },
    ),
  );
}
