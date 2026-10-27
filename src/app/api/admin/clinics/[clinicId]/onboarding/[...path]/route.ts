import { isForwardableOnboardingPath } from "@/lib/onboarding-proxy-paths";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

type Context = { params: Promise<{ clinicId: string; path: string[] }> };

/**
 * The onboarding programme API, for Voone administrators.
 *
 * The browser calls this and never the backend: the staff key is held here, and the admin
 * session is checked here. The clinic id comes from the URL because an administrator acts on
 * any clinic — which is exactly why the PATH is allowlisted, so that "any clinic" does not
 * quietly become "any backend route".
 */
const forward = async (request: Request, context: Context) => {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId, path } = await context.params;

  // 404 rather than 403: the answer does not confirm that a backend route exists there.
  if (!isForwardableOnboardingPath(path, request.method)) {
    return Response.json({ code: "NOT_FOUND", message: "Not found" }, { status: 404 });
  }

  const body = request.method === "GET" ? undefined : await request.text();
  const response = await staffFetch(
    `/v1/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/${path
      .map(encodeURIComponent)
      .join("/")}`,
    { method: request.method, body },
  );

  return forwardResponse(response);
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
