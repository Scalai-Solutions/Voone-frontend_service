import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { serviceWriteHandlers } from "@/lib/service-write-handlers";
import { requireServiceWriteAllowed } from "@/lib/staff-guard";

const handlers = serviceWriteHandlers("bonos", {
  requireAllowed: requireServiceWriteAllowed,
  staffFetch,
  forwardResponse,
});

/**
 * Editing or removing one of the centre's bono plans. Owners and managers only: a plan is
 * part of the centre's price list, not something reception changes between clients.
 *
 * Writes are closed to the centre itself: services change through a change request that Voone
 * resolves (`requireServiceWriteAllowed` answers 403 USE_CHANGE_REQUEST before the body is read).
 * The handlers stay so the contract is explicit and a Voone-side caller could reuse them.
 */
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
