import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requirePermission } from "@/lib/staff-guard";

type Context = { params: Promise<{ id: string }> };

/**
 * Edits or removes one of the signed-in centre's treatments.
 *
 * The slug comes from the session; the backend looks the treatment up inside that centre, so
 * an id from another centre answers 404 ("No se ha encontrado ese tratamiento.").
 */
const forward = async (request: Request, context: Context, method: "PATCH" | "DELETE") => {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard.response;
  }

  const { id } = await context.params;

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/treatments/${encodeURIComponent(id)}`,
      {
        method,
        ...(method === "PATCH" ? { body: await request.text() } : {}),
      },
    ),
  );
};

export const PATCH = (request: Request, context: Context) => forward(request, context, "PATCH");
export const DELETE = (request: Request, context: Context) => forward(request, context, "DELETE");
