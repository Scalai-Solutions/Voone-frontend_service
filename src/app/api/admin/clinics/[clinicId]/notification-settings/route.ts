import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

/**
 * A centre's automatic communications, read and saved by Voone's admin during onboarding. The
 * role is stated as the admin's, so the backend lets it act on a centre that is not its own.
 */
const forward = async (request: Request, context: { params: Promise<{ clinicId: string }> }) => {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;
  const response = await staffFetch(`/v1/clinics/${encodeURIComponent(clinicId)}/notification-settings`, {
    method: request.method,
    body: request.method === "GET" ? undefined : await request.text(),
    headers: { "x-voone-role": "VOONE_ADMIN", "x-voone-user-id": guard.session.userId },
  });

  return forwardResponse(response);
};

export const GET = forward;
export const PATCH = forward;
