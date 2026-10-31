import { parseReopenBody } from "@/lib/staff-change-requests";
import {
  forwardChangeRequest,
  notFound,
  parsed,
  readJsonBody,
  requestIdFrom,
} from "@/lib/change-requests-server";
import { requireChangeRequestSession } from "@/lib/staff-guard";

/** Reopens a resolved or rejected request within its window; the optional message joins the thread. */
export async function POST(
  request: Request,
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

  const json = await readJsonBody(request);

  if ("response" in json) {
    return json.response;
  }

  const body = parsed(parseReopenBody(json.value));

  if ("response" in body) {
    return body.response;
  }

  return forwardChangeRequest(
    guard.session,
    guard.role,
    `/${encodeURIComponent(id)}/reopen`,
    { method: "POST", body: body.value },
  );
}
