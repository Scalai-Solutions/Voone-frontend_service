import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

export async function GET(request: Request) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/lookup?code=${encodeURIComponent(code)}`,
    { method: "GET" },
  );

  return forwardResponse(response);
}
