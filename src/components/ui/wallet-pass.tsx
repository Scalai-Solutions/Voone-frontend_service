"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Calendar, MessageCircle, Gift, ChevronRight, ExternalLink, Check } from "lucide-react";

const CLINIC = "AURÉA";

/** Condensed pass shown in the collapsed / "added to Wallet" state. */
function MiniPass() {
  return (
    <div className="mx-3 rounded-2xl overflow-hidden relative shadow-md" style={{ background: "linear-gradient(160deg,#f7e8db 0%,#f2ddd0 45%,#e9c9b8 100%)" }}>
      <div className="absolute -left-8 -bottom-6 w-28 h-28 rounded-full bg-[#e7b7a6]/50 blur-2xl" />
      <div className="relative z-10 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="leading-none">
            <p className="font-serif text-base text-[#8a5b48] tracking-wide">△ {CLINIC}</p>
            <p className="text-[8px] tracking-[0.25em] text-[#a9793f] mt-0.5">CLUB CLÍNICA</p>
          </div>
          <div className="text-right">
            <p className="text-[#c6a15b] text-sm leading-none">♛</p>
            <p className="text-[8px] tracking-[0.18em] text-[#a9793f]">MIEMBRO GOLD</p>
          </div>
        </div>
        <h3 className="font-serif text-xl text-[#3d2b28] mb-1">Verónica Navarro</h3>
        <p className="text-[8px] tracking-[0.2em] text-[#a9793f]">MIEMBRO DESDE 2026</p>
      </div>
    </div>
  );
}

/** Full expanded pass (image 2). */
function FullPass() {
  return (
    <div className="mx-3 rounded-2xl overflow-hidden relative shadow-lg" style={{ background: "linear-gradient(160deg,#f7e8db 0%,#f2ddd0 45%,#e9c9b8 100%)" }}>
      <div className="absolute -left-10 bottom-0 w-40 h-40 rounded-full bg-[#e7b7a6]/50 blur-2xl" />
      <div className="relative z-10 px-5 pt-5 pb-6 text-center">
        <p className="font-serif text-lg tracking-wide text-[#8a5b48]">△ {CLINIC}</p>
        <p className="text-[9px] tracking-[0.25em] text-[#a9793f] mb-3">CLUB CLÍNICA</p>
        <div className="text-[#c6a15b] text-base mb-1">♛</div>
        <span className="inline-block text-[9px] tracking-[0.2em] text-[#a9793f] border border-[#c6a15b]/50 rounded px-3 py-1 mb-3">MIEMBRO GOLD</span>
        <h3 className="font-serif text-2xl text-[#3d2b28] mb-3">Verónica Navarro</h3>
        <p className="text-[9px] tracking-[0.2em] text-[#a9793f]">BEAUTY BALANCE</p>
        <p className="font-serif text-3xl text-[#b06a5a] mb-4">€240</p>
        <div className="flex justify-center gap-6 text-left mb-4">
          <div>
            <p className="text-[8px] tracking-[0.15em] text-[#a9793f]">NIVEL</p>
            <p className="font-serif text-[#3d2b28]">Gold</p>
          </div>
          <div className="max-w-[130px]">
            <p className="text-[8px] tracking-[0.15em] text-[#a9793f]">BENEFICIOS</p>
            <p className="text-[10px] text-[#5a4038] leading-tight">Acceso exclusivo a tratamientos, eventos y ofertas de socio</p>
          </div>
        </div>
        <div className="mx-auto w-[86px] h-[86px] bg-white rounded-md p-1.5 shadow-inner mb-2">
          <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-[2px]">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className={(i * 7 + (i % 5) + (i % 3)) % 3 === 0 ? "bg-neutral-900 rounded-[1px]" : "bg-transparent"} />
            ))}
          </div>
        </div>
        <p className="text-[9px] tracking-[0.2em] text-[#a9793f]">PASE CLUB</p>
        <p className="text-[9px] text-[#8a726c]">Miembro desde 2026</p>
      </div>
    </div>
  );
}

function ActionRows() {
  const rows = [
    { icon: Calendar, label: "Reservar ahora", trailing: <ChevronRight className="h-4 w-4" /> },
    { icon: MessageCircle, label: "WhatsApp", trailing: <ExternalLink className="h-4 w-4" /> },
    { icon: Gift, label: "Ver beneficios", trailing: <ChevronRight className="h-4 w-4" /> },
  ];
  return (
    <div className="mx-3 mt-3 rounded-2xl overflow-hidden divide-y divide-neutral-100 border border-neutral-100">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 px-4 py-3 bg-white">
          <r.icon className="h-5 w-5 text-[#b98a4f]" />
          <span className="flex-1 text-sm text-neutral-800">{r.label}</span>
          <span className="text-neutral-400">{r.trailing}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-4 pb-2 text-[11px] font-semibold text-neutral-900">
      <span>9:41</span>
      <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[86px] h-[22px] bg-black rounded-full" />
      <span className="flex items-center gap-1 text-neutral-800" aria-hidden="true">
        <span className="inline-flex items-end gap-[1.5px] h-2.5">
          <i className="w-[2px] h-[5px] bg-current inline-block rounded-sm" />
          <i className="w-[2px] h-[7px] bg-current inline-block rounded-sm" />
          <i className="w-[2px] h-[9px] bg-current inline-block rounded-sm" />
          <i className="w-[2px] h-[10px] bg-current inline-block rounded-sm" />
        </span>
        <span className="text-[9px] font-semibold">5G</span>
        <span className="inline-block w-4 h-2.5 border border-current rounded-[3px] relative"><i className="absolute inset-[1.5px] right-1 bg-current rounded-[1px]" /></span>
      </span>
    </div>
  );
}

const PhoneShell = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-[290px] h-[600px] rounded-[46px] border-[11px] border-neutral-900 bg-neutral-900 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
    <div className="absolute inset-0 bg-white flex flex-col">{children}</div>
  </div>
);

/**
 * WalletPass. `scrollReveal` (hero) cross-fades from the collapsed "added to Wallet"
 * state (image 1) to the full open pass (image 2) as the page scrolls.
 * Default (static) shows the full pass — used in the club section.
 */
export function WalletPass({ scrollReveal = false }: { scrollReveal?: boolean }) {
  // Looping "video" transition: collapsed (added to Wallet) → expanded pass → repeat.
  const open = useMotionValue(0);
  const collapsedOpacity = useTransform(open, [0, 0.5], [1, 0]);
  const expandedOpacity = useTransform(open, [0.4, 1], [0, 1]);
  const expandedScale = useTransform(open, [0, 1], [0.94, 1]);

  React.useEffect(() => {
    if (!scrollReveal) return;
    const controls = animate(open, [0, 1, 1, 0], {
      duration: 6,
      times: [0, 0.22, 0.8, 1],
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 0.5,
    });
    return () => controls.stop();
  }, [scrollReveal, open]);

  if (!scrollReveal) {
    return (
      <PhoneShell>
        <StatusBar />
        <div className="flex items-center justify-between px-5 pb-2 text-sm">
          <span className="font-semibold text-neutral-800">OK</span>
          <span className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 text-xs">•••</span>
        </div>
        <FullPass />
        <ActionRows />
        <div className="mt-auto mb-2 mx-auto w-[110px] h-[4px] rounded-full bg-neutral-300" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <StatusBar />
      {/* Collapsed: added-to-Wallet confirmation (image 1) */}
      <motion.div style={{ opacity: collapsedOpacity }} className="absolute inset-0 top-[54px] flex flex-col">
        <MiniPass />
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <span className="w-16 h-16 rounded-full border-[3px] border-[#0A84FF] flex items-center justify-center">
            <Check className="w-8 h-8 text-[#0A84FF]" strokeWidth={3} />
          </span>
          <span className="text-neutral-500 text-lg">OK</span>
        </div>
        {/* peeking wallet cards */}
        <div className="relative h-16">
          <div className="absolute -bottom-6 inset-x-6 h-14 rounded-t-2xl bg-[#c6a15b]" />
          <div className="absolute -bottom-2 inset-x-9 h-14 rounded-t-2xl bg-[#3ea36b]" />
          <div className="absolute bottom-1 inset-x-12 h-14 rounded-t-2xl bg-[#3d6df0]" />
        </div>
      </motion.div>

      {/* Expanded: full open pass (image 2) */}
      <motion.div style={{ opacity: expandedOpacity, scale: expandedScale }} className="absolute inset-0 top-[42px] origin-top flex flex-col">
        <div className="flex items-center justify-between px-5 pb-2 text-sm">
          <span className="font-semibold text-neutral-800">OK</span>
          <span className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 text-xs">•••</span>
        </div>
        <FullPass />
        <ActionRows />
      </motion.div>
    </PhoneShell>
  );
}
