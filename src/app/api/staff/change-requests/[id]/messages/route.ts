import { parseMessageBody } from "@/lib/change-requests";
import {
  forwardChangeRequest,
  invalid,
  notFound,
  parsed,
  readJsonBody,
  requestIdFrom,
} from "@/lib/change-requests-server";
import { requireChangeRequestSession } from "@/lib/staff-guard";

/** A reply from the centre in a request's thread. On a closed request inside its window the backend reopens it. */
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

  if (json.value === undefined) {
    return invalid("Escribe un mensaje.");
  }

  const body = parsed(parseMessageBody(json.value));

  if ("response" in body) {
    return body.response;
  }

  return forwardChangeRequest(
    guard.session,
    guard.role,
    `/${encodeURIComponent(id)}/messages`,
    { method: "POST", body: body.value },
  );
}
