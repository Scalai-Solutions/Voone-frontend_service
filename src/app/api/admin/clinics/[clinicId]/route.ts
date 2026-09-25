import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

export async function GET(_request: Request, context: { params: Promise<{ clinicId: string }> }) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;
  const response = await staffFetch(`/v1/admin/clinics/${encodeURIComponent(clinicId)}`, {
    method: "GET",
  });

  return forwardResponse(response);
}

export async function PATCH(request: Request, context: { params: Promise<{ clinicId: string }> }) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;
  const response = await staffFetch(`/v1/admin/clinics/${encodeURIComponent(clinicId)}`, {
    method: "PATCH",
    body: await request.text(),
  });

  return forwardResponse(response);
}

export async function DELETE(_request: Request, context: { params: Promise<{ clinicId: string }> }) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;
  const response = await staffFetch(`/v1/admin/clinics/${encodeURIComponent(clinicId)}`, {
    method: "DELETE",
  });

  return forwardResponse(response);
}