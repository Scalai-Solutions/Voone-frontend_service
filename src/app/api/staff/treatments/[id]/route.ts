import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { serviceWriteHandlers } from "@/lib/service-write-handlers";
import { requireServiceWriteAllowed } from "@/lib/staff-guard";

const handlers = serviceWriteHandlers("treatments", {
  requireAllowed: requireServiceWriteAllowed,
  staffFetch,
  forwardResponse,
});

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
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
