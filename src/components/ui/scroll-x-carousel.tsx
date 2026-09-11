"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pinned horizontal carousel driven by native scroll (no rAF/motion dependency).
 * ScrollXCarousel measures the cards' width, sets its own height to
 * `100vh + horizontalTravel`, and on scroll writes two CSS vars on itself:
 *   --sx  : the translateX (px) for the cards
 *   --sxp : progress 0..1 for the progress bar
 * The sticky container pins for exactly the travel distance, so vertical scroll
 * turns into horizontal until the last card, then unlocks to the next section.
 */
export function ScrollXCarousel({ children, className }: { children?: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let travel = 0;

    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)) : 0;
      el.style.setProperty("--sx", `${(-p * travel).toFixed(1)}px`);
      el.style.setProperty("--sxp", p.toFixed(4));
    };
    const measure = () => {
      const wrap = el.querySelector<HTMLElement>("[data-carousel-wrap]");
      const vw = document.documentElement.clientWidth || window.innerWidth;
      travel = wrap ? Math.max(0, wrap.scrollWidth - vw + 24) : 0;
      el.style.height = `calc(100vh + ${travel}px)`;
      update();
    };

    measure();
    const t = setTimeout(measure, 700); // recompute after images load
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} data-scrollx className={cn("relative w-screen max-w-full", className)} style={{ height: "100vh" }}>
      {children}
    </div>
  );
}

export function ScrollXCarouselContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sticky top-0 left-0 h-screen w-full overflow-hidden", className)} {...props} />;
}

export function ScrollXCarouselWrap({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div data-carousel-wrap className={cn("w-fit will-change-transform", className)} style={{ transform: "translateX(var(--sx, 0px))" }}>
      {children}
    </div>
  );
}

export function ScrollXCarouselProgress({
  className,
  progressStyle,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { progressStyle?: string }) {
  return (
    <div className={cn("max-w-screen overflow-hidden", className)} {...props}>
      <div className={cn("origin-left", progressStyle)} style={{ transform: "scaleX(var(--sxp, 0))" }} />
    </div>
  );
}
