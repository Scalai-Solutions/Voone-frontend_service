import "server-only";

import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { parseJson, type Parsed } from "@/lib/change-request-parsers";

/**
 * Shared plumbing for the admin ticket routes.
 *
 * The backend cannot check a session, so it trusts the FRONTEND to say who is calling: the
 * staff key proves the call came from this app, `x-actor-role` says which side of the app
 * (admin routes accept only `voone_admin`), and `x-actor` (added by staffFetch on writes) is
 * the signed-in admin's email. These routes are only reached after requireAdminSession.
 */

const ADMIN_ROLE_HEADERS = { "x-actor-role": "voone_admin" };

export const adminTicketFetch = (
  path: string,
  init: RequestInit = {},
): Promise<Response> =>
  staffFetch(path, {
    ...init,
    headers: { ...ADMIN_ROLE_HEADERS, ...init.headers },
  });

export const invalidRequest = (message: string): Response =>
  Response.json({ code: "VALIDATION_ERROR", message }, { status: 422 });

/** Reads and parses a JSON body, or the 422 to answer instead. */
export const readJsonBody = async (
  request: Request,
): Promise<{ body: unknown } | { response: Response }> => {
  const parsed = parseJson(await request.text());

  return parsed.ok
    ? { body: parsed.value }
    : { response: invalidRequest(parsed.message) };
};

/**
 * Runs a JSON-bodied write: parse, validate with `parse`, forward what the parser produced
 * (never the browser's raw text), and pass the backend's answer through unchanged.
 */
export const forwardValidatedWrite = async <T>(
  request: Request,
  path: string,
  method: "POST" | "PATCH",
  parse: (raw: unknown) => Parsed<T>,
): Promise<Response> => {
  const read = await readJsonBody(request);

  if ("response" in read) return read.response;

  const parsed = parse(read.body);

  if (!parsed.ok) return invalidRequest(parsed.message);

  return forwardResponse(
    await adminTicketFetch(path, { method, body: JSON.stringify(parsed.value) }),
  );
};
