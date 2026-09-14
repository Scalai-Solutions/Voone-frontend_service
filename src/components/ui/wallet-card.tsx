"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

export interface WalletCardData {
  clinic: string;
  clinicSub: string;
  member: string;
  tierLabel: string;
  tier: string;
  points: string;
  balance: string;
  reward: string;
  progress: number;
  since: string;
}

export interface WalletCardTheme {
  bg: string; // css gradient
  accent: string; // strong (labels/symbol)
  accentSoft: string; // soft (small labels)
  ink: string; // name/values
  balance: string; // balance color
  border: string;
  bar: string; // progress fill
  barTrack: string;
  symbol: string;
}

const GOLD: WalletCardTheme = {
  bg: "linear-gradient(160deg,#f8ece0 0%,#f1dccd 48%,#e7c6b4 100%)",
  accent: "#c6a15b",
  accentSoft: "#a9793f",
  ink: "#3d2b28",
  balance: "#b06a5a",
  border: "#e7cdbd",
  bar: "#c6a15b",
  barTrack: "#e2c8b6",
  symbol: "♛",
};

const DIAMOND: WalletCardTheme = {
  bg: "linear-gradient(160deg,#3a3f47 0%,#2a2e35 48%,#1d2026 100%)",
  accent: "#cfd4dc",
  accentSoft: "#9aa1ac",
  ink: "#f3f5f8",
  balance: "#dfe4ea",
  border: "#4a4f57",
  bar: "#cfd4dc",
  barTrack: "rgba(255,255,255,0.15)",
  symbol: "◆",
};

export const WALLET_THEMES = { gold: GOLD, diamond: DIAMOND };

const DEFAULT: WalletCardData = {
  clinic: "AURÉA",
  clinicSub: "CLINIC CLUB",
  member: "Verónica Navarro",
  tierLabel: "GOLD MEMBER",
  tier: "Gold",
  points: "1.250",
  balance: "€240",
  reward: "Hydrafacial a 250 pts · te faltan 2 visitas",
  progress: 83,
  since: "2026",
};

/** Voone loyalty pass that opens on click — a closed Wallet card that expands with more info. */
export function WalletCard({ data, theme = GOLD, defaultExpanded = false, interactive = true }: { data?: Partial<WalletCardData>; theme?: WalletCardTheme; defaultExpanded?: boolean; interactive?: boolean }) {
  const d = { ...DEFAULT, ...data };
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const ref = React.useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-60, 60], [7, -7]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mx, [-60, 60], [-7, 7]), { stiffness: 300, damping: 30 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - (r.left + r.width / 2));
    my.set(e.clientY - (r.top + r.height / 2));
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div ref={ref} className="relative select-none" style={{ perspective: 1000 }} onMouseMove={onMove} onMouseLeave={reset}>
      <motion.button
        type="button"
        onClick={interactive ? () => setExpanded((v) => !v) : undefined}
        aria-expanded={interactive ? expanded : undefined}
        aria-hidden={interactive ? undefined : true}
        disabled={!interactive}
        tabIndex={interactive ? undefined : -1}
        className={interactive ? "block w-[320px] text-left cursor-pointer rounded-[26px] overflow-hidden shadow-[0_40px_90px_-30px_rgba(0,0,0,0.55)] border" : "block w-[320px] text-left cursor-default rounded-[26px] overflow-hidden shadow-[0_40px_90px_-30px_rgba(0,0,0,0.55)] border"}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", background: theme.bg, borderColor: theme.border }}
        animate={{ height: expanded ? 468 : 208 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="absolute -left-12 -bottom-10 w-52 h-52 rounded-full opacity-40 blur-3xl pointer-events-none" style={{ background: theme.accent }} />
        <div className="absolute -right-16 -top-10 w-52 h-52 rounded-full bg-white/50 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div className="leading-none">
              <p className="font-serif text-xl tracking-wide" style={{ color: theme.accentSoft }}>△ {d.clinic}</p>
              <p className="text-[9px] tracking-[0.25em] mt-1" style={{ color: theme.accentSoft }}>{d.clinicSub}</p>
            </div>
            <div className="text-right">
              <div className="text-base leading-none" style={{ color: theme.accent }}>{theme.symbol}</div>
              <p className="text-[9px] tracking-[0.18em] mt-0.5" style={{ color: theme.accentSoft }}>{d.tierLabel}</p>
            </div>
          </div>

          <h3 className="font-serif text-2xl mt-5" style={{ color: theme.ink }}>{d.member}</h3>
          <div className="flex items-center gap-5 mt-2">
            <div>
              <p className="text-[8px] tracking-[0.15em]" style={{ color: theme.accentSoft }}>NIVEL</p>
              <p className="font-serif leading-tight" style={{ color: theme.ink }}>{d.tier}</p>
            </div>
            <div>
              <p className="text-[8px] tracking-[0.15em]" style={{ color: theme.accentSoft }}>PUNTOS</p>
              <p className="font-serif leading-tight" style={{ color: theme.ink }}>{d.points}</p>
            </div>
          </div>

          <motion.div className="mt-4 flex items-center gap-2 text-[11px]" style={{ color: theme.accentSoft }} animate={{ opacity: expanded ? 0 : 1 }} transition={{ duration: 0.2 }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
            Toca para abrir tu pase
          </motion.div>

          <motion.div className="mt-4 border-t pt-4 space-y-4" style={{ borderColor: theme.barTrack }} animate={{ opacity: expanded ? 1 : 0, y: expanded ? 0 : 8 }} transition={{ duration: 0.3, delay: expanded ? 0.1 : 0 }}>
            <div>
              <p className="text-[9px] tracking-[0.2em]" style={{ color: theme.accentSoft }}>BEAUTY BALANCE</p>
              <p className="font-serif text-3xl" style={{ color: theme.balance }}>{d.balance}</p>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.15em] mb-1" style={{ color: theme.accentSoft }}>PRÓXIMA RECOMPENSA</p>
              <p className="text-[13px]" style={{ color: theme.ink }}>{d.reward}</p>
              <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: theme.barTrack }}>
                <div className="h-full rounded-full" style={{ width: `${d.progress}%`, background: theme.bar }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.2em]" style={{ color: theme.accentSoft }}>CLUB PASS</p>
                <p className="text-[10px]" style={{ color: theme.accentSoft }}>Member since {d.since}</p>
              </div>
              <div className="w-14 h-14 bg-white rounded-md p-1 shadow-inner">
                <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-[1.5px]">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={(i * 7 + (i % 4)) % 3 === 0 ? "bg-neutral-900 rounded-[1px]" : ""} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
}
