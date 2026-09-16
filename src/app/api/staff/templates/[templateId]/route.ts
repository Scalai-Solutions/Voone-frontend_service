import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * Updates a template.
 *
 * x-clinic-id comes from the session, as on create. Note what this does NOT prove: the
 * backend does not check that :templateId belongs to the clinic in that header, so a staff
 * caller who learned another clinic's template id could still update it. Closing that
 * needs the ownership check to live in the backend, where the relation is; it is a real
 * gap and is tracked rather than papered over here.
 */
export async function PATCH(request: Request, context: { params: Promise<{ templateId: string }> }) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { templateId } = await context.params;

  const response = await staffFetch(`/v1/templates/${encodeURIComponent(templateId)}`, {
    method: "PATCH",
    headers: { "x-clinic-id": guard.session.clinicId },
    body: await request.text(),
  });

  return forwardResponse(response);
}
