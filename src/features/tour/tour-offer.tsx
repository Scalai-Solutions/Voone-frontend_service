"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SCAN_ROUTE } from "./tour-chapters";
import { TOUR_UI, formatDurationWords } from "./tour-copy";
import { useTour } from "./tour-provider";

/** How long the person must leave the page alone before the offer slides in. */
const IDLE_MS = 4000;

/**
 * The one-time "shall we show you around?" card. It never appears on the scan page (that is
 * front-desk work in progress) and waits for a quiet moment. Rendered inside the shell's stacking
 * context at z-[45], so the app's own dialogs (z-50) always cover it.
 */
export function TourOffer() {
  const tour = useTour();
  const pathname = usePathname();
  const reduce = useReducedMotion() ?? false;
  // Idleness belongs to one page: moving on starts the quiet-moment wait again.
  const [idleOn, setIdleOn] = React.useState<string | null>(null);
  const idle = idleOn === pathname;
  const { mode, completed, offerDismissed } = tour.state;
  const first = tour.chapters.find((view) => view.chapter.available && !view.chapter.optional);
  const eligible = mode === "idle" && !offerDismissed && completed.length === 0 && pathname !== SCAN_ROUTE && Boolean(first);

  React.useEffect(() => {
    if (!eligible || idle) return;

    const markIdle = () => setIdleOn(pathname);
    let timer = window.setTimeout(markIdle, IDLE_MS);
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(markIdle, IDLE_MS);
    };
    const events = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, restart, { passive: true, capture: true });

    return () => {
      window.clearTimeout(timer);
      for (const name of events) window.removeEventListener(name, restart, { capture: true });
    };
  }, [eligible, idle, pathname]);

  const show = eligible && idle && first;

  return (
    <AnimatePresence>
      {show ? (
        <motion.aside
          key="tour-offer"
          aria-label={TOUR_UI.offerTitle}
          className="fixed inset-x-4 bottom-20 z-[45] rounded-[26px] border border-[#e3d5cd] bg-[#fffaf6] p-4 shadow-[0_30px_80px_-30px_rgba(24,17,15,0.7)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[340px]"
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 26 }}
        >
          <div className="flex items-start gap-3">
            <motion.span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#2d211e] text-[#e5bd80]"
              animate={reduce ? undefined : { rotate: [0, -10, 10, -5, 0] }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <GraduationCap className="h-5 w-5" />
            </motion.span>
            <div className="min-w-0">
              <p className="font-serif text-xl font-semibold leading-tight text-[#2e2421]">{TOUR_UI.offerTitle}</p>
              <p className="mt-1 text-sm leading-5 text-[#806d63]">{TOUR_UI.offerBody(formatDurationWords(first.seconds))}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={tour.dismissOffer}
              className="min-h-10 whitespace-nowrap rounded-full px-4 text-sm font-semibold text-[#806b60] transition hover:bg-[#f4e8df]"
            >
              {TOUR_UI.offerLater}
            </button>
            <button
              type="button"
              onClick={() => tour.start(first.chapter.id)}
              className="min-h-10 whitespace-nowrap rounded-full bg-[#2d211e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
            >
              {TOUR_UI.start}
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
