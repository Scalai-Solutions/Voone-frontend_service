import { parseListQuery } from "@/lib/change-request-parsers";
import {
  adminApiFetch,
  invalidRequest,
} from "@/lib/admin-api-proxy";
import { forwardResponse } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

/**
 * The inbox across clinics: `?status&clinicId&type&q&limit&cursor`. Only those filters are
 * forwarded, and each is validated, so the browser cannot add a query parameter the backend
 * would treat specially.
 */
export async function GET(request: Request) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const query = parseListQuery(new URL(request.url).searchParams);

  if (!query.ok) {
    return invalidRequest(query.message);
  }

  const qs = query.value.toString();

  return forwardResponse(
    await adminApiFetch(`/v1/admin/change-requests${qs ? `?${qs}` : ""}`, {
      method: "GET",
    }),
  );
}
