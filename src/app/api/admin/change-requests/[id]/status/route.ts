import { forwardValidatedWrite } from "@/lib/admin-ticket-proxy";
import { parseStatusBody } from "@/lib/change-request-parsers";
import { requireAdminSession } from "@/lib/staff-guard";

/** Moves a ticket (start work, resolve, reject, reopen). Resolve and reject need a note. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { id } = await context.params;

  return forwardValidatedWrite(
    request,
    `/v1/admin/change-requests/${encodeURIComponent(id)}/status`,
    "PATCH",
    parseStatusBody,
  );
}
