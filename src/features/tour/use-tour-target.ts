"use client";

import * as React from "react";

import type { Box } from "@/lib/tooltip-position";

export type TourTargetStatus = "off" | "waiting" | "found" | "missing";

/** How long a page may take to show a target after it has arrived (throttled networks included). */
export const TARGET_TIMEOUT_MS = 8000;

/** The first `[data-tour=id]` that is actually on screen; `hidden` / `display:none` copies don't count. */
function findVisible(ids: readonly string[]): Element | null {
  for (const id of ids) {
    for (const el of document.querySelectorAll(`[data-tour="${CSS.escape(id)}"]`)) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) return el;
    }
  }

  return null;
}

const sameBox = (a: Box | null, b: Box) =>
  Boolean(a) && a!.left === b.left && a!.top === b.top && a!.width === b.width && a!.height === b.height;

/**
 * Waits for a tour target to appear and follows it on screen. `enabled` is false until the step's
 * page has arrived, so a target is never looked up on the page being left. Pages can swap their
 * markup (a loading state becoming the real list), so a target that leaves the DOM is looked up again.
 */
export function useTourTarget(ids: readonly string[] | null, enabled: boolean, label: string) {
  const key = enabled && ids?.length ? ids.join("|") : "";
  const [found, setFound] = React.useState<{ key: string; el: Element | null }>({ key: "", el: null });
  const [lookup, setLookup] = React.useState(0);
  const [tracked, setTracked] = React.useState<{ el: Element; box: Box } | null>(null);

  React.useEffect(() => {
    if (!key) return;

    const list = key.split("|");
    let done = false;

    const stop = () => {
      done = true;
      observer.disconnect();
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
    const check = () => {
      if (done) return;
      const el = findVisible(list);
      if (!el) return;
      stop();
      setFound({ key, el });
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-tour", "class", "style", "hidden", "aria-hidden"],
    });
    const frame = window.requestAnimationFrame(check);
    const timer = window.setTimeout(() => {
      if (done) return;
      stop();
      setFound({ key, el: null });
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[tour] target not found: ${list.join(" or ")} (${label})`);
      }
    }, TARGET_TIMEOUT_MS);

    return stop;
  }, [key, label, lookup]);

  // Follow the element while it scrolls, resizes or moves because content above it loaded.
  const followed = found.el;
  React.useEffect(() => {
    if (!followed) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!followed.isConnected) {
        setTracked(null);
        setFound((previous) => (previous.el === followed ? { key: "", el: null } : previous));
        setLookup((n) => n + 1);
        return;
      }

      const rect = followed.getBoundingClientRect();
      const box = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      setTracked((previous) => (previous?.el === followed && sameBox(previous.box, box) ? previous : { el: followed, box }));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    schedule();
    const resize = new ResizeObserver(schedule);
    resize.observe(followed);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    // Layout shifts from content loading elsewhere don't fire any of the above.
    const poll = window.setInterval(schedule, 400);

    return () => {
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.clearInterval(poll);
    };
  }, [followed]);

  const current = found.key === key && key ? found : null;
  const status: TourTargetStatus = !key ? "off" : !current ? "waiting" : current.el ? "found" : "missing";
  const el = status === "found" ? current!.el : null;
  const rect = el && tracked?.el === el ? tracked.box : null;
  // While the next target on the same page is being looked up, the previous one is still followed,
  // so the spotlight can glide from it instead of closing and reopening.
  const previousRect = status === "waiting" && tracked ? tracked.box : null;

  return { status, el, rect, previousRect };
}
