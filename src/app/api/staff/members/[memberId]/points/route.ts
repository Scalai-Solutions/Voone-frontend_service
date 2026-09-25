import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

export async function POST(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;
  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/${encodeURIComponent(memberId)}/points`,
    {
      method: "POST",
      body: await request.text(),
    },
  );

  return forwardResponse(response);
}
