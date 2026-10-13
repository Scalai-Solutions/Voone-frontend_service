import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/** A member's rewards, for the signed-in centre only. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/rewards`,
      { method: "GET" },
    ),
  );
}
