"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { placeTooltip, type TipSide } from "@/lib/tooltip-position";

/**
 * A tooltip for ONE child, in-house (no tooltip library). It shows on mouse hover and on
 * keyboard focus, hides on Escape, never takes focus and never traps it.
 *
 * The bubble is drawn in a portal with `position: fixed`, because the owner's rows live inside
 * `overflow-hidden` rounded cards that would clip an absolutely-positioned bubble.
 *
 * - Hover counts only for a mouse pointer: on touch a tap just activates the button (no sticky
 *   bubble left behind). `focusable` is for a child that is not a control (a year mark): it gets
 *   `tabIndex={0}` so a keyboard user can reach it and a tap focuses it, which shows the bubble.
 * - For a real control the bubble shows on `:focus-visible` only, so a mouse click does not leave
 *   one open. Clicking the control hides it.
 * - `aria-describedby` points at the bubble while it is shown. Pass the same string as the
 *   child's `aria-label` when the child is an icon button: the accessible name stays on the child.
 */
export function IconTip({
  label,
  children,
  side = "top",
  focusable = false,
}: {
  label: string;
  children: React.ReactElement<Record<string, unknown>>;
  side?: TipSide;
  focusable?: boolean;
}) {
  const id = React.useId();
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const bubbleRef = React.useRef<HTMLSpanElement>(null);
  const open = hovered || focused;

  const hide = React.useCallback(() => {
    setHovered(false);
    setFocused(false);
  }, []);

  // Place the bubble (it starts invisible at the corner so it can be measured first).
  React.useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const bubble = bubbleRef.current;

    if (!open || !anchor || !bubble) return;

    const at = placeTooltip(
      anchor.getBoundingClientRect(),
      { width: bubble.offsetWidth, height: bubble.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      side,
    );

    bubble.style.left = `${at.left}px`;
    bubble.style.top = `${at.top}px`;
    bubble.style.visibility = "visible";
  }, [open, side, label]);

  // A fixed bubble would drift away from its anchor, so scrolling or resizing just hides it.
  React.useEffect(() => {
    if (!open) return;

    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);

    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [open, hide]);

  const describedBy = [children.props["aria-describedby"], open ? id : undefined]
    .filter((part): part is string => typeof part === "string" && part !== "")
    .join(" ");

  const child = React.cloneElement(children, {
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(focusable ? { tabIndex: 0 } : {}),
  });

  return (
    <span
      ref={anchorRef}
      className="inline-flex"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => {
        let visible = true;

        try {
          visible = focusable || event.target.matches(":focus-visible");
        } catch {
          // A browser without :focus-visible: show on every focus.
        }

        if (visible) setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) hide();
      }}
      onClick={focusable ? undefined : hide}
    >
      {child}
      {open
        ? createPortal(
            <span
              ref={bubbleRef}
              id={id}
              role="tooltip"
              style={{ visibility: "hidden" }}
              className="pointer-events-none fixed left-0 top-0 z-[60] w-max max-w-[min(18rem,calc(100vw-1rem))] break-words rounded-lg bg-[#43302b] px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-lg"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
