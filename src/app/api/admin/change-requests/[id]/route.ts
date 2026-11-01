import {
  adminApiFetch,
  rejectBadIds,
} from "@/lib/admin-api-proxy";
import { forwardResponse } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { id } = await context.params;

  const badId = rejectBadIds(id);

  if (badId) {
    return badId;
  }

  return forwardResponse(
    await adminApiFetch(
      `/v1/admin/change-requests/${encodeURIComponent(id)}`,
      { method: "GET" },
    ),
  );
}
