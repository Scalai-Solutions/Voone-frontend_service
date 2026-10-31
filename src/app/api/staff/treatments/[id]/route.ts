import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireServiceWriteAllowed } from "@/lib/staff-guard";

type Context = { params: Promise<{ id: string }> };

/**
 * Edits or removes one of the signed-in centre's treatments.
 *
 * The slug comes from the session; the backend looks the treatment up inside that centre, so
 * an id from another centre answers 404 ("No se ha encontrado ese tratamiento.").
 *
 * Writes are closed to the centre itself: services change through a change request that Voone
 * resolves (`requireServiceWriteAllowed` answers 403 USE_CHANGE_REQUEST before the body is read).
 * The handlers stay so the contract is explicit and a Voone-side caller could reuse them.
 */
const forward = async (request: Request, context: Context, method: "PATCH" | "DELETE") => {
  const guard = await requireServiceWriteAllowed();

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
