"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, CameraOff, Loader2, MousePointerClick, X } from "lucide-react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import type { Size } from "@/lib/tooltip-position";

import { findChapter, nextChapterId, stepRoute } from "./tour-chapters";
import { TOUR_CHAPTER_COPY, TOUR_STEP_COPY, TOUR_STOP_COPY, TOUR_UI, type TourStepCopy } from "./tour-copy";
import { useViewport } from "./tour-hooks";
import { useTour } from "./tour-provider";
import { TourScene } from "./tour-scenes";
import { TourText } from "./tour-text";
import { placeBubble, scrollTargetIntoView } from "./scroll-to-target";
import { useTourTarget } from "./use-tour-target";

const SPOT_PADDING = 8;
const SWEEP_STOP_MS = 1800;
const BUBBLE_WIDTH = 380;
/** Below this width the bubble becomes a bottom sheet. */
const SHEET_BREAKPOINT = 640;
const SPRING = { type: "spring", stiffness: 240, damping: 30, mass: 0.9 } as const;
const INSTANT = { duration: 0 } as const;

/**
 * The running chapter: a dimmed screen with a spotlight that springs from one real control to the
 * next, and a bubble that explains it. The overlay takes every click, so nothing real can be changed
 * by accident mid-tour; "Pruébalo ahora" at the end hands the real control back.
 */
export function TourOverlay() {
  const tour = useTour();
  const { state, steps, navigating } = tour;
  const pathname = usePathname();
  const reduce = useReducedMotion() ?? false;
  const viewport = useViewport();
  const titleId = React.useId();
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const [nudgeScope, nudge] = useAnimate<HTMLDivElement>();
  const [bubbleSize, setBubbleSize] = React.useState<Size | null>(null);

  const chapter = findChapter(state.chapterId);
  const step = steps[state.stepIndex];
  const stepKey = `${state.chapterId}:${state.stepIndex}`;
  const route = stepRoute(steps, state.stepIndex);
  const arrived = !navigating && (!route || pathname === route);

  // The sweep's position resets whenever the step changes, without an effect.
  const [stop, setStop] = React.useState({ key: stepKey, index: 0 });
  const stops = step?.stops;
  const stopIndex = stop.key === stepKey && stops ? Math.min(stop.index, stops.length - 1) : 0;
  const ids = stops ? [stops[stopIndex].target] : step?.target ? (typeof step.target === "string" ? [step.target] : step.target) : null;
  const target = useTourTarget(ids, arrived, `${stepKey} on ${route ?? "any page"}`);

  const isSheet = viewport.width < SHEET_BREAKPOINT;
  const isLast = state.stepIndex === steps.length - 1;
  const lastStop = !stops || stopIndex === stops.length - 1;
  const nextId = chapter ? nextChapterId(tour.chapters, chapter.id, [...state.completed, chapter.id]) : null;

  // Auto-advance a sweep once its current stop is on screen.
  React.useEffect(() => {
    if (!stops || lastStop || target.status !== "found") return;
    const timer = window.setTimeout(() => setStop({ key: stepKey, index: stopIndex + 1 }), SWEEP_STOP_MS);
    return () => window.clearTimeout(timer);
  }, [lastStop, stepKey, stopIndex, stops, target.status]);

  React.useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const size = box ? { width: box.inlineSize, height: box.blockSize } : { width: el.offsetWidth, height: el.offsetHeight };
      setBubbleSize((previous) => (previous && previous.width === size.width && previous.height === size.height ? previous : size));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSheet]);

  const sheetHeight = isSheet ? (bubbleSize?.height ?? 0) : 0;
  React.useEffect(() => {
    if (target.el) scrollTargetIntoView(target.el, { bottomInset: sheetHeight, smooth: !reduce });
  }, [reduce, sheetHeight, target.el]);

  React.useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [stepKey, stopIndex]);

  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  const primary = () => {
    if (!lastStop) setStop({ key: stepKey, index: stopIndex + 1 });
    else if (isLast) tour.finish(nextId ? "next" : "hub");
    else tour.next();
  };
  const back = () => {
    if (stops && stopIndex > 0) setStop({ key: stepKey, index: stopIndex - 1 });
    else tour.back();
  };

  const keys = React.useRef({ primary, back, exit: tour.exit });
  React.useEffect(() => {
    keys.current = { primary, back, exit: tour.exit };
  });
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") keys.current.exit();
      else if (event.key === "ArrowRight") keys.current.primary();
      else if (event.key === "ArrowLeft") keys.current.back();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!chapter || !step) return null;

  // A list with nothing in it yet says so (data-tour-empty), and the bubble explains what will appear there.
  const empty = Boolean(step.emptyCopy && target.el?.hasAttribute("data-tour-empty"));
  const copy: TourStepCopy = TOUR_STEP_COPY[empty && step.emptyCopy ? step.emptyCopy : step.copy];
  const stopCopy = stops ? TOUR_STOP_COPY[stops[stopIndex].copy] : null;
  const loading = Boolean(route) && (!arrived || target.status === "waiting");

  const spotRect = arrived ? (target.rect ?? target.previousRect) : null;
  const hole = spotRect
    ? {
        x: spotRect.left - SPOT_PADDING,
        y: spotRect.top - SPOT_PADDING,
        width: spotRect.width + SPOT_PADDING * 2,
        height: spotRect.height + SPOT_PADDING * 2,
      }
    : { x: viewport.width / 2, y: viewport.height / 2, width: 0, height: 0 };

  const size = bubbleSize ?? { width: Math.min(BUBBLE_WIDTH, viewport.width - 32), height: 260 };
  const position =
    target.rect && !isSheet
      ? placeBubble({ left: hole.x, top: hole.y, width: hole.width, height: hole.height }, size, viewport, step.placement ?? "bottom")
      : { left: (viewport.width - size.width) / 2, top: (viewport.height - size.height) / 2 };

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !bubbleRef.current) return;
    const focusables = [...bubbleRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onBackdrop = () => {
    if (!reduce && nudgeScope.current) void nudge(nudgeScope.current, { x: [0, -7, 7, -4, 0] }, { duration: 0.35 });
  };

  const content = (
    <div ref={nudgeScope}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b7874a]">
          <TourText>{`${TOUR_CHAPTER_COPY[chapter.id].title} · ${TOUR_UI.stepOf(state.stepIndex + 1, steps.length)}`}</TourText>
        </p>
        <button
          type="button"
          onClick={tour.exit}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#927e72] transition hover:bg-[#f4e8df] hover:text-[#35241f]"
          aria-label={TOUR_UI.exit}
          title={TOUR_UI.exit}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${stepKey}:${empty}`}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -4 }}
          transition={reduce ? INSTANT : { duration: 0.18 }}
          className="mt-2"
        >
          {step.scene ? <TourScene id={step.scene} /> : null}
          <h2 id={titleId} className="font-serif text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#2e2421]">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#806d63]">{copy.body}</p>
          {stops && stopCopy ? (
            <div className="mt-3 rounded-2xl bg-[#f6f1ed] px-3.5 py-3">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={stopIndex}
                  initial={reduce ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -8 }}
                  transition={reduce ? INSTANT : { duration: 0.16 }}
                  className="text-sm leading-5 text-[#493832]"
                >
                  <span className="font-semibold text-[#2e2421]">{stopCopy.label}</span> · {stopCopy.body}
                </motion.p>
              </AnimatePresence>
              <div className="mt-2.5 flex gap-1.5" aria-hidden>
                {stops.map((item, index) => (
                  <span key={item.target} className="h-1 flex-1 overflow-hidden rounded-full bg-[#e2d5cc]">
                    <motion.span
                      className="block h-full rounded-full bg-[#b8864b]"
                      initial={false}
                      animate={{ width: index <= stopIndex ? "100%" : "0%" }}
                      transition={reduce ? INSTANT : { duration: index === stopIndex ? 0.5 : 0.2 }}
                    />
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {copy.note ? (
            <p className="mt-3 flex items-start gap-2 rounded-2xl border border-[#ead9c9] bg-[#fffaf6] px-3 py-2.5 text-xs leading-5 text-[#806d63]">
              <CameraOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b8864b]" /> {copy.note}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {loading ? (
        // Late on purpose: a target on the same page is usually found within a frame, so no flicker.
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.35, duration: 0.2 }}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f4e8df] px-3 py-1 text-xs font-semibold text-[#805637]"
          role="status"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {TOUR_UI.loading}
        </motion.p>
      ) : null}

      {/* One live region that outlives the step transitions, so screen readers hear each step. */}
      <p className="sr-only" aria-live="polite">
        <TourText>{[`${copy.title}.`, copy.body, stopCopy ? `${stopCopy.label}: ${stopCopy.body}` : ""].join(" ").trim()}</TourText>
      </p>

      {/* Progress and Back get their own line, so the action buttons below always have the full width. */}
      <div className="mt-5 flex min-h-9 items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((item, index) => (
            <motion.span
              key={item.id}
              className={cn("h-1.5 rounded-full", index <= state.stepIndex ? "bg-[#2d211e]" : "bg-[#e2d5cc]")}
              initial={false}
              animate={{ width: index === state.stepIndex ? 18 : 6 }}
              transition={reduce ? INSTANT : SPRING}
            />
          ))}
        </div>
        {state.stepIndex > 0 || stopIndex > 0 ? (
          <button
            type="button"
            onClick={back}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold text-[#806b60] transition hover:bg-[#f4e8df]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> {TOUR_UI.back}
          </button>
        ) : null}
      </div>

      {/* Spanish labels run long. Each button keeps at least its text's width (never squeezed or
          cut), they share a line when they fit and wrap into full-width rows when they don't. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {isLast && lastStop && chapter.tryIt ? (
          <button
            type="button"
            onClick={tour.tryIt}
            className="inline-flex min-h-11 min-w-fit grow basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#d8c8bd] bg-white px-4 text-sm font-semibold text-[#493832] transition hover:bg-[#fffaf6]"
          >
            <MousePointerClick className="h-4 w-4 shrink-0" /> {TOUR_UI.tryIt}
          </button>
        ) : null}
        <button
          ref={primaryRef}
          type="button"
          onClick={primary}
          className="inline-flex min-h-11 min-w-fit grow basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#2d211e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
        >
          <TourText>{isLast && lastStop ? (nextId ? TOUR_UI.nextChapter : TOUR_UI.finish) : TOUR_UI.next}</TourText>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[100]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduce ? INSTANT : { duration: 0.25 }}
      onPointerDown={(event) => {
        if (!bubbleRef.current?.contains(event.target as Node)) onBackdrop();
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 rounded-[18px] shadow-[0_0_0_200vmax_rgba(24,17,15,0.66)]"
        initial={false}
        animate={hole}
        transition={reduce ? INSTANT : SPRING}
      >
        {spotRect ? (
          <motion.span
            className="absolute -inset-1 rounded-[22px] border-2 border-[#e5bd80]"
            animate={reduce ? { opacity: 0.9 } : { opacity: [0.95, 0.25, 0.95], scale: [1, 1.03, 1] }}
            transition={reduce ? INSTANT : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </motion.div>

      {isSheet ? (
        <motion.div
          ref={bubbleRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={trapFocus}
          className="fixed inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-[28px] border-t border-[#e3d5cd] bg-[#fffaf6] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_60px_-30px_rgba(0,0,0,0.6)]"
          initial={reduce ? false : { y: "100%" }}
          animate={{ y: 0 }}
          transition={reduce ? INSTANT : SPRING}
        >
          <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-[#e2d5cc]" aria-hidden />
          {content}
        </motion.div>
      ) : (
        <motion.div
          ref={bubbleRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={trapFocus}
          className="fixed left-0 top-0 rounded-[26px] border border-[#e3d5cd] bg-[#fffaf6] p-5 shadow-[0_30px_80px_-30px_rgba(24,17,15,0.75)]"
          style={{ width: Math.min(BUBBLE_WIDTH, viewport.width - 32) }}
          initial={reduce ? false : { opacity: 0, scale: 0.94, x: position.left, y: position.top }}
          animate={{ opacity: 1, scale: 1, x: position.left, y: position.top }}
          transition={reduce ? INSTANT : SPRING}
        >
          {content}
        </motion.div>
      )}
    </motion.div>
  );
}
