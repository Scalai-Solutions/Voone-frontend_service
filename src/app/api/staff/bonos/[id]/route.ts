import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireServiceWriteAllowed } from "@/lib/staff-guard";

/**
 * Editing or removing one of the centre's bono plans. Owners and managers only: a plan is
 * part of the centre's price list, not something reception changes between clients.
 *
 * Writes are closed to the centre itself: services change through a change request that Voone
 * resolves (`requireServiceWriteAllowed` answers 403 USE_CHANGE_REQUEST before the body is read).
 * The handlers stay so the contract is explicit and a Voone-side caller could reuse them.
 */
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const guard = await requireServiceWriteAllowed();

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
  const guard = await requireServiceWriteAllowed();

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
