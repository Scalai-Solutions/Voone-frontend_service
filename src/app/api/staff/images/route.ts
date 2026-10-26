import { PERMISSIONS } from "@/lib/auth-shared";
import { forwardImageUpload } from "@/lib/image-upload-proxy";
import { requirePermission } from "@/lib/staff-guard";

/**
 * Uploads a logo or hero image for the signed-in centre. The clinic slug comes from the
 * session, never from the request, so a member cannot upload into another clinic's folder.
 * A dedicated route, so Next matches it before the generic `/api/staff/[...path]` proxy.
 */
export async function POST(request: Request) {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard.response;
  }

  return forwardImageUpload(
    request,
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/images`,
  );
}
