/**
 * Scrolling and placement for the tour bubble, in viewport coordinates.
 */

import { placeTooltip, type Box, type Size } from "@/lib/tooltip-position";

const MARGIN = 12;
const GAP = 14;

/**
 * Brings a target into the visible band: below the sticky header and above the bottom sheet (on
 * phones the bubble is a sheet covering the bottom of the screen). Targets inside the header are
 * always visible vertically; the nav may still need a horizontal scroll on small screens.
 */
export function scrollTargetIntoView(el: Element, { bottomInset, smooth }: { bottomInset: number; smooth: boolean }) {
  const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
  const header = document.querySelector("header");

  if (header?.contains(el)) {
    el.scrollIntoView({ behavior, block: "nearest", inline: "center" });
    return;
  }

  const rect = el.getBoundingClientRect();
  const bandTop = (header?.getBoundingClientRect().bottom ?? 0) + MARGIN;
  const bandBottom = window.innerHeight - bottomInset - MARGIN;
  const bandHeight = bandBottom - bandTop;

  if (rect.top >= bandTop && rect.bottom <= bandBottom) return;

  // Too tall to fit: show its top. Otherwise centre it in the band.
  const delta = rect.height > bandHeight ? rect.top - bandTop : rect.top + rect.height / 2 - (bandTop + bandHeight / 2);

  // Inside a dialog that scrolls on its own (the home QR dialog), scroll the dialog, not the page.
  (scrollParent(el) ?? window).scrollBy({ top: delta, behavior });
}

/** The nearest ancestor that actually scrolls vertically, or null for the page itself. */
function scrollParent(el: Element): HTMLElement | null {
  for (let node = el.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }

  return null;
}

/**
 * Where the bubble goes next to the spotlight: above or below when there is room (the same rule
 * as the app's tooltips), beside it for tall targets, else the bottom-right corner.
 */
export function placeBubble(anchor: Box, bubble: Size, viewport: Size, side: "top" | "bottom"): { left: number; top: number } {
  const padded = { left: anchor.left, top: anchor.top - GAP, width: anchor.width, height: anchor.height + GAP * 2 };
  const fitsBelow = padded.top + padded.height + bubble.height <= viewport.height - MARGIN;
  const fitsAbove = padded.top - bubble.height >= MARGIN;

  if (fitsBelow || fitsAbove) {
    const placed = placeTooltip(padded, bubble, viewport, side);
    return { left: Math.max(MARGIN, Math.min(placed.left, viewport.width - MARGIN - bubble.width)), top: placed.top };
  }

  const top = Math.max(MARGIN, Math.min(anchor.top + anchor.height / 2 - bubble.height / 2, viewport.height - MARGIN - bubble.height));

  if (anchor.left + anchor.width + GAP + bubble.width <= viewport.width - MARGIN) {
    return { left: anchor.left + anchor.width + GAP, top };
  }

  if (anchor.left - GAP - bubble.width >= MARGIN) {
    return { left: anchor.left - GAP - bubble.width, top };
  }

  return { left: viewport.width - MARGIN - bubble.width, top: viewport.height - MARGIN - bubble.height };
}
