/**
 * What the change-request handlers send to the backend, as a pure function of the SESSION.
 *
 * The clinic slug and the role are the only inputs that decide where a call goes and who it is
 * made as; the browser's request contributes a path segment (an id, already validated) and a
 * parsed body, never a header. A client-sent `x-actor-role` or `x-actor` therefore has nowhere
 * to enter: the headers are built here, `x-actor-role` from the session's role, and the
 * `x-actor` the backend sees is added later by `staffFetch` from the session's email (and
 * protected there by `staffHeaders`).
 */
export const changeRequestForward = ({
  clinicSlug,
  role,
  subpath,
  method,
  body,
}: {
  clinicSlug: string;
  role: "owner" | "manager";
  subpath: string;
  method: "GET" | "POST";
  body?: unknown;
}): { path: string; init: { method: string; headers: Record<string, string>; body?: string } } => ({
  path: `/v1/clinics/${encodeURIComponent(clinicSlug)}/change-requests${subpath}`,
  init: {
    method,
    headers: { "x-actor-role": role },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  },
});
