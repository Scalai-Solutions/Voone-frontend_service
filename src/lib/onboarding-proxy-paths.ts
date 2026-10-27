/**
 * Which onboarding paths, with which methods, the admin proxy may forward.
 *
 * An allowlist from the start, for the reason the staff proxy had to be retrofitted with one:
 * a proxy that forwards "whatever path it is given" with a shared key quietly exposes every
 * backend route that happens to exist under it, now and in future. Here a path is forwarded
 * only if it is named below with the method used.
 *
 * Each pattern is the path split into segments; `*` stands for exactly one non-empty segment.
 * Order is irrelevant: a request is allowed if ANY entry matches both path and method.
 */
const ALLOWED: Array<{ pattern: string[]; methods: string[] }> = [
  { pattern: ["bonos"], methods: ["GET", "POST"] },
  { pattern: ["bonos", "*"], methods: ["PATCH", "DELETE"] },
  { pattern: ["catalog"], methods: ["GET", "PUT"] },
  { pattern: ["catalog", "import"], methods: ["POST"] },
  { pattern: ["catalog", "*"], methods: ["PATCH"] },
  { pattern: ["estimates"], methods: ["GET"] },
  { pattern: ["preview"], methods: ["POST"] },
  { pattern: ["programs"], methods: ["GET", "POST"] },
  { pattern: ["programs", "*"], methods: ["GET"] },
  { pattern: ["programs", "*", "publish"], methods: ["POST"] },
  { pattern: ["programs", "*", "milestones", "*"], methods: ["PATCH"] },
  { pattern: ["programs", "*", "calculator"], methods: ["POST"] },
  { pattern: ["recalibration"], methods: ["GET"] },
];

export const isForwardableOnboardingPath = (
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
