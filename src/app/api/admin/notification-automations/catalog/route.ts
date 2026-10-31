import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

/**
 * The catalog of automated messages (labels, allowed {variables}, defaults), for the onboarding
 * step. It is the same for every centre, so no centre id is needed.
 */
export const GET = async () => {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch("/v1/notification-automations/catalog", {
    method: "GET",
    headers: { "x-voone-role": "VOONE_ADMIN", "x-voone-user-id": guard.session.userId },
  });

  return forwardResponse(response);
};
