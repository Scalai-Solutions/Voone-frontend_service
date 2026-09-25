import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

export async function GET() {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch("/v1/admin/members", { method: "GET" });

  return forwardResponse(response);
}