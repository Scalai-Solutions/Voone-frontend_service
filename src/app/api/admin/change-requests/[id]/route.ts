import { adminTicketFetch } from "@/lib/admin-ticket-proxy";
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

  return forwardResponse(
    await adminTicketFetch(
      `/v1/admin/change-requests/${encodeURIComponent(id)}`,
      { method: "GET" },
    ),
  );
}
