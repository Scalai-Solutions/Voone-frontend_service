/**
 * Which clinic routes, with which methods, the admin's members proxy
 * (`/api/admin/clinics/:clinicId/staff/...`) may forward: exactly what the members screens
 * (list, profile, visit panel, audiences) call, and nothing else. Anything else answers 404.
 *
 * Same matcher as onboarding-proxy-paths.ts: each pattern is the path split into segments, and
 * `*` stands for exactly one non-empty segment.
 */
const ALLOWED: Array<{ pattern: string[]; methods: string[] }> = [
  { pattern: ["members"], methods: ["GET"] },
  { pattern: ["members", "*"], methods: ["GET", "PATCH", "DELETE"] },
  { pattern: ["members", "*", "points"], methods: ["POST"] },
  { pattern: ["members", "*", "pass"], methods: ["POST"] },
  { pattern: ["members", "*", "visits"], methods: ["POST"] },
  { pattern: ["members", "*", "rewards"], methods: ["GET"] },
  { pattern: ["members", "*", "rewards", "*", "redeem"], methods: ["POST"] },
  { pattern: ["members", "*", "bonos"], methods: ["GET"] },
  { pattern: ["members", "*", "bonos", "*", "cancel"], methods: ["POST"] },
  { pattern: ["bonos"], methods: ["GET"] },
  { pattern: ["catalog"], methods: ["GET"] },
  { pattern: ["program"], methods: ["GET"] },
  // Keyed by clinic id on the backend; the route also checks it is this clinic's id.
  { pattern: ["clinics", "*", "audiences"], methods: ["GET", "POST"] },
  { pattern: ["clinics", "*", "audiences", "*"], methods: ["DELETE"] },
];

export const isForwardableClinicStaffPath = (
  segments: string[],
  method: string,
): boolean =>
  ALLOWED.some(
    ({ pattern, methods }) =>
      methods.includes(method.toUpperCase()) &&
      pattern.length === segments.length &&
      pattern.every((part, i) =>
        part === "*" ? segments[i].length > 0 : part === segments[i],
      ),
  );
