/**
 * Where the tutorial remembers things. Progress is per browser (localStorage); the chapter in
 * progress is per tab (sessionStorage) so a reload can offer to resume it. Storage can be missing
 * or throw (private windows, blocked site data), so every access is guarded and the tutorial
 * still works without it, just without memory.
 */

import type { TourChapterId } from "./tour-types.ts";

export interface TourProgress {
  completed: TourChapterId[];
  offerDismissed: boolean;
}

export interface TourActive {
  chapterId: TourChapterId;
  stepIndex: number;
  savedAt: number;
}

/** An unfinished chapter older than this is forgotten rather than offered again. */
export const RESUME_WINDOW_MS = 30 * 60 * 1000;

const progressKey = (userId: string) => `voone:tour:v1:${userId}`;
const activeKey = (userId: string) => `voone:tour:active:${userId}`;

const CHAPTER_IDS: readonly TourChapterId[] = ["welcome", "scan", "members", "center", "engage", "insights"];
const isChapterId = (value: unknown): value is TourChapterId =>
  typeof value === "string" && (CHAPTER_IDS as readonly string[]).includes(value);

function read(storage: () => Storage, key: string): unknown {
  try {
    const raw = storage().getItem(key);

    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // No storage: the tutorial simply forgets.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export function readProgress(userId: string): TourProgress {
  const value = read(local, progressKey(userId)) as Partial<TourProgress> | null;

  return {
    completed: Array.isArray(value?.completed) ? value.completed.filter(isChapterId) : [],
    offerDismissed: value?.offerDismissed === true,
  };
}

export function writeProgress(userId: string, progress: TourProgress) {
  write(local, progressKey(userId), progress);
}

export function readActive(userId: string, now: number): TourActive | null {
  const value = read(session, activeKey(userId)) as Partial<TourActive> | null;

  if (!value || !isChapterId(value.chapterId)) return null;
  if (typeof value.stepIndex !== "number" || value.stepIndex < 0) return null;
  if (typeof value.savedAt !== "number" || now - value.savedAt > RESUME_WINDOW_MS) return null;

  return { chapterId: value.chapterId, stepIndex: Math.floor(value.stepIndex), savedAt: value.savedAt };
}

export function writeActive(userId: string, active: TourActive | null) {
  write(session, activeKey(userId), active);
}
