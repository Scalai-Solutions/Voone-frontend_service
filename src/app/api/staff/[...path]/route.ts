import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";
import { isForwardableStaffPath } from "@/lib/staff-proxy-paths";

type Context = { params: Promise<{ path: string[] }> };

const sessionHeaders = (session: {
  userId: string;
  role: string;
  clinicId: string;
  permissions: string[];
}) => ({
  "x-voone-user-id": session.userId,
  "x-voone-role": session.role,
  "x-voone-clinic-id": session.clinicId,
  "x-voone-permissions": session.permissions.join(","),
});

const forward = async (request: Request, context: Context) => {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { path } = await context.params;

  // Do not remove this check. It was dropped once (ee1e3a8) and every signed-in staff member
  // could then read or change another clinic through `/clinics/<slug>/...`; the header
  // comment of staff-proxy-paths.ts explains why. 404, not 403, so a path is not confirmed.
  if (!isForwardableStaffPath(path)) {
    return Response.json({ code: "NOT_FOUND", message: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();
  const response = await staffFetch(
    `/v1/${path.map(encodeURIComponent).join("/")}${url.search}`,
    {
      method: request.method,
      body,
      headers: {
        ...sessionHeaders(guard.session),
        ...(request.headers.get("Idempotency-Key")
          ? {
              "Idempotency-Key": request.headers.get(
                "Idempotency-Key",
              ) as string,
            }
          : {}),
      },
    },
  );

  return forwardResponse(response);
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
