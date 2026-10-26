import { forwardImageUpload } from "@/lib/image-upload-proxy";
import { requireAdminSession } from "@/lib/staff-guard";

/**
 * Uploads a logo or hero image for Voone admins: the template editor for any clinic and the
 * onboarding wizard, where the clinic does not exist yet.
 */
export async function POST(request: Request) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  return forwardImageUpload(request, "/v1/admin/images");
}
