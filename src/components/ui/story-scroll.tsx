"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function cx(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}

export interface FlowSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

/** One full-screen panel that pins and lets the next one rotate up over it.
 *  `className` (background, text color) goes on the ROTATING inner, so the
 *  whole coloured panel tilts together with its content. */
export const FlowSection: React.FC<FlowSectionProps> = ({ id, className, children, ...rest }) => (
  <section
    id={id}
    data-flow-section
    aria-label={rest["aria-label"]}
    className="relative min-h-screen w-full overflow-hidden"
  >
    <div
      className={cx(
        "flow-art-container relative flex min-h-screen w-full flex-col justify-center px-6 md:px-[4vw] py-20 will-change-transform",
        className,
      )}
      style={{ transformOrigin: "bottom left" }}
    >
      {children}
    </div>
  </section>
);

export interface FlowArtProps {
  children: React.ReactNode;
  className?: string;
}

/** Pins each panel and rotates the next one in (bottom-left pivot) as it scrolls up. */
export const FlowArt: React.FC<FlowArtProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Desktop pointer only: on touch / small screens or reduced-motion, keep plain stacked flow.
    const skip =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 768;
    if (skip) return;

    const ctx = gsap.context(() => {
      const sections = Array.from(el.querySelectorAll<HTMLElement>("[data-flow-section]"));
      sections.forEach((section, i) => {
        gsap.set(section, { zIndex: i + 1 });
        const inner = section.querySelector<HTMLElement>(".flow-art-container");
        if (inner) {
          gsap.set(inner, { rotation: 30, transformOrigin: "bottom left" });
          gsap.to(inner, {
            rotation: 0,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "top 25%", scrub: true },
          });
        }
        if (i < sections.length - 1) {
          ScrollTrigger.create({
            trigger: section,
            start: "bottom bottom",
            end: "bottom top",
            pin: true,
            pinSpacing: false,
          });
        }
      });
      ScrollTrigger.refresh();
    }, ref);

    return () => ctx.revert();
  }, [children]);

  return (
    <div ref={ref} className={cx("relative w-full overflow-x-clip bg-background", className)}>
      {children}
    </div>
  );
};

export default FlowArt;
