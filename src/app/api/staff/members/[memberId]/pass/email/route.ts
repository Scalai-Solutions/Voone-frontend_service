import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

export async function POST(
  _request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requirePermission(PERMISSIONS.membersManage);

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;
  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/pass/email`,
    { method: "POST" },
  );

  return forwardResponse(response);
}