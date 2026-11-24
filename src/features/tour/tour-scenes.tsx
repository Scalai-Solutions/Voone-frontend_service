"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import type { TourSceneId } from "./tour-types";

/** Small illustrations drawn inside a bubble. Decorative: the bubble's text says the same thing. */
export function TourScene({ id }: { id: TourSceneId }) {
  if (id === "welcome-emblem") return <WelcomeEmblem />;
  return <ScanVisitMock />;
}

function WelcomeEmblem() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto mb-4 grid h-24 w-24 place-items-center" aria-hidden>
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-full border border-[#e5bd80]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={reduce ? { scale: 1, opacity: 0.35 } : { scale: [0.6, 1.5], opacity: [0.7, 0] }}
          transition={reduce ? { duration: 0 } : { duration: 2.4, delay: ring * 0.8, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="relative block h-16 w-16 overflow-hidden rounded-full bg-[#f5e8dd] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)]"
        initial={reduce ? false : { scale: 0.4, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
      >
        <Image src="/2.svg" alt="" fill sizes="64px" className="object-contain p-1.5" />
      </motion.span>
    </div>
  );
}

const MOCK_ROWS = [
  { name: "Higiene facial", price: "60 €", selected: true },
  { name: "Depilación láser", price: "90 €", selected: false },
];

/** What the visit sheet looks like once a member is picked; the real one only exists after a scan. */
function ScanVisitMock() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="mb-4 rounded-2xl border border-[#e2d5cc] bg-[#f6f1ed] p-3" aria-hidden>
      <motion.div {...rise(0.05)} className="flex items-center justify-between rounded-xl bg-[#211918] px-3 py-2.5 text-[#fff8f2]">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d6a979]">Visita de miembro</p>
          <p className="mt-0.5 font-serif text-base font-semibold">María G.</p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-[#e7d7cc]">340 pts</span>
      </motion.div>
      <div className="mt-2 space-y-1.5">
        {MOCK_ROWS.map((row, index) => (
          <motion.div
            key={row.name}
            {...rise(0.2 + index * 0.12)}
            className={
              row.selected
                ? "flex items-center justify-between rounded-xl border border-[#2d211e] bg-[#2d211e] px-3 py-2 text-xs font-semibold text-white"
                : "flex items-center justify-between rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-xs font-semibold text-[#493832]"
            }
          >
            <span>{row.name}</span>
            <span className="flex items-center gap-1.5">
              {row.price}
              <CheckCircle2 className={row.selected ? "h-3.5 w-3.5" : "h-3.5 w-3.5 text-transparent"} />
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        {...rise(0.5)}
        className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#161211] px-3 py-2.5 text-xs font-bold text-white"
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Añadir 60 puntos
      </motion.div>
    </div>
  );
}
