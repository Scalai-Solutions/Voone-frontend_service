import {
  forwardChangeRequest,
  notFound,
  requestIdFrom,
} from "@/lib/change-requests-server";
import { requireChangeRequestSession } from "@/lib/staff-guard";

/** One of the centre's change requests, with its thread. The backend looks the id up inside the session's centre. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireChangeRequestSession();

  if ("response" in guard) {
    return guard.response;
  }

  const id = await requestIdFrom(context);

  if (!id) {
    return notFound();
  }

  return forwardChangeRequest(guard.session, guard.role, `/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}
