"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";

const R = 42;
const C = 2 * Math.PI * R;

/** Branded card simulating a member's progress: a tier bar + a reward gauge. */
export function ClubProgress() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 9, ry: px * 9 });
  };

  const reward = 83;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      className="w-full max-w-[380px] rounded-[28px] border border-[#c6a15b]/30 p-7 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]"
      style={{
        background: "linear-gradient(160deg,#f7e8db 0%,#f2ddd0 55%,#ecd0bf 100%)",
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 150ms ease-out",
      }}
    >
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="font-serif text-xl leading-none text-[#3d2b28]">Verónica Navarro</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-[#a9793f]">Auréa · Nivel Gold</p>
        </div>
        <span className="text-lg text-[#c6a15b]" aria-hidden="true">♛</span>
      </div>

      {/* Tier bar */}
      <div className="mb-7">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold text-[#5a4038]">Progreso a Platinum</span>
          <span className="text-[13px] font-semibold tabular-nums text-[#8a5b48]">72%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#43302b]/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#d9b477,#b98a4f)" }}
            initial={{ width: 0 }}
            whileInView={{ width: "72%" }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#8a746c]">Te faltan 2 visitas para subir de nivel</p>
      </div>

      <div className="mb-6 h-px w-full bg-[#43302b]/10" />

      {/* Reward gauge */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(67,48,43,0.12)" strokeWidth="10" />
            <motion.circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="url(#clubGold)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              whileInView={{ strokeDashoffset: C * (1 - reward / 100) }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />
            <defs>
              <linearGradient id="clubGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d9b477" />
                <stop offset="100%" stopColor="#b98a4f" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-serif text-xl text-[#3d2b28]">
            {reward}%
          </span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#5a4038]">Hydrafacial de regalo</p>
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#8a5b48]">1.250 / 1.500 pts</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#8a746c]">
            Casi lo tienes: 250 puntos para canjearlo
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClubProgress;
