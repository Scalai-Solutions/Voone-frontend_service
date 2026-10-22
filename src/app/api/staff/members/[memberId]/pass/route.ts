import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

/**
 * The add-to-wallet link for an existing member of the signed-in centre. The centre comes from
 * the session, never from the browser, so staff cannot ask for another centre's member.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requirePermission(PERMISSIONS.membersManage);

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/pass`,
      { method: "POST" },
    ),
  );
}
