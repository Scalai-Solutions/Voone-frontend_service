"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { SCAN_ROUTE, chapterViews, findChapter, nextChapterId, stepRoute, visibleSteps } from "./tour-chapters";
import { createTourStore, type TourState } from "./tour-store";
import type { TourChapterId, TourChapterView, TourContext, TourStep } from "./tour-types";

export interface TourApi {
  state: TourState;
  ctx: TourContext;
  chapters: readonly TourChapterView[];
  /** The current chapter's steps for this person, when a chapter is running or paused. */
  steps: readonly TourStep[];
  /** True while a navigation the tour started has not arrived yet. */
  navigating: boolean;
  openHub: () => void;
  closeHub: () => void;
  start: (chapterId: TourChapterId) => void;
  next: () => void;
  back: () => void;
  exit: () => void;
  resume: () => void;
  /** Ends the chapter: marks it done, then either the next chapter or the hub. */
  finish: (then: "next" | "hub") => void;
  /** Ends the chapter and leaves a halo on the real control, with clicks allowed. */
  tryIt: () => void;
  clearHalo: () => void;
  dismissOffer: () => void;
  resetProgress: () => void;
}

const TourContextValue = React.createContext<TourApi | null>(null);
const TourCameraContext = React.createContext(false);

/**
 * Owns the clinic tutorial. Mounted by the clinic shell, which lives in the (dashboard) layout,
 * so the tour survives page changes. Navigation goes through a transition so `navigating` says
 * when the next page has arrived: Next 16's router.push returns nothing to wait on.
 */
export function TourProvider({
  userId,
  role,
  navHrefs,
  canRequest = false,
  canManageTeam = false,
  children,
}: {
  userId: string;
  role: string;
  navHrefs: readonly string[];
  canRequest?: boolean;
  canManageTeam?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [navigating, startTransition] = React.useTransition();
  const [store] = React.useState(() => createTourStore(userId));
  const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const navKey = navHrefs.join("|");
  const ctx = React.useMemo<TourContext>(
    () => ({ role, navHrefs: navKey.split("|"), canRequest, canManageTeam }),
    [canManageTeam, canRequest, navKey, role],
  );
  const chapters = React.useMemo(() => chapterViews(ctx), [ctx]);
  const chapter = findChapter(state.chapterId);
  const steps = React.useMemo(() => (chapter ? visibleSteps(chapter, ctx) : []), [chapter, ctx]);

  const go = React.useCallback(
    (chapterId: TourChapterId, stepIndex: number) => {
      const target = findChapter(chapterId);
      if (!target) return;

      const chapterSteps = visibleSteps(target, ctx);
      if (!chapterSteps.length) return;

      const index = Math.max(0, Math.min(stepIndex, chapterSteps.length - 1));
      const route = stepRoute(chapterSteps, index);
      const tab = chapterSteps[index].tab;
      const here = window.location.pathname;

      store.run(chapterId, index, route ?? here);

      if (route && route !== here) {
        const href = tab ? `${route}?tab=${encodeURIComponent(tab)}` : route;
        startTransition(() => router.push(href, { scroll: false }));
      } else if (tab || route) {
        // Same page: the page reads its tab from the URL (useUrlTab), and Next syncs replaceState
        // with useSearchParams without a server round trip. A page's step with no tab clears it,
        // which puts the page back on its default (the home QR dialog closes, for one). Steps
        // that run on any page (no route) leave the person's own tab alone.
        const url = new URL(window.location.href);
        if ((url.searchParams.get("tab") ?? undefined) !== tab) {
          if (tab) url.searchParams.set("tab", tab);
          else url.searchParams.delete("tab");
          window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        }
      }
    },
    [ctx, router, store],
  );

  // The person left the page the tour is on (browser back, a redirect…): pause instead of
  // spotlighting the wrong screen. Only an actual pathname change counts (not search params, and
  // not the moment between asking the router to move and it starting to), and never the tour's own.
  const seenPathname = React.useRef(pathname);
  React.useEffect(() => {
    const changed = seenPathname.current !== pathname;
    seenPathname.current = pathname;

    if (!changed || navigating || state.mode !== "running" || !state.expectedPath) return;
    if (pathname !== state.expectedPath) store.pause();
  }, [navigating, pathname, state.expectedPath, state.mode, store]);

  const api = React.useMemo<TourApi>(() => {
    const finishChapter = (then: "next" | "hub") => {
      const id = state.chapterId;
      if (!id) return;

      store.complete(id);
      const nextId = then === "next" ? nextChapterId(chapters, id, [...state.completed, id]) : null;

      if (nextId) go(nextId, 0);
      else store.openHub();
    };

    return {
      state,
      ctx,
      chapters,
      steps,
      navigating,
      openHub: store.openHub,
      closeHub: store.exit,
      start: (chapterId) => go(chapterId, 0),
      next: () => {
        if (!state.chapterId) return;
        if (state.stepIndex < steps.length - 1) go(state.chapterId, state.stepIndex + 1);
        else finishChapter("next");
      },
      back: () => {
        if (state.chapterId && state.stepIndex > 0) go(state.chapterId, state.stepIndex - 1);
      },
      exit: store.exit,
      resume: () => {
        if (state.chapterId) go(state.chapterId, state.stepIndex);
      },
      finish: finishChapter,
      tryIt: () => {
        const id = state.chapterId;
        const target = findChapter(id)?.tryIt;
        if (!id) return;

        store.complete(id);
        if (target) store.showHalo({ target, pathname: window.location.pathname });
        else store.exit();
      },
      clearHalo: store.clearHalo,
      dismissOffer: store.dismissOffer,
      resetProgress: store.resetProgress,
    };
  }, [chapters, ctx, go, navigating, state, steps, store]);

  // The scan page turns the camera on as soon as it mounts. While a tour step runs there, hold it
  // off so the tutorial never triggers the browser's camera prompt; it starts when the tour ends.
  const holdsCamera =
    (state.mode === "running" || state.mode === "paused") && stepRoute(steps, state.stepIndex) === SCAN_ROUTE;

  return (
    <TourContextValue.Provider value={api}>
      <TourCameraContext.Provider value={holdsCamera}>{children}</TourCameraContext.Provider>
    </TourContextValue.Provider>
  );
}

export function useTour(): TourApi {
  const api = React.useContext(TourContextValue);
  if (!api) throw new Error("useTour must be used inside <TourProvider>");
  return api;
}

/** True while the tutorial is showing the scan page; false outside the clinic shell. */
export function useTourHoldsCamera(): boolean {
  return React.useContext(TourCameraContext);
}
