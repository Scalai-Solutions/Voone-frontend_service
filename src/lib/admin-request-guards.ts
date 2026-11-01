/**
 * Small, pure checks the admin proxy applies before anything reaches the backend.
 */

/** Ids in a path segment: the shape every backend id has. Anything else (`..`, `%2E%2E`, slashes) is refused. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export const isSafeId = (value: unknown): value is string =>
  typeof value === "string" && SAFE_ID.test(value);

/** The largest JSON body an admin route reads: a ticket note or message is at most 2000 characters. */
export const MAX_BODY_BYTES = 20_000;

/** True when a Content-Length header already says the body is over the cap (a missing or unreadable one says nothing). */
export const declaredTooLarge = (
  contentLength: string | null,
  max: number = MAX_BODY_BYTES,
): boolean => {
  if (contentLength === null || !/^\d+$/.test(contentLength.trim())) return false;

  return Number(contentLength) > max;
};
