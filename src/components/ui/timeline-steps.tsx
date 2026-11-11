"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";

export interface TimelineStep {
  t: string;
  d: string;
  img: string;
}

export function TimelineSteps({ items }: { items: TimelineStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      {/* Progress spine between text and image */}
      <div className="absolute left-5 top-0 h-full w-[2px] -translate-x-1/2 bg-white/10 md:left-1/2">
        <motion.div
          style={{ scaleY }}
          className="h-full w-full origin-top bg-gradient-to-b from-gold-light to-gold"
        />
      </div>

      {items.map((it, i) => (
        <div
          key={it.t}
          className={`relative grid items-center gap-6 pl-12 md:grid-cols-2 md:gap-16 md:pl-0 ${
            i === items.length - 1 ? "" : "mb-16 md:mb-28"
          }`}
        >
          {/* Node on the spine */}
          <span className="absolute left-5 top-1 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-gold font-serif text-sm text-white ring-4 ring-[#140f0c] md:left-1/2">
            {i + 1}
          </span>

          <div className={`${i % 2 ? "md:order-2 md:pl-12" : "md:pr-12 md:text-right"}`}>
            <h3 className="mb-2 font-serif text-2xl font-semibold text-white md:text-3xl">{it.t}</h3>
            <p className="leading-relaxed text-white/60">{it.d}</p>
          </div>

          <div className={`${i % 2 ? "md:order-1 md:pr-12" : "md:pl-12"}`}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.8)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.img}
                alt={it.t} loading="lazy" decoding="async"
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TimelineSteps;
