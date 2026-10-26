import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * The categories a treatment can belong to, with their Spanish labels. Only meaningful for
 * centres whose treatments come from the catalogue. The slug comes from the session.
 */
export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  return forwardResponse(
    await staffFetch(
      `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/treatment-categories`,
      { method: "GET" },
    ),
  );
}
