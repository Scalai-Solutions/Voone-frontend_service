import { forwardClinicSlugRoute } from "@/lib/admin-api-proxy";
import { requireAdminSession } from "@/lib/staff-guard";

/** The categories a treatment can belong to (the backend's own list, Spanish labels). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ clinicId: string }> },
) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;

  return forwardClinicSlugRoute(null, clinicId, "treatment-categories", "GET");
}
