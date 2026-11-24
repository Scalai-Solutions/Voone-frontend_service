/**
 * The tutorial's state as a tiny external store, read with `useSyncExternalStore`. Keeping it
 * outside React state lets it start from browser storage on the client while the server (and the
 * hydration pass) see the idle state, without a mismatch or a setState-in-effect.
 */

import { readActive, readProgress, writeActive, writeProgress } from "./tour-storage.ts";
import type { TourChapterId } from "./tour-types.ts";

export type TourMode = "idle" | "hub" | "running" | "paused";

export interface TourHalo {
  target: string;
  /** The halo only belongs to the page it was shown on. */
  pathname: string;
}

export interface TourState {
  mode: TourMode;
  chapterId: TourChapterId | null;
  stepIndex: number;
  /** The pathname the tour expects to be on; any other pathname while running means the person left. */
  expectedPath: string | null;
  completed: readonly TourChapterId[];
  offerDismissed: boolean;
  halo: TourHalo | null;
}

export const SERVER_TOUR_STATE: TourState = {
  mode: "idle",
  chapterId: null,
  stepIndex: 0,
  expectedPath: null,
  completed: [],
  // The server never offers the tour; the client decides once it has read storage.
  offerDismissed: true,
  halo: null,
};

export interface TourStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => TourState;
  getServerSnapshot: () => TourState;
  openHub: () => void;
  run: (chapterId: TourChapterId, stepIndex: number, expectedPath: string) => void;
  pause: () => void;
  exit: () => void;
  complete: (chapterId: TourChapterId) => void;
  showHalo: (halo: TourHalo) => void;
  clearHalo: () => void;
  dismissOffer: () => void;
  resetProgress: () => void;
}

export function createTourStore(userId: string): TourStore {
  const listeners = new Set<() => void>();
  let state: TourState = SERVER_TOUR_STATE;
  let loaded = false;

  // Read storage on the first client read, not at creation: the store is also created during SSR.
  function current(): TourState {
    if (!loaded && typeof window !== "undefined") {
      loaded = true;
      const progress = readProgress(userId);
      const active = readActive(userId, Date.now());

      state = {
        ...SERVER_TOUR_STATE,
        completed: progress.completed,
        offerDismissed: progress.offerDismissed,
        ...(active ? { mode: "paused" as const, chapterId: active.chapterId, stepIndex: active.stepIndex } : {}),
      };
    }

    return state;
  }

  function set(patch: Partial<TourState>) {
    const previous = current();
    state = { ...previous, ...patch };

    if (state.completed !== previous.completed || state.offerDismissed !== previous.offerDismissed) {
      writeProgress(userId, { completed: [...state.completed], offerDismissed: state.offerDismissed });
    }

    const inChapter = (state.mode === "running" || state.mode === "paused") && state.chapterId;
    writeActive(userId, inChapter ? { chapterId: state.chapterId!, stepIndex: state.stepIndex, savedAt: Date.now() } : null);

    for (const listener of listeners) listener();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: current,
    getServerSnapshot: () => SERVER_TOUR_STATE,
    openHub: () => set({ mode: "hub", chapterId: null, stepIndex: 0, expectedPath: null, halo: null, offerDismissed: true }),
    run: (chapterId, stepIndex, expectedPath) =>
      set({ mode: "running", chapterId, stepIndex, expectedPath, halo: null, offerDismissed: true }),
    pause: () => {
      if (current().mode === "running") set({ mode: "paused", expectedPath: null });
    },
    exit: () => set({ mode: "idle", chapterId: null, stepIndex: 0, expectedPath: null }),
    complete: (chapterId) => {
      const { completed } = current();
      if (!completed.includes(chapterId)) set({ completed: [...completed, chapterId] });
    },
    showHalo: (halo) => set({ mode: "idle", chapterId: null, stepIndex: 0, expectedPath: null, halo }),
    clearHalo: () => {
      if (current().halo) set({ halo: null });
    },
    dismissOffer: () => set({ offerDismissed: true }),
    resetProgress: () => set({ completed: [] }),
  };
}
