import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

type AdminTemplatePayload = {
  clinicId?: string;
  [key: string]: unknown;
};

export async function POST(request: Request) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const payload = (await request
    .json()
    .catch(() => null)) as AdminTemplatePayload | null;
  const clinicId = payload?.clinicId?.trim();

  if (!payload || !clinicId) {
    return Response.json(
      {
        code: "CLINIC_REQUIRED",
        message: "clinicId is required to create a template.",
      },
      { status: 400 },
    );
  }

  const templateInput = { ...payload };
  delete templateInput.clinicId;

  const response = await staffFetch("/v1/templates", {
    method: "POST",
    headers: { "x-clinic-id": clinicId },
    body: JSON.stringify(templateInput),
  });

  return forwardResponse(response);
}
