/**
 * Which backend paths the generic staff proxy (`/api/staff/[...path]`) may forward.
 *
 * The proxy attaches the shared STAFF_API_KEY and the session's clinic headers, and forwards
 * whatever path it is given. That is only safe for routes whose backend handler checks the
 * caller's clinic from those headers — which is true of the notification routes it was
 * written for, and false of everything else. The member directory, points and pass routes
 * take a clinic SLUG from the URL and trust the key alone, so forwarding them verbatim let any
 * signed-in member of one clinic read or change another's data by typing that clinic's slug.
 *
 * So this is an allowlist, not a denylist: a route is forwarded only if it is named here, and
 * a new backend route is unreachable through the proxy until someone decides it should be.
 * Routes that need the clinic taken from the session have dedicated handlers instead
 * (`/api/staff/members`, `/api/staff/clinic`, ...), which Next matches before this catch-all.
 * Clinic-user routes are also safe to proxy: their handlers verify the clinic ID against the
 * session headers and require team-management permission.
 *
 * Each pattern is the path split into segments; `*` stands for exactly one non-empty segment.
 */
const ALLOWED: string[][] = [
  ["clinics", "*", "notifications"],
  ["clinics", "*", "notifications", "broadcast"],
  ["clinics", "*", "notifications", "segment"],
  ["clinics", "*", "notification-settings"],
  ["clinics", "*", "geo-locations"],
  ["clinics", "*", "users"],
  ["clinics", "*", "users", "*"],
  ["members", "*", "notifications"],
  ["members", "*", "notification-quota"],
  ["notifications", "*"],
];

export const isForwardableStaffPath = (segments: string[]): boolean =>
  // "." and ".." survive encodeURIComponent and are resolved by URL parsing in fetch, so
  // `clinics/../users` would otherwise reach `/v1/users` while matching a pattern here.
  !segments.some((segment) => segment === "." || segment === "..") &&
  ALLOWED.some(
    (pattern) =>
      pattern.length === segments.length &&
      pattern.every((part, i) => (part === "*" ? segments[i].length > 0 : part === segments[i])),
  );
