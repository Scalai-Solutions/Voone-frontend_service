import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

type AdminTemplatePayload = {
  clinicId?: string;
  [key: string]: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ templateId: string }> },
) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { templateId } = await context.params;
  const payload = (await request
    .json()
    .catch(() => null)) as AdminTemplatePayload | null;
  const { clinicId, ...templateInput } = payload ?? {};

  const response = await staffFetch(
    `/v1/templates/${encodeURIComponent(templateId)}`,
    {
      method: "PATCH",
      ...(clinicId ? { headers: { "x-clinic-id": clinicId } } : {}),
      body: JSON.stringify(templateInput),
    },
  );

  return forwardResponse(response);
}
