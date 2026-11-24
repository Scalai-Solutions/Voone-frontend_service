"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { GraduationCap, Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { TOUR_CHAPTER_COPY, TOUR_UI } from "./tour-copy";
import { useIsClient } from "./tour-hooks";
import { TourHub } from "./tour-hub";
import { TourOverlay } from "./tour-overlay";
import { useTour } from "./tour-provider";
import { useTourTarget } from "./use-tour-target";

const HALO_MS = 8000;

/**
 * Everything the tutorial draws above the app, in a portal on <body> at z-[100]: above the
 * header (z-40), dialogs (z-50) and tooltips (z-[60]) without changing any of them. The clinic
 * shell root is `isolate`, so nothing rendered inside it could sit above its own dialogs.
 */
export function TourLayer() {
  const isClient = useIsClient();
  const { state } = useTour();

  if (!isClient) return null;

  return createPortal(
    <>
      <AnimatePresence>{state.mode === "hub" ? <TourHub key="hub" /> : null}</AnimatePresence>
      <AnimatePresence>{state.mode === "running" ? <TourOverlay key="overlay" /> : null}</AnimatePresence>
      <AnimatePresence>{state.mode === "paused" ? <PausedPill key="paused" /> : null}</AnimatePresence>
      {state.halo ? <TryItHalo key={`${state.halo.target}@${state.halo.pathname}`} /> : null}
    </>,
    document.body,
  );
}

/** Shown after a reload or when the person left the tour's page: resume, or let it go. */
function PausedPill() {
  const tour = useTour();
  const reduce = useReducedMotion() ?? false;
  const chapterId = tour.state.chapterId;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex justify-center px-4 sm:bottom-6">
      <motion.div
        role="status"
        className="pointer-events-auto flex min-w-0 max-w-full items-center gap-2 rounded-full border border-white/10 bg-[#201715] py-1.5 pl-4 pr-1.5 text-sm text-[#f5e8dd] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: 12 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }}
      >
        <GraduationCap className="h-4 w-4 shrink-0 text-[#e5bd80]" />
        <span className="min-w-0 truncate">
          <span className="font-semibold">{TOUR_UI.paused}</span>
          {chapterId ? <span className="hidden text-[#c9b7ad] sm:inline"> · {TOUR_CHAPTER_COPY[chapterId].title}</span> : null}
        </span>
        <button
          type="button"
          onClick={tour.resume}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f5e8dd] px-3 text-xs font-semibold text-[#35241f] transition hover:bg-white"
        >
          <Play className="h-3.5 w-3.5" /> {TOUR_UI.resume}
        </button>
        <button
          type="button"
          onClick={tour.exit}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#c9b7ad] transition hover:bg-white/10 hover:text-white"
          aria-label={TOUR_UI.leave}
          title={TOUR_UI.leave}
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
}

/**
 * "Pruébalo ahora": a soft pulsing ring on the real control, with clicks going straight through.
 * It leaves on the first click anywhere, on a page change, or after a few seconds.
 */
function TryItHalo() {
  const { state, clearHalo } = useTour();
  const pathname = usePathname();
  const reduce = useReducedMotion() ?? false;
  const halo = state.halo;
  const samePage = halo?.pathname === pathname;
  const target = useTourTarget(halo ? [halo.target] : null, samePage, "try-it halo");

  React.useEffect(() => {
    if (!samePage) {
      clearHalo();
      return;
    }
    const timer = window.setTimeout(clearHalo, HALO_MS);
    // Let the click reach the real control first, then fade.
    const onPointer = () => window.setTimeout(clearHalo, 0);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [clearHalo, samePage]);

  React.useEffect(() => {
    if (target.status === "missing") clearHalo();
  }, [clearHalo, target.status]);

  const rect = target.rect;
  if (!rect) return null;

  const pad = 6;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      <motion.div
        className="fixed rounded-[20px] border-2 border-[#e5bd80] shadow-[0_0_0_6px_rgba(229,189,128,0.25)]"
        style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        initial={reduce ? false : { opacity: 0, scale: 1.15 }}
        animate={reduce ? { opacity: 1 } : { opacity: [1, 0.45, 1], scale: [1, 1.04, 1] }}
        transition={reduce ? { duration: 0 } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="fixed whitespace-nowrap rounded-full bg-[#2d211e] px-3 py-1 text-xs font-semibold text-white shadow-lg"
        style={{ left: rect.left - pad, top: Math.max(8, rect.top - pad - 34) }}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.15 }}
      >
        {TOUR_UI.tryItHere}
      </motion.span>
    </div>
  );
}
