import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

/**
 * Cancelling a bono the member will not finish. Members-manage permission rather than
 * clinicEdit: it is an action on the member's record, not on the centre's price list.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ memberId: string; bonoId: string }> },
) {
  const guard = await requirePermission(PERMISSIONS.membersManage);

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId, bonoId } = await context.params;

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/bonos/${encodeURIComponent(bonoId)}/cancel`,
      { method: "POST" },
    ),
  );
}
