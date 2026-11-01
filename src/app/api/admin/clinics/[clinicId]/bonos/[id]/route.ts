import {
  adminApiFetch,
  forwardValidatedWrite,
  rejectBadIds,
} from "@/lib/admin-api-proxy";
import { parseBonoUpdate } from "@/lib/admin-catalogue-parsers";
import { forwardResponse } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

type Context = { params: Promise<{ clinicId: string; id: string }> };

/** Edits or removes one bono plan. A plan members already hold is retired, not deleted (the answer says which). */
export async function PATCH(request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId, id } = await context.params;

  const badId = rejectBadIds(clinicId, id);

  if (badId) {
    return badId;
  }

  return forwardValidatedWrite(
    request,
    `/v1/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/bonos/${encodeURIComponent(id)}`,
    "PATCH",
    parseBonoUpdate,
  );
}

export async function DELETE(_request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId, id } = await context.params;

  const badId = rejectBadIds(clinicId, id);

  if (badId) {
    return badId;
  }

  return forwardResponse(
    await adminApiFetch(
      `/v1/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/bonos/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  );
}
