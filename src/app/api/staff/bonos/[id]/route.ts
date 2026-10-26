import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

/**
 * Editing or removing one of the centre's bono plans. Owners and managers only: a plan is
 * part of the centre's price list, not something reception changes between clients.
 */
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard.response;
  }

  const { id } = await context.params;

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/bonos/${encodeURIComponent(id)}`,
      { method: "PATCH", body: await request.text() },
    ),
  );
}

export async function DELETE(_request: Request, context: Context) {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard.response;
  }

  const { id } = await context.params;

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/bonos/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  );
}
