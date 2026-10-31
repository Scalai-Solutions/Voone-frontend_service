import { forwardValidatedWrite } from "@/lib/admin-api-proxy";
import { parseDraftBody } from "@/lib/change-request-parsers";
import { requireAdminSession } from "@/lib/staff-guard";

/** Links a programme draft to a REWARD or LEVEL ticket (clones the live programme if needed). */
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
    `/v1/admin/change-requests/${encodeURIComponent(id)}/draft`,
    "POST",
    parseDraftBody,
  );
}
