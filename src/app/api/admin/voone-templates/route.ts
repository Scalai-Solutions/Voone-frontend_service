import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

export async function POST(request: Request) {
  const guard = await requireAdminSession();
  if ("response" in guard) return guard.response;

  const response = await staffFetch("/v1/voone-templates", {
    method: "POST",
    body: await request.text(),
  });

  return forwardResponse(response);
}
