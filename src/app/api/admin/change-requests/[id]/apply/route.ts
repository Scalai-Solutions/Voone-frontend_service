import { forwardValidatedWrite } from "@/lib/admin-ticket-proxy";
import { parseApplyBody } from "@/lib/change-request-parsers";
import { requireAdminSession } from "@/lib/staff-guard";

/** Carries out a SERVICE_* or BONO ticket and resolves it, in one backend transaction. */
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
    `/v1/admin/change-requests/${encodeURIComponent(id)}/apply`,
    "POST",
    parseApplyBody,
  );
}
