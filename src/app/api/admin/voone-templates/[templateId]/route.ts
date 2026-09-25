import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ templateId: string }> },
) {
  const guard = await requireAdminSession();
  if ("response" in guard) return guard.response;

  const { templateId } = await context.params;
  const response = await staffFetch(
    `/v1/voone-templates/${encodeURIComponent(templateId)}`,
    {
      method: "PATCH",
      body: await request.text(),
    },
  );

  return forwardResponse(response);
}
