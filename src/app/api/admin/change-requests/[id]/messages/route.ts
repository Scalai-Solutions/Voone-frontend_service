import { forwardValidatedWrite } from "@/lib/admin-api-proxy";
import { parseMessageBody } from "@/lib/change-request-parsers";
import { requireAdminSession } from "@/lib/staff-guard";

/** A Voone reply in the thread. Never changes the status. */
export async function POST(
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
    `/v1/admin/change-requests/${encodeURIComponent(id)}/messages`,
    "POST",
    parseMessageBody,
  );
}
