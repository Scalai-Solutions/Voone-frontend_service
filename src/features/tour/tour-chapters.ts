/**
 * The clinic tutorial's chapters, as data. Every `target`, `stops[].target` and `tryIt` id here
 * must exist as a `data-tour="…"` attribute somewhere in src/ (tour-targets.test.ts checks it).
 */

import type {
  TourChapter,
  TourChapterId,
  TourChapterView,
  TourContext,
  TourStep,
} from "./tour-types.ts";

export const SCAN_ROUTE = "/dashboard/scan";
const MEMBERS_ROUTE = "/dashboard/members";
const CENTER_ROUTE = "/dashboard/templates";
const ENGAGE_ROUTE = "/dashboard/engage";
const METRICS_ROUTE = "/dashboard/metrics";
const SETTINGS_ROUTE = "/dashboard/settings";

/** A spoken-pace guess per step; the hub's durations come from these, not from marketing copy. */
export const DEFAULT_STEP_SECONDS = 7;
const ROUTE_CHANGE_SECONDS = 2;
/** Pages that render on the server before they show (metrics, settings) take longer to arrive. */
const SLOW_ROUTE_SECONDS = 3;
const SLOW_ROUTES = new Set(["/dashboard/metrics", "/dashboard/settings"]);

export const TOUR_CHAPTERS: readonly TourChapter[] = [
  {
    id: "welcome",
    icon: "sparkles",
    available: true,
    steps: [
      { id: "intro", copy: "welcome.intro", scene: "welcome-emblem" },
      {
        id: "nav",
        copy: "welcome.nav",
        seconds: 10,
        stops: [
          { target: "nav-templates", href: "/dashboard/templates", copy: "nav.templates" },
          { target: "nav-members", href: "/dashboard/members", copy: "nav.members" },
          { target: "nav-scan", href: "/dashboard/scan", copy: "nav.scan" },
          { target: "nav-engage", href: "/dashboard/engage", copy: "nav.engage" },
        ],
      },
      { id: "help", copy: "welcome.help", target: ["profile-gear", "mobile-help"] },
    ],
  },
  {
    id: "scan",
    icon: "scan",
    available: true,
    requiresHref: SCAN_ROUTE,
    tryIt: "scan-manual-search",
    steps: [
      { id: "camera", route: SCAN_ROUTE, target: "scan-camera", copy: "scan.camera", seconds: 8 },
      { id: "search", target: "scan-manual-search", copy: "scan.search" },
      { id: "visit", copy: "scan.visit", scene: "scan-visit", seconds: 10 },
    ],
  },
  {
    id: "members",
    icon: "members",
    available: true,
    optional: true,
    requiresHref: MEMBERS_ROUTE,
    tryIt: "members-toolbar",
    steps: [
      { id: "toolbar", route: MEMBERS_ROUTE, tab: "personas", target: "members-toolbar", copy: "members.toolbar" },
      { id: "export", tab: "personas", target: "members-export", copy: "members.export" },
      { id: "list", tab: "personas", target: "members-list", copy: "members.list", emptyCopy: "members.list.empty" },
      { id: "audiences", tab: "audiencias", target: "members-audiences-add", copy: "members.audiences", placement: "bottom" },
    ],
  },
  {
    id: "center",
    icon: "center",
    available: true,
    optional: true,
    requiresHref: CENTER_ROUTE,
    tryIt: "center-tabs",
    steps: [
      { id: "tabs", route: CENTER_ROUTE, tab: "tratamientos", target: "center-tabs", copy: "center.tabs", seconds: 8 },
      { id: "add", tab: "tratamientos", target: "center-add-treatment", copy: "center.addTreatment", requires: "canRequest" },
      { id: "request", tab: "recompensas", target: "center-request-change", copy: "center.requestChange", requires: "canRequest", seconds: 8 },
      { id: "requests", tab: "recompensas", target: "center-requests-link", copy: "center.requests", requires: "canRequest" },
    ],
  },
  {
    id: "engage",
    icon: "engage",
    available: true,
    optional: true,
    requiresHref: ENGAGE_ROUTE,
    tryIt: "engage-compose",
    steps: [
      { id: "compose", route: ENGAGE_ROUTE, tab: "manuales", target: "engage-compose", copy: "engage.compose" },
      { id: "stats", tab: "manuales", target: "engage-stats", copy: "engage.stats" },
      { id: "automations", tab: "automaticos", target: "engage-panel", copy: "engage.automations", placement: "top" },
    ],
  },
  {
    id: "insights",
    icon: "insights",
    available: true,
    optional: true,
    // Metrics needs the members permission (the page redirects without it), the same one as the Miembros nav item.
    requiresHref: MEMBERS_ROUTE,
    tryIt: "settings-notifications",
    steps: [
      { id: "cards", route: METRICS_ROUTE, target: "metrics-cards", copy: "insights.cards" },
      { id: "breakdown", target: "metrics-breakdown", copy: "insights.breakdown", placement: "top" },
      { id: "team", route: SETTINGS_ROUTE, target: "settings-team", copy: "insights.team", requires: "canManageTeam" },
      { id: "notifications", route: SETTINGS_ROUTE, target: "settings-notifications", copy: "insights.notifications" },
    ],
  },
];

export function findChapter(id: string | null | undefined): TourChapter | undefined {
  return TOUR_CHAPTERS.find((chapter) => chapter.id === id);
}

/**
 * The chapter's steps for this person: steps needing a permission they lack are dropped, and
 * sweeps keep only the nav items they can see.
 */
export function visibleSteps(chapter: TourChapter, ctx: TourContext): TourStep[] {
  return chapter.steps.flatMap((step) => {
    if (step.requires && !ctx[step.requires]) return [];
    if (!step.stops) return [step];

    const stops = step.stops.filter((stop) => ctx.navHrefs.includes(stop.href));

    return stops.length ? [{ ...step, stops }] : [];
  });
}

/** The route a step runs on: its own, or the nearest earlier step's. Undefined: any page. */
export function stepRoute(steps: readonly TourStep[], index: number): string | undefined {
  for (let i = Math.min(index, steps.length - 1); i >= 0; i -= 1) {
    if (steps[i].route) return steps[i].route;
  }

  return undefined;
}

/** An honest estimate: each step's reading time plus every page change, rounded up to 5 s. */
export function chapterSeconds(steps: readonly TourStep[]): number {
  let total = 0;
  let route: string | undefined;

  for (const step of steps) {
    total += step.seconds ?? DEFAULT_STEP_SECONDS;

    if (step.route && step.route !== route) {
      total += SLOW_ROUTES.has(step.route) ? SLOW_ROUTE_SECONDS : ROUTE_CHANGE_SECONDS;
      route = step.route;
    }
  }

  return Math.ceil(total / 5) * 5;
}

/**
 * The hub's chapters for this person, in order. Staff spend their day at the front desk, so
 * scanning comes first for them and is marked as recommended.
 */
export function chapterViews(ctx: TourContext): TourChapterView[] {
  const isStaff = ctx.role === "staff";
  const views = TOUR_CHAPTERS.filter((chapter) => !chapter.requiresHref || ctx.navHrefs.includes(chapter.requiresHref))
    .map((chapter): TourChapterView => {
      const steps = visibleSteps(chapter, ctx);

      return { chapter, steps, seconds: chapter.available ? chapterSeconds(steps) : 0, recommended: isStaff && chapter.id === "scan" };
    })
    .filter((view) => !view.chapter.available || view.steps.length > 0);

  if (!isStaff) return views;

  return [...views.filter((view) => view.chapter.id === "scan"), ...views.filter((view) => view.chapter.id !== "scan")];
}

/**
 * The chapter to offer after this one: the next essential one not finished yet. Optional
 * chapters are only ever started from the hub, and lead back to it.
 */
export function nextChapterId(
  views: readonly TourChapterView[],
  current: TourChapterId,
  completed: readonly TourChapterId[],
): TourChapterId | null {
  if (findChapter(current)?.optional) return null;

  const playable = views.filter((view) => view.chapter.available && !view.chapter.optional);
  const start = playable.findIndex((view) => view.chapter.id === current);
  const ordered = [...playable.slice(start + 1), ...playable.slice(0, Math.max(start, 0))];

  return ordered.find((view) => !completed.includes(view.chapter.id) && view.chapter.id !== current)?.chapter.id ?? null;
}

/** Every `data-tour` id the chapters point at, for the breakage guard. */
export function allTargetIds(): string[] {
  const ids = new Set<string>();

  for (const chapter of TOUR_CHAPTERS) {
    if (chapter.tryIt) ids.add(chapter.tryIt);

    for (const step of chapter.steps) {
      for (const id of typeof step.target === "string" ? [step.target] : step.target ?? []) ids.add(id);
      for (const stop of step.stops ?? []) ids.add(stop.target);
    }
  }

  return [...ids].sort();
}
