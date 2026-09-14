"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, CreditCard, ScanLine, Sparkles, ScanQrCode, Users } from "lucide-react";
import { gsap } from "gsap";

import { WalletCard, WALLET_THEMES } from "@/components/ui/wallet-card";
import { WalletStatusBadges } from "@/components/shared/status-badges";
import type { DashboardOverview, Template } from "@/lib/api-client";

const reveal = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
};

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Buenos días, Aurea. Bienvenida de nuevo.";
  if (hour < 17) return "Buenas tardes, Aurea. Bienvenida de nuevo.";
  return "Buenas noches, Aurea.";
}

export function DashboardMotion({ overview, primaryTemplate }: { overview: DashboardOverview; primaryTemplate: Template }) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const };
  const [greeting, setGreeting] = React.useState("");
  const fullGreeting = React.useMemo(() => getTimeGreeting(), []);
  const displayedGreeting = reducedMotion ? fullGreeting : greeting;

  React.useEffect(() => {
    if (reducedMotion) return;

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setGreeting(fullGreeting.slice(0, index));
      if (index >= fullGreeting.length) window.clearInterval(timer);
    }, 46);

    return () => window.clearInterval(timer);
  }, [fullGreeting, reducedMotion]);

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      <motion.section variants={reveal} transition={transition} className="voone-dark-panel min-h-[calc(100vh-130px)] px-5 py-6 md:px-8 lg:px-10 lg:py-8">
        <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-gold/20 blur-[90px]"
          animate={reducedMotion ? {} : { scale: [1, 1.18, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative grid min-h-[calc(100vh-185px)] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="voone-kicker">Cada visita construye estatus.</p>
            <h1 className="mt-4 min-h-[7.8rem] font-serif text-5xl font-semibold tracking-tight text-white md:min-h-[9rem] md:text-6xl xl:text-[4.5rem]" aria-label={fullGreeting}>
              {displayedGreeting}
              {!reducedMotion ? <span className="ml-1 inline-block h-[0.82em] w-[3px] translate-y-1 bg-gold-light align-baseline animate-pulse" aria-hidden="true" /> : null}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/64 md:text-lg">
              Los pases de Apple Wallet y Google Wallet están en el centro del panel, para que tu equipo gestione el club viendo lo mismo que ven los miembros.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric label="Miembros activos" value={overview.activeMembers.toLocaleString()} />
              <Metric label="Puntos del mes" value={overview.pointsIssuedThisMonth.toLocaleString()} />
              <Metric label="Altas Wallet" value={overview.walletAdds.toLocaleString()} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/templates" className="group inline-flex items-center gap-2 rounded-2xl border border-white/18 bg-white/[0.08] px-5 py-3 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/[0.16]">
                Editar plantillas <ArrowUpRight className="h-4 w-4 text-gold-light transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex min-h-[430px] w-full max-w-[590px] items-center justify-center overflow-visible">
            <motion.div
              className="absolute left-[2%] top-5 z-10 origin-center scale-[0.75] sm:scale-[0.82] md:left-[7%] lg:scale-[0.86] xl:scale-[0.92]"
              initial={reducedMotion ? false : { opacity: 0, y: 80, rotate: -14 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0, rotate: -8 }}
              transition={{ ...transition, delay: 0.18 }}
            >
              <WalletCard
                theme={WALLET_THEMES.gold}
                data={{
                  clinic: "AURÉA",
                  clinicSub: "APPLE WALLET",
                  member: "Verónica Navarro",
                  tierLabel: "CLÍNICA AUREA",
                  tier: "Gold",
                  points: "1.250",
                  balance: "€240",
                  reward: "Hydrafacial a 250 pts · te faltan 2 visitas",
                  progress: 83,
                  since: "2026",
                }}
              />
            </motion.div>

            <motion.div
              className="absolute right-[0%] top-36 z-20 origin-center scale-[0.75] sm:scale-[0.82] md:right-[5%] lg:scale-[0.86] xl:scale-[0.92]"
              initial={reducedMotion ? false : { opacity: 0, y: 90, rotate: 16 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0, rotate: 6 }}
              transition={{ ...transition, delay: 0.32 }}
            >
              <WalletCard
                theme={WALLET_THEMES.diamond}
                data={{
                  clinic: "AURÉA",
                  clinicSub: "GOOGLE WALLET",
                  member: "Álvaro Ferrer",
                  tierLabel: "CLÍNICA AUREA",
                  tier: "Diamond",
                  points: "4.980",
                  balance: "€620",
                  reward: "Sesión láser a 5.000 pts · te faltan 20 pts",
                  progress: 96,
                  since: "2025",
                }}
              />
            </motion.div>

            <motion.div
              className="absolute left-7 top-4 z-30 rounded-2xl border border-gold/25 bg-white/[0.08] px-4 py-3 text-sm shadow-2xl backdrop-blur-xl"
              animate={reducedMotion ? {} : { y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="font-bold text-white">Apple Wallet</p>
              <p className="text-xs text-gold-light/70">Pase Clínica Aurea</p>
            </motion.div>

            <motion.div
              className="absolute bottom-5 right-4 z-30 rounded-2xl border border-gold/25 bg-white/[0.08] px-4 py-3 text-sm shadow-2xl backdrop-blur-xl"
              animate={reducedMotion ? {} : { y: [0, 10, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="font-bold text-white">Google Wallet</p>
              <p className="text-xs text-gold-light/70">Pase Clínica Aurea</p>
            </motion.div>
          </div>
        </div>

        <FloatingScanButton />
      </motion.section>

      <motion.section variants={reveal} transition={{ ...transition, delay: reducedMotion ? 0 : 0.12 }} className="grid gap-5 md:grid-cols-3">
        <ActionCard href="/dashboard/templates" icon={CreditCard} title="Plantillas" text={`${primaryTemplate.name} está activa para ${primaryTemplate.memberCount} miembros.`} />
        <ActionCard href="/dashboard/members" icon={Users} title="Miembros" text="Busca saldos, estado Wallet e historial de visitas sin salir del estudio." />
        <ActionCard href="/dashboard/scan" icon={ScanLine} title="Modo recepción" text="Un flujo de escaneo a pantalla completa para móviles y tablets." dark />
      </motion.section>

      <motion.section variants={reveal} transition={{ ...transition, delay: reducedMotion ? 0 : 0.2 }} className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="voone-panel p-6 md:p-8">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="voone-kicker">Actividad en vivo</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Cambios de hoy</h2>
            </div>
            <Sparkles className="h-6 w-6 text-gold" />
          </div>
          <div className="relative mt-6 space-y-3">
            {overview.recentActivity.map((item, index) => (
              <motion.div
                key={item.id}
                initial={reducedMotion ? false : { opacity: 0, x: -18 }}
                whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ ...transition, delay: index * 0.08 }}
                className="voone-soft-row flex items-center justify-between px-4 py-4 text-sm"
              >
                <span className="flex items-center gap-3 font-semibold"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" /></span>{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="voone-panel p-6 md:p-8">
          <div className="relative">
            <p className="voone-kicker">Estado de proveedores</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{primaryTemplate.name}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Esta plantilla es el diseño que ven los miembros en el despliegue Wallet actual.</p>
            <div className="mt-6">
              <WalletStatusBadges statuses={primaryTemplate.walletStatus} />
            </div>
            <Link href="/dashboard/templates" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#2a1c18] px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
              Gestionar plantillas <ArrowUpRight className="h-4 w-4 text-gold-light" />
            </Link>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

function FloatingScanButton() {
  const buttonRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const element = buttonRef.current;
    if (!element) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      gsap.to(element, { x: x * 0.32, y: y * 0.32, scale: 1.08, ease: "power2.out", duration: 0.35 });
    };

    const handleMouseLeave = () => {
      gsap.to(element, { x: 0, y: 0, scale: 1, ease: "elastic.out(1, 0.35)", duration: 1.1 });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <Link
      ref={buttonRef}
      href="/dashboard/scan"
      aria-label="Abrir escaneo para acreditar puntos"
      className="absolute bottom-5 left-1/2 z-40 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border border-white/45 bg-[linear-gradient(160deg,#f8ece0_0%,#f1dccd_48%,#e7c6b4_100%)] text-[#8a5b48] shadow-[0_26px_60px_-22px_rgba(231,198,180,0.95),inset_0_1px_1px_rgba(255,255,255,0.75)] transition-[filter] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light md:bottom-6 md:h-24 md:w-24"
    >
      <span className="absolute inset-2 rounded-full border border-[#c6a15b]/25 bg-white/10" />
      <ScanQrCode className="relative h-9 w-9 md:h-10 md:w-10" strokeWidth={1.9} />
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-light/70">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  text,
  dark = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <Link href={href} className={dark ? "voone-dark-panel group p-6 transition-transform hover:-translate-y-1" : "voone-panel group p-6 transition-transform hover:-translate-y-1"}>
      {dark ? <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" /> : null}
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={dark ? "text-xs font-bold uppercase tracking-[0.2em] text-gold-light/70" : "voone-kicker"}>{title}</p>
          <p className={dark ? "mt-4 max-w-sm text-sm leading-6 text-white/62" : "mt-4 max-w-sm text-sm leading-6 text-muted-foreground"}>{text}</p>
        </div>
        <span className={dark ? "flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-white/[0.08] text-gold-light" : "flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a1c18] text-gold-light shadow-xl"}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="relative mt-8 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight">
        Abrir <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
    </Link>
  );
}