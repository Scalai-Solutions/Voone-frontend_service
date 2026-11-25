/**
 * The clinic tutorial's data model. Chapters and steps are plain data (tour-chapters.ts) so the
 * breakage guard can read every `data-tour` id they point at without rendering anything.
 */

import type { TourCopyKey, TourStopCopyKey } from "./tour-copy.ts";

export type TourChapterId = "welcome" | "home" | "scan" | "members" | "center" | "engage" | "insights" | "inspire";

export type TourChapterIcon = "sparkles" | "home" | "scan" | "members" | "center" | "engage" | "insights" | "inspire";

/** The parts of the visit panel the scan chapter walks through (they only exist after a scan). */
export type VisitFocus = "lines" | "extras" | "bono" | "rewards";

/** The Inspírate campaigns, one per step (tour-campaigns.ts). */
export type CampaignId = "navidad" | "mujer" | "ultima-hora" | "novedades" | "black-friday";

/** Illustrations drawn inside a bubble instead of (or beside) a spotlight. */
export type TourSceneId =
  | "welcome-emblem"
  | "signup-referral"
  | "signup-consent"
  | `visit-${VisitFocus}`
  | "card-recovery"
  | "send-setup"
  | `campaign-${CampaignId}`;

/** What the chapter list and step filters know about the person taking the tour. */
export interface TourContext {
  role: string;
  /** The hrefs of the clinic nav items this person can see (already filtered by permission). */
  navHrefs: readonly string[];
  /** Owners and managers who edit the centre: they add treatments and request programme changes. */
  canRequest?: boolean;
  /** Who can see the team section in settings. */
  canManageTeam?: boolean;
}

/** A permission a step needs; steps the person can't use are left out. */
export type TourRequirement = "canRequest" | "canManageTeam";

/** One stop of a sweep: the spotlight glides across these inside a single step. */
export interface TourStop {
  target: string;
  /** Only shown when this nav item is visible to the person. */
  href: string;
  copy: TourStopCopyKey;
}

export interface TourStep {
  id: string;
  /** Navigate here before the step. A step without a route stays on the previous step's page. */
  route?: string;
  /**
   * The `data-tour` id(s) to spotlight. With several, the first one that is visible on screen
   * wins (the profile gear on wide screens, the floating help button on small ones).
   * No target: the bubble sits in the middle of the screen.
   */
  target?: string | readonly string[];
  /** A sweep: stops inside this one step that the person steps through with Next and Back. */
  stops?: readonly TourStop[];
  copy: TourCopyKey;
  /** Used instead of `copy` when the target carries `data-tour-empty` (e.g. a list with no members yet). */
  emptyCopy?: TourCopyKey;
  /**
   * The page tab (`?tab=…`) this step needs. Tabbed pages unmount inactive tabs, so the tour
   * opens the right one first. Every step on a tabbed page names its tab, so Back works too.
   */
  tab?: string;
  requires?: TourRequirement;
  scene?: TourSceneId;
  placement?: "top" | "bottom";
  /** For the duration shown on the hub card. Defaults to DEFAULT_STEP_SECONDS. */
  seconds?: number;
}

export interface TourChapter {
  id: TourChapterId;
  icon: TourChapterIcon;
  /** False: listed as coming soon. */
  available: boolean;
  /**
   * Extra chapters: listed apart in the hub, not counted in its progress, and never chained into
   * after another chapter. The essentials (Welcome, Scan) are the path the tutorial suggests.
   */
  optional?: boolean;
  /** The chapter is only listed when this nav item is visible to the person. */
  requiresHref?: string;
  /** Where "Pruébalo ahora" points once the chapter is done. */
  tryIt?: string;
  steps: readonly TourStep[];
}

export interface TourChapterView {
  chapter: TourChapter;
  steps: readonly TourStep[];
  seconds: number;
  recommended: boolean;
}
