import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

export async function POST(_request: Request, context: { params: Promise<{ clinicId: string }> }) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;
  const response = await staffFetch(`/v1/admin/clinics/${encodeURIComponent(clinicId)}/credentials/share`, {
    method: "POST",
  });

  return forwardResponse(response);
}