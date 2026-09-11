"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, QrCode, Settings, Sparkles, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VooneSession } from "@/lib/auth";

export type ClinicShellIcon = "overview" | "templates" | "members" | "scan" | "engage" | "settings";

export interface ClinicShellNavItem {
  href: string;
  label: string;
  icon: ClinicShellIcon;
}

const ICONS: Record<ClinicShellIcon, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  templates: CreditCard,
  members: Users,
  scan: QrCode,
  engage: Sparkles,
  settings: Settings,
};

export function ClinicDashboardShell({
  session,
  navItems,
  children,
}: {
  session: VooneSession;
  navItems: ClinicShellNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const compactScan = pathname.startsWith("/dashboard/scan");

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_8%,rgba(217,180,119,0.28),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(239,220,213,0.8),transparent_34%),linear-gradient(180deg,#faf2ee,#f4e5dc_58%,#efe0d8)]" />
      <div className="voone-grain pointer-events-none fixed inset-0 z-0 opacity-[0.04]" />

      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4">
        <div className="pointer-events-none absolute inset-x-0 -top-8 z-0 h-28 bg-[#f4e6dc]/55 blur-2xl backdrop-blur-2xl" />
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -18, scale: 0.98 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3 xl:grid-cols-[auto_minmax(520px,720px)_auto]"
        >
          <Link href="/dashboard" className="flex h-[58px] w-[168px] min-w-0 items-center justify-start overflow-visible px-1">
            <span className="text-[3.15rem] italic leading-none tracking-normal text-[#3d211e] drop-shadow-[0_10px_24px_rgba(61,33,30,0.16)]" style={{ fontFamily: '"Bodoni 72", Didot, "Times New Roman", serif' }}>
              Voone
            </span>
          </Link>

          <nav className="ml-auto flex h-[58px] min-w-0 justify-end gap-1 overflow-visible rounded-[30px] border border-white/10 px-3 pb-1 pt-2 shadow-[0_22px_42px_-26px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] md:justify-center xl:mx-auto xl:w-full" style={{ background: "var(--dashboard-surface)" }}>
            {navItems.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative inline-flex h-12 min-w-[84px] shrink-0 flex-col items-center justify-end rounded-[26px] px-2 pb-1 pt-6 text-[11px] font-bold italic transition-all duration-300 hover:text-white md:min-w-[92px]",
                    active ? "text-white" : "text-white/58"
                  )}
                >
                  {active ? (
                    <>
                      <motion.span
                        layoutId="clinic-nav-active-notch"
                        className="absolute left-1/2 top-[-9px] h-12 w-[76px] -translate-x-1/2 rounded-full"
                        style={{ background: "var(--dashboard-surface)" }}
                        transition={{ type: "spring", stiffness: 430, damping: 34 }}
                      />
                      <motion.span
                        layoutId="clinic-nav-active-orb"
                        className="absolute left-1/2 top-[-22px] z-10 flex h-[48px] w-[48px] -translate-x-1/2 items-center justify-center rounded-full border-[7px] border-background text-white shadow-[0_18px_34px_-16px_rgba(0,0,0,0.98)]"
                        style={{ background: "var(--dashboard-surface)" }}
                        transition={{ type: "spring", stiffness: 430, damping: 34 }}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.span>
                    </>
                  ) : (
                    <Icon className="absolute top-0.5 h-5 w-5 text-white/52 transition-colors group-hover:text-white/82" />
                  )}
                  <span className={cn("relative z-10 mt-1.5 leading-none", active && "translate-y-0.5")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 rounded-[24px] border border-white/70 bg-background/78 px-3 py-2.5 shadow-[0_18px_48px_-34px_rgba(67,48,43,0.72)] backdrop-blur-xl xl:flex">
            <Badge variant="outline" className="border-gold/35 bg-white/45 px-3 py-1.5 capitalize text-foreground shadow-sm">
              {session.role.replace("_", " ")}
            </Badge>
            <span className="h-10 w-px bg-border" />
            <div className="text-right">
              <p className="text-sm font-semibold">{session.name}</p>
              <p className="text-xs text-muted-foreground">Aurea Clinic</p>
            </div>
          </div>
        </motion.div>
      </header>

      <main className={cn("relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", compactScan ? "h-screen overflow-hidden pb-3 pt-[5.75rem]" : "min-h-screen pb-16 pt-24")}>
        {children}
      </main>
    </div>
  );
}