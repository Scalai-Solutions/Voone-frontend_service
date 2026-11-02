import { parseOwnerFlag } from "@/lib/change-flag";
import { parsePreviewRequest } from "@/lib/staff-change-requests";
import {
  forwardChangeRequest,
  invalid,
  parsed,
  readJsonBody,
} from "@/lib/change-requests-server";
import { requireChangeRequestSession } from "@/lib/staff-guard";

/**
 * The owner's what-if: what a reward or a service price would do to the plan, before the ticket
 * is sent. Owners and managers only; nothing is stored.
 *
 * The slug comes from the session. The body is parsed and rebuilt from the whitelisted shape of
 * a reward or a price edit, so nothing the browser adds reaches the backend. A 200 is rebuilt
 * through `parseOwnerFlag`, so even if the backend one day sent more (a cost, exact euros), only
 * the owner's blurred flag reaches the browser. Any other status passes through as it came
 * (a 429 stays a 429; the form just shows no flag).
 */
export async function POST(request: Request) {
  const guard = await requireChangeRequestSession();

  if ("response" in guard) {
    return guard.response;
  }

  const json = await readJsonBody(request);

  if ("response" in json) {
    return json.response;
  }

  if (json.value === undefined) {
    return invalid("La solicitud está vacía.");
  }

  const body = parsed(parsePreviewRequest(json.value));

  if ("response" in body) {
    return body.response;
  }

  const answer = await forwardChangeRequest(guard.session, guard.role, "/preview", {
    method: "POST",
    body: body.value,
  });

  if (answer.status !== 200) {
    return answer;
  }

  return Response.json(parseOwnerFlag(await answer.json().catch(() => null)));
}
