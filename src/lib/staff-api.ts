import "server-only";

/**
 * Server-side calls to the backend's staff surface.
 *
 * The `server-only` import is load-bearing: it makes the build fail if this module is ever
 * pulled into a client bundle, which is the difference between a secret and a published
 * one. STAFF_API_KEY is a bearer credential for every clinic's template, so it must never
 * be a NEXT_PUBLIC_ value — the browser talks to our own route handlers instead, and they
 * talk to the backend.
 */

const resolveBaseUrl = (): string => {
  // A server-only URL first, so a deployment can reach the API over its private network
  // rather than back out through the public one. Falls back to the browser's URL, which
  // keeps local development to a single variable.
  const base = process.env.VOONE_API_URL ?? process.env.NEXT_PUBLIC_VOONE_API_URL;

  if (!base) {
    throw new Error("VOONE_API_URL or NEXT_PUBLIC_VOONE_API_URL must be configured");
  }

  return base.replace(/\/$/, "");
};

export const staffFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const key = process.env.STAFF_API_KEY;

  return fetch(`${resolveBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Omitted when unset so a local backend without a key behaves the same way.
      ...(key ? { "x-voone-staff-key": key } : {}),
      ...init.headers,
    },
    // These are writes; a cached one would be a bug rather than an optimization.
    cache: "no-store",
  });
};

/**
 * Forwards the backend's status and body unchanged.
 *
 * Deliberately transparent: the backend's 422 messages are the Spanish copy the form
 * displays, and its 409 on a second template is meaningful to the dashboard. Collapsing
 * them into a generic failure here would throw away the half of the design that makes
 * those errors useful. Nothing is added, so nothing new can leak.
 */
export const forwardResponse = async (response: Response): Promise<Response> => {
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
};
