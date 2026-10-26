import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requirePermission(PERMISSIONS.membersManage);

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;
  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}`,
    { method: "DELETE" },
  );

  return forwardResponse(response);
}

/**
 * Editing a member's own details. The same permission as adding or deleting one; the
 * backend validates every field (name cleaning, the phone normaliser, the 16-plus gate)
 * and answers in the Spanish copy the form shows.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requirePermission(PERMISSIONS.membersManage);

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;
  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}`,
    { method: "PATCH", body: await request.text() },
  );

  return forwardResponse(response);
}
