import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * Redeems a reward against a visit. Whether that is allowed — same member, same centre, same
 * day, a payment actually recorded — is decided by the backend from stored rows, so nothing
 * here is a rule; this only fixes the centre to the one in the session.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ memberId: string; rewardId: string }> },
) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId, rewardId } = await context.params;
  const body = await request.text();

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/rewards/${encodeURIComponent(rewardId)}/redeem`,
      { method: "POST", body },
    ),
  );
}
