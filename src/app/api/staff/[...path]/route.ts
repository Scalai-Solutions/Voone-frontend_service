import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

type Context = { params: Promise<{ path: string[] }> };

const sessionHeaders = (session: { userId: string; role: string; clinicId: string }) => ({
  "x-voone-user-id": session.userId,
  "x-voone-role": session.role,
  "x-voone-clinic-id": session.clinicId,
});

const forward = async (request: Request, context: Context) => {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { path } = await context.params;
  const url = new URL(request.url);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const response = await staffFetch(`/v1/${path.map(encodeURIComponent).join("/")}${url.search}`, {
    method: request.method,
    body,
    headers: {
      ...sessionHeaders(guard.session),
      ...(request.headers.get("Idempotency-Key")
        ? { "Idempotency-Key": request.headers.get("Idempotency-Key") as string }
        : {}),
    },
  });

  return forwardResponse(response);
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;