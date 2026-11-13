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
  // A draft from the live programme's answers and the current catalogue. Named, not matched by the
  // `*` above, which is GET only: "redraft" is an action, not a programme id.
  { pattern: ["programs", "redraft"], methods: ["POST"] },
  { pattern: ["programs", "*", "publish"], methods: ["POST"] },
  // Add a reward to a tier band; change or remove one milestone.
  { pattern: ["programs", "*", "milestones"], methods: ["POST"] },
  { pattern: ["programs", "*", "milestones", "*"], methods: ["PATCH", "DELETE"] },
  // The spend at which a milestone unlocks (whole euros paid).
  { pattern: ["programs", "*", "milestones", "*", "threshold"], methods: ["PUT"] },
  // What the reward after Diamante is.
  { pattern: ["programs", "*", "recurring"], methods: ["PATCH"] },
  // How often it comes round (whole euros paid).
  { pattern: ["programs", "*", "recurring", "every"], methods: ["PUT"] },
  { pattern: ["programs", "*", "draft"], methods: ["POST"] },
  { pattern: ["programs", "*", "texts"], methods: ["PATCH"] },
  { pattern: ["programs", "*", "calculator"], methods: ["POST"] },
  { pattern: ["programs", "*", "comparison"], methods: ["POST"] },
  { pattern: ["programs", "*", "tiers", "*", "benefits"], methods: ["PUT"] },
  {
    pattern: ["programs", "*", "tiers", "*", "benefit-overrides"],
    methods: ["PUT"],
  },
  { pattern: ["prize-status"], methods: ["GET"] },
  { pattern: ["perk-values"], methods: ["GET", "PUT"] },
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
