/**
 * The headers of a call to the backend's staff surface.
 *
 * `key` (the shared staff key) and `actor` (the signed-in email, writes only) come from the
 * server's own environment and session, and they win over anything in `extra`: a caller that
 * passes `x-actor` or `x-voone-staff-key` cannot replace them. Matching is case-insensitive,
 * because HTTP header names are. `x-actor-role` is not protected here: the change-request
 * handlers set it from the session's role, and never from the browser's request.
 */
const RESERVED = ["x-voone-staff-key", "x-actor"];

export const staffHeaders = ({
  key,
  actor,
  extra = {},
}: {
  key?: string;
  actor?: string;
  extra?: Record<string, string>;
}): Record<string, string> => {
  const kept = Object.fromEntries(
    Object.entries(extra).filter(
      ([name]) => !RESERVED.includes(name.toLowerCase()),
    ),
  );

  return {
    "Content-Type": "application/json",
    ...kept,
    ...(key ? { "x-voone-staff-key": key } : {}),
    ...(actor ? { "x-actor": actor } : {}),
  };
};
