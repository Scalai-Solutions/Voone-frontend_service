import "server-only";

import { forwardResponse, staffFetch } from "@/lib/staff-api";
import {
  MAX_BODY_BYTES,
  declaredTooLarge,
  isSafeId,
} from "@/lib/admin-request-guards";
import { parseJson, type Parsed } from "@/lib/change-request-parsers";

/**
 * Shared plumbing for the admin routes that talk to the backend as a Voone administrator
 * (tickets, and the per-clinic services editor).
 *
 * The backend cannot check a session, so it trusts the FRONTEND to say who is calling: the
 * staff key proves the call came from this app, `x-actor-role` says which side of the app
 * (admin routes accept only `voone_admin`), and `x-actor` (added by staffFetch on writes) is
 * the signed-in admin's email. These routes are only reached after requireAdminSession.
 */

const ADMIN_ROLE_HEADERS = { "x-actor-role": "voone_admin" };

export const adminApiFetch = (
  path: string,
  init: RequestInit = {},
): Promise<Response> =>
  staffFetch(path, {
    ...init,
    headers: { ...ADMIN_ROLE_HEADERS, ...init.headers },
  });

export const invalidRequest = (message: string): Response =>
  Response.json({ code: "VALIDATION_ERROR", message }, { status: 422 });

/** 404 when any path id is not backend-shaped, so `..` or `%2E%2E` can never reach a backend path. */
export const rejectBadIds = (...ids: string[]): Response | null =>
  ids.every(isSafeId)
    ? null
    : Response.json({ code: "NOT_FOUND", message: "Not found" }, { status: 404 });

const tooLarge = (): Response =>
  Response.json(
    { code: "PAYLOAD_TOO_LARGE", message: "The request body is too large." },
    { status: 413 },
  );

/**
 * The body as text, capped at MAX_BODY_BYTES: refused up front when Content-Length says it is
 * too big, and cut off while reading when there is no (or a wrong) Content-Length.
 */
export const readCappedText = async (
  request: Request,
): Promise<{ text: string } | { response: Response }> => {
  if (declaredTooLarge(request.headers.get("content-length")))
    return { response: tooLarge() };

  if (!request.body) return { text: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;

    received += value.byteLength;

    if (received > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);

      return { response: tooLarge() };
    }

    text += decoder.decode(value, { stream: true });
  }

  return { text: text + decoder.decode() };
};

/** Reads and parses a JSON body, or the 4xx to answer instead. */
export const readJsonBody = async (
  request: Request,
): Promise<{ body: unknown } | { response: Response }> => {
  const read = await readCappedText(request);

  if ("response" in read) return read;

  const parsed = parseJson(read.text);

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
    await adminApiFetch(path, { method, body: JSON.stringify(parsed.value) }),
  );
};

/**
 * The backend's treatment routes are keyed by clinic SLUG (they are the centre's own routes,
 * which the admin reuses so the admin edits through exactly the same validation the owner
 * used to). The admin pages know the clinic ID, so look the slug up on the admin clinic
 * record, which is also what answers 404 for an unknown clinic.
 */
export const resolveClinicSlug = async (
  clinicId: string,
): Promise<{ slug: string } | { response: Response }> => {
  const response = await adminApiFetch(
    `/v1/admin/clinics/${encodeURIComponent(clinicId)}`,
    { method: "GET" },
  );

  if (!response.ok) return { response: await forwardResponse(response) };

  const clinic = (await response.json().catch(() => null)) as {
    slug?: unknown;
  } | null;

  if (typeof clinic?.slug !== "string" || !clinic.slug) {
    return {
      response: Response.json(
        { code: "CLINIC_SLUG_MISSING", message: "The clinic has no slug." },
        { status: 502 },
      ),
    };
  }

  return { slug: clinic.slug };
};

/**
 * One call to the backend's slug-based treatment routes for a clinic: `subpath` is
 * "treatments", "treatments/<id>" or "treatment-categories". `parse` (writes with a body)
 * decides what is forwarded.
 */
export const forwardClinicSlugRoute = async <T>(
  request: Request | null,
  clinicId: string,
  subpath: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  parse?: (raw: unknown) => Parsed<T>,
): Promise<Response> => {
  let body: string | undefined;
  const badId = rejectBadIds(clinicId);

  if (badId) return badId;

  if (parse) {
    const read = await readJsonBody(request as Request);

    if ("response" in read) return read.response;

    const parsed = parse(read.body);

    if (!parsed.ok) return invalidRequest(parsed.message);

    body = JSON.stringify(parsed.value);
  }

  const clinic = await resolveClinicSlug(clinicId);

  if ("response" in clinic) return clinic.response;

  return forwardResponse(
    await adminApiFetch(`/v1/clinics/${encodeURIComponent(clinic.slug)}/${subpath}`, {
      method,
      ...(body !== undefined ? { body } : {}),
    }),
  );
};
