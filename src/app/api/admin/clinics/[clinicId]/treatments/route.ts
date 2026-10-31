import { forwardClinicSlugRoute } from "@/lib/admin-api-proxy";
import { parseTreatmentCreate } from "@/lib/admin-catalogue-parsers";
import { requireAdminSession } from "@/lib/staff-guard";

type Context = { params: Promise<{ clinicId: string }> };

/**
 * A clinic's treatments for the admin services editor: list and add.
 *
 * The owner can no longer edit these (their changes go through tickets), so the admin edits
 * here. The backend route is the centre's own slug-based one, so the admin goes through the
 * same validation the owner used to. The clinic comes from the URL because an administrator
 * acts on any clinic; the admin session is what protects that.
 */
export async function GET(_request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;

  return forwardClinicSlugRoute(null, clinicId, "treatments", "GET");
}

export async function POST(request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;

  return forwardClinicSlugRoute(
    request,
    clinicId,
    "treatments",
    "POST",
    parseTreatmentCreate,
  );
}
