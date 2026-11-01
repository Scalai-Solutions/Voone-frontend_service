import "server-only";

import type { TicketRole } from "@/lib/change-request-guard";
import {
  isValidRequestId,
  type ParseResult,
} from "@/lib/staff-change-requests";
import { changeRequestForward } from "@/lib/change-request-forward";
import { readCappedText } from "@/lib/read-capped-body";
import { forwardResponse, staffFetch } from "@/lib/staff-api";
import type { VooneSession } from "@/lib/auth";

/**
 * Shared plumbing of the /api/staff/change-requests handlers.
 *
 * The clinic slug always comes from the session, never from the URL, query or body. The role
 * goes to the backend as `x-actor-role` on every call; `staffFetch` adds `x-actor` (the
 * session's email) on writes. The backend's `{ code, message }` errors pass through unchanged.
 */

/** Largest body a ticket or a reply can need (a 2000-character text plus structure), in bytes. */
const MAX_BODY_BYTES = 32_000;

export const invalid = (message: string) =>
  Response.json({ code: "INVALID_REQUEST", message }, { status: 400 });

export const notFound = () =>
  Response.json(
    { code: "NOT_FOUND", message: "No se ha encontrado la solicitud." },
    { status: 404 },
  );

/**
 * The JSON body of a request, `undefined` when empty, a 413 when it is over the cap (checked
 * from Content-Length first, and while streaming, so an oversized body is never fully read),
 * or a 400 for text that is not JSON.
 */
export const readJsonBody = async (
  request: Request,
): Promise<{ value: unknown } | { response: Response }> => {
  const read = await readCappedText(request, MAX_BODY_BYTES);

  if ("tooLarge" in read) {
    return {
      response: Response.json(
        { code: "PAYLOAD_TOO_LARGE", message: "La solicitud es demasiado grande." },
        { status: 413 },
      ),
    };
  }

  if (!read.text.trim()) return { value: undefined };

  try {
    return { value: JSON.parse(read.text) as unknown };
  } catch {
    return { response: invalid("La solicitud no es válida.") };
  }
};

export const parsed = <T>(result: ParseResult<T>): { value: T } | { response: Response } =>
  result.ok ? { value: result.value } : { response: invalid(result.message) };

export const forwardChangeRequest = async (
  session: VooneSession,
  role: TicketRole,
  subpath: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<Response> => {
  const { path, init: request } = changeRequestForward({
    clinicSlug: session.clinicSlug,
    role,
    subpath,
    method: init.method,
    body: init.body,
  });

  return forwardResponse(await staffFetch(path, request));
};

/** An id from the URL, or null when it is not an opaque id. */
export const requestIdFrom = async (
  context: { params: Promise<{ id: string }> },
): Promise<string | null> => {
  const { id } = await context.params;

  return isValidRequestId(id) ? id : null;
};
