import { parseCreateRequest, parseListQuery, listQueryString } from "@/lib/staff-change-requests";
import {
  forwardChangeRequest,
  invalid,
  parsed,
  readJsonBody,
} from "@/lib/change-requests-server";
import { requireChangeRequestSession } from "@/lib/staff-guard";

/**
 * The signed-in centre's change requests: list and open a new one. Owners and managers only.
 *
 * The slug comes from the session. The query is rebuilt from the three parameters the backend
 * takes, and the body is parsed and rebuilt from the whitelisted shape of its type, so nothing
 * the browser adds besides those reaches the backend.
 */
export async function GET(request: Request) {
  const guard = await requireChangeRequestSession();

  if ("response" in guard) {
    return guard.response;
  }

  const query = parsed(parseListQuery(new URL(request.url).searchParams));

  if ("response" in query) {
    return query.response;
  }

  return forwardChangeRequest(guard.session, guard.role, listQueryString(query.value), {
    method: "GET",
  });
}

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

  const body = parsed(parseCreateRequest(json.value));

  if ("response" in body) {
    return body.response;
  }

  return forwardChangeRequest(guard.session, guard.role, "", {
    method: "POST",
    body: body.value,
  });
}
