"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CircleHelp, QrCode, ScanLine, Sparkles, WalletCards } from "lucide-react";

import type { DashboardOverview, Template } from "@/lib/api-client";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Buenos días";
  if (hour < 17) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardMotion({ overview, primaryTemplate }: { overview: DashboardOverview; primaryTemplate: Template }) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const };
  const greeting = React.useMemo(() => getTimeGreeting(), []);

  return (
    <motion.section initial="hidden" animate="visible" variants={reveal} transition={transition} className="relative min-h-[calc(100vh-11.5rem)] overflow-hidden rounded-[30px] bg-[#211918] px-6 py-6 text-[#fff8f2] shadow-[0_20px_60px_rgba(67,42,30,0.14)] sm:px-10 lg:px-14 lg:py-7">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_58%_46%,rgba(154,111,82,0.36),transparent_34%),linear-gradient(90deg,transparent,rgba(117,82,65,0.34))]" />
      <div className="relative grid h-full min-h-[calc(100vh-16.5rem)] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-[690px]">
          <p className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#d6a979]"><span className="h-px w-8 bg-[#d6a979]" /> Tu club, más cerca</p>
          <h1 className="max-w-[640px] font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.03em] text-[#fff9f5] sm:text-6xl lg:text-[62px]">
            {greeting},<br />
            <span className="text-[#dfb88c]">Aurea.</span> Bienvenida<br />
            de nuevo.
          </h1>
          <p className="mt-6 max-w-[540px] text-base leading-7 text-[#c9bbb3]">Gestiona tu comunidad de belleza con una experiencia que se siente tan especial como tu marca.</p>

          <div className="mt-7 grid max-w-[500px] grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric label="Miembros activos" value={overview.activeMembers.toLocaleString("es-ES")} detail="+12% este mes" />
            <Metric label="Ingresos generados" value={`$${overview.pointsIssuedThisMonth.toLocaleString("es-ES")}`} detail="+8.4% este mes" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/scan" className="inline-flex items-center gap-3 rounded-full border border-[#a2765d] bg-[#6f4d3f]/40 px-5 py-3 text-sm font-semibold text-[#fff6ed] transition hover:bg-[#8a604b]">
              <ScanLine size={17} /> Escanear QR
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[350px] items-center justify-center lg:min-h-0">
          <div className="absolute right-[5%] top-[3%] hidden rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs shadow-xl backdrop-blur sm:block">
            <p className="font-semibold">Tu tarjeta digital</p>
            <p className="mt-1 text-[#bfaea5]">Siempre contigo</p>
          </div>
          <div className="absolute bottom-[5%] left-[3%] hidden max-w-[180px] rounded-2xl border border-white/10 bg-[#3a2b27]/80 p-4 text-xs shadow-xl backdrop-blur sm:block">
            <CircleHelp size={16} className="mb-2 text-[#e2b685]" />
            <p className="font-semibold">Fideliza cada visita</p>
            <p className="mt-1 leading-4 text-[#bfaea5]">Tus clientes vuelven por más.</p>
          </div>
          <div className="absolute h-[330px] w-[330px] rounded-full border border-[#d6a979]/20 bg-[#a37a5c]/10 sm:h-[410px] sm:w-[410px]" />
          <PhoneWallet templateName={primaryTemplate?.programName ?? primaryTemplate?.name ?? "Aura Club"} />
        </div>
      </div>
      <Link href="/dashboard/scan" className="absolute left-1/2 top-1/2 hidden h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#211918] bg-[#f1d6bd] text-[#402d26] shadow-[0_10px_34px_rgba(241,214,189,0.32)] transition hover:scale-110 lg:flex" aria-label="Escanear código QR">
        <QrCode size={40} strokeWidth={1.8} />
      </Link>
    </motion.section>
  );
}

function PhoneWallet({ templateName }: { templateName: string }) {
  return (
    <div className="group relative flex h-[355px] w-[185px] shrink-0 rotate-[7deg] items-center justify-center rounded-[34px] border-[7px] border-[#24201f] bg-[#161313] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.4)] transition duration-500 hover:-translate-y-4 hover:rotate-[-2deg] hover:scale-[1.04] sm:h-[400px] sm:w-[210px]">
      <div className="absolute left-1/2 top-1 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#171414]" />
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-[#f7eee6]">
        <div className="flex items-center justify-between px-4 pb-3 pt-8 text-[8px] font-semibold tracking-[0.18em] text-[#70554a]"><span>9:41</span><span>VOONE</span></div>
        <div className="mx-3 flex flex-1 flex-col justify-between rounded-[20px] bg-gradient-to-br from-[#49372f] via-[#765847] to-[#b69b80] p-4 text-[#fff8f1] shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-1 text-[8px] uppercase tracking-[0.22em] opacity-80"><Sparkles size={9} /> Aurea beauty</div>
              <div className="font-serif text-[15px]">{templateName}</div>
            </div>
            <WalletCards size={13} />
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.22em] opacity-70">Miembro</p>
            <p className="mt-1 text-[13px]">Valentina Costa</p>
            <div className="mt-5 flex items-end justify-between">
              <div><p className="text-[7px] uppercase opacity-70">Nivel</p><p className="mt-1 text-[12px]">Gold</p></div>
              <div className="rounded-md bg-white p-1.5"><QrCode size={22} className="text-[#3e302b]" /></div>
            </div>
          </div>
        </div>
        <div className="px-4 py-4 text-center"><p className="text-[10px] font-semibold text-[#3e302b]">Aurea Beauty Studio</p><p className="mt-1 text-[8px] text-[#8d7569]">3.840 puntos disponibles</p></div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#bca99d]">{label}</p>
      <p className="mt-3 font-serif text-3xl font-semibold text-[#fff7f0]">{value}</p>
      <p className="mt-1 text-[10px] text-[#a9958c]">{detail}</p>
    </div>
  );
}
