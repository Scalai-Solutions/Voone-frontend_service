import { forwardClinicSlugRoute } from "@/lib/admin-api-proxy";
import { parseTreatmentUpdate } from "@/lib/admin-catalogue-parsers";
import { requireAdminSession } from "@/lib/staff-guard";

type Context = { params: Promise<{ clinicId: string; id: string }> };

/** Edits or removes one treatment. The backend looks the id up inside the clinic, so another clinic's id is a 404. */
export async function PATCH(request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId, id } = await context.params;

  return forwardClinicSlugRoute(
    request,
    clinicId,
    `treatments/${encodeURIComponent(id)}`,
    "PATCH",
    parseTreatmentUpdate,
  );
}

export async function DELETE(_request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId, id } = await context.params;

  return forwardClinicSlugRoute(
    null,
    clinicId,
    `treatments/${encodeURIComponent(id)}`,
    "DELETE",
  );
}
