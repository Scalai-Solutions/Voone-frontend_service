import { parseListQuery } from "@/lib/change-request-parsers";
import { adminApiFetch, invalidRequest } from "@/lib/admin-api-proxy";
import { forwardResponse } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

/** One clinic's tickets, same filters as the inbox (the clinic comes from the path, not the query). */
export async function GET(
  request: Request,
  context: { params: Promise<{ clinicId: string }> },
) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;
  const query = parseListQuery(new URL(request.url).searchParams);

  if (!query.ok) {
    return invalidRequest(query.message);
  }

  // The path decides the clinic; a clinicId in the query must not widen or change it.
  query.value.delete("clinicId");

  const qs = query.value.toString();

  return forwardResponse(
    await adminApiFetch(
      `/v1/admin/clinics/${encodeURIComponent(clinicId)}/change-requests${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    ),
  );
}
