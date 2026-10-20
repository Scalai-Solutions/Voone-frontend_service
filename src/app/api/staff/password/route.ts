import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

export async function POST(request: Request) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const body = await request.text();

  return forwardResponse(
    await staffFetch("/v1/auth/password", {
      method: "POST",
      body,
      headers: {
        "x-voone-user-id": guard.session.userId,
        "x-voone-role": guard.session.role,
        "x-voone-clinic-id": guard.session.clinicId,
        "x-voone-permissions": guard.session.permissions.join(","),
      },
    }),
  );
}
