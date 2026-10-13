import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * Records a paid visit (or a prepaid session) for a member of the signed-in centre.
 *
 * The body is passed on as it arrived: the backend validates every field and answers in the
 * Spanish copy the form shows. What this handler adds is the one thing the browser must not
 * supply — which centre the visit belongs to.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;
  const body = await request.text();

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/visits`,
      { method: "POST", body },
    ),
  );
}
