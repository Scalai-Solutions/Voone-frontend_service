"use client";

import * as React from "react";
import { ArrowRight, BarChart3, Bell, RotateCcw, ScanLine, Sparkles, Users, WalletCards, X, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

import { TOUR_CHAPTER_COPY, TOUR_UI, formatChapterDuration, formatTotalDuration } from "./tour-copy";
import { useTour } from "./tour-provider";
import { TourText } from "./tour-text";
import type { TourChapterIcon, TourChapterView } from "./tour-types";

const ICONS: Record<TourChapterIcon, LucideIcon> = {
  sparkles: Sparkles,
  scan: ScanLine,
  members: Users,
  center: WalletCards,
  engage: Bell,
  insights: BarChart3,
};

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } };
const card: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 28 } },
};
const iconTile: Variants = { rest: { rotate: 0, scale: 1 }, hover: { rotate: -8, scale: 1.08 } };

/** The tutorial's home: every chapter this person can take, how long it is, and what is done. */
export function TourHub() {
  const tour = useTour();
  const reduce = useReducedMotion() ?? false;
  const titleId = React.useId();
  const firstCardRef = React.useRef<HTMLButtonElement>(null);
  const { completed } = tour.state;

  // Progress and the headline length are about the essentials; optional chapters are extra.
  const essentials = tour.chapters.filter((view) => !view.chapter.optional);
  const extras = tour.chapters.filter((view) => view.chapter.optional);
  const playable = essentials.filter((view) => view.chapter.available);
  const done = playable.filter((view) => completed.includes(view.chapter.id)).length;
  const totalSeconds = playable.reduce((sum, view) => sum + view.seconds, 0);
  const extrasSeconds = extras.reduce((sum, view) => sum + view.seconds, 0);
  const allDone = playable.length > 0 && done === playable.length;

  // closeHub is the store's own method, stable for the provider's life: this runs once per opening.
  const { closeHub } = tour;
  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    firstCardRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeHub();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [closeHub]);

  const firstPlayableId = playable[0]?.chapter.id;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1d1513]/60 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) tour.closeHub();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[32px] border border-[#e3d5cd] bg-[#fffaf6] p-5 shadow-[0_40px_120px_-40px_rgba(24,17,15,0.8)] sm:rounded-[32px] sm:p-7"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">{TOUR_UI.hubEyebrow}</p>
            <h2 id={titleId} className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] text-[#2e2421] sm:text-4xl">
              <TourText>{allDone ? TOUR_UI.hubTitleDone : TOUR_UI.hubTitle}</TourText>
            </h2>
            <p className="mt-2 text-sm text-[#927e72]">
              <TourText>{`${TOUR_UI.hubIntro} ${formatTotalDuration(totalSeconds)}`}</TourText>
            </p>
          </div>
          <ProgressRing done={done} total={playable.length} reduce={reduce} />
          <button
            type="button"
            onClick={tour.closeHub}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#927e72] transition hover:bg-[#f4e8df] hover:text-[#35241f]"
            aria-label={TOUR_UI.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <motion.ul className="mt-6 grid gap-3 sm:grid-cols-2" variants={list} initial={reduce ? false : "hidden"} animate="show">
          {essentials.map((view) => (
            <motion.li key={view.chapter.id} variants={card}>
              <ChapterCard
                view={view}
                done={completed.includes(view.chapter.id)}
                reduce={reduce}
                buttonRef={view.chapter.id === firstPlayableId ? firstCardRef : undefined}
                onStart={() => tour.start(view.chapter.id)}
              />
            </motion.li>
          ))}
        </motion.ul>

        {extras.length ? (
          <section className="mt-7" aria-labelledby={`${titleId}-extras`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#eadfd8] pt-5">
              <h3 id={`${titleId}-extras`} className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">
                {TOUR_UI.optionalTitle}
              </h3>
              <p className="text-xs text-[#927e72]">
                <TourText>{TOUR_UI.optionalIntro(formatChapterDuration(extrasSeconds))}</TourText>
              </p>
            </div>
            <motion.ul className="mt-3 grid gap-3 sm:grid-cols-2" variants={list} initial={reduce ? false : "hidden"} animate="show">
              {extras.map((view) => (
                <motion.li key={view.chapter.id} variants={card}>
                  <ChapterCard
                    view={view}
                    done={completed.includes(view.chapter.id)}
                    reduce={reduce}
                    onStart={() => tour.start(view.chapter.id)}
                  />
                </motion.li>
              ))}
            </motion.ul>
          </section>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#927e72]">
          <TourText>{TOUR_UI.completedCount(done, playable.length)}</TourText>
          {done > 0 ? (
            <button
              type="button"
              onClick={tour.resetProgress}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold text-[#9b633e] transition hover:bg-[#f4e8df]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {TOUR_UI.resetProgress}
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ChapterCard({
  view,
  done,
  reduce,
  buttonRef,
  onStart,
}: {
  view: TourChapterView;
  done: boolean;
  reduce: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
  onStart: () => void;
}) {
  const Icon = ICONS[view.chapter.icon];
  const copy = TOUR_CHAPTER_COPY[view.chapter.id];

  if (!view.chapter.available) {
    return (
      <div className="flex h-full items-start gap-3 rounded-3xl border border-dashed border-[#e2d5cc] bg-white/40 p-4 opacity-70">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#efe5dd] text-[#a08b7f]">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg font-semibold text-[#6f5d54]">{copy.title}</p>
          <p className="mt-1 text-xs leading-5 text-[#9a877c]">{copy.description}</p>
          <span className="mt-3 inline-flex whitespace-nowrap rounded-full bg-[#efe5dd] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c7870]">
            {TOUR_UI.comingSoon}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={onStart}
      initial="rest"
      animate="rest"
      whileHover={reduce ? undefined : "hover"}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className={cn(
        "group flex h-full w-full items-start gap-3 rounded-3xl border bg-white/80 p-4 text-left shadow-[0_18px_40px_-34px_rgba(67,48,43,0.7)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8864b]",
        view.recommended ? "border-[#d9b98d]" : "border-[#e2d5cc]",
      )}
    >
      <motion.span
        variants={iconTile}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#2d211e] text-[#e5bd80]"
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-serif text-lg font-semibold text-[#2e2421]">{copy.title}</span>
          {view.recommended ? (
            <span className="whitespace-nowrap rounded-full bg-[#b8864b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              {TOUR_UI.recommended}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#927e72]">{copy.description}</span>
        <span className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <span className="whitespace-nowrap rounded-full bg-[#f4e9df] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#805637]">
              {formatChapterDuration(view.seconds)}
            </span>
            {done ? (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-[#3d6a48]">
                <DrawnCheck reduce={reduce} /> {TOUR_UI.completed}
              </span>
            ) : null}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#9b633e] transition-transform group-hover:translate-x-0.5">
            <TourText>{done ? TOUR_UI.replay : TOUR_UI.start}</TourText> <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </span>
    </motion.button>
  );
}

/** A check mark that draws itself, for finished chapters. */
function DrawnCheck({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.35 }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.8 }}
      />
    </svg>
  );
}

function ProgressRing({ done, total, reduce }: { done: number; total: number; reduce: boolean }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const ratio = total ? done / total : 0;

  return (
    <div className="relative hidden h-16 w-16 shrink-0 sm:block" aria-hidden>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#eadfd8" strokeWidth="6" />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#b8864b"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 80, damping: 18, delay: 0.2 }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums text-[#35241f]">
        <TourText>{`${done}/${total}`}</TourText>
      </span>
    </div>
  );
}
