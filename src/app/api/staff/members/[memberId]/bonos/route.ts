import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * A member's bonos, with how far through each they are. Any staff member may read this: the
 * visit form needs it to offer the right session, and it carries no cost or internal figure.
 */
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
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/bonos`,
      { method: "GET" },
    ),
  );
}
