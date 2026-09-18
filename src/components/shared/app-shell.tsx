"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BadgeCheck, Building2, CreditCard, LayoutDashboard, QrCode, Search, Settings, Sparkles, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VooneSession } from "@/lib/auth";
import { formatRole } from "@/lib/roles";

export type ShellIcon = "overview" | "templates" | "members" | "scan" | "engage" | "settings" | "clinics" | "wallet" | "search";

export interface ShellNavItem {
  href: string;
  label: string;
  icon: ShellIcon;
}

const ICONS: Record<ShellIcon, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  templates: CreditCard,
  members: Users,
  scan: QrCode,
  engage: Sparkles,
  settings: Settings,
  clinics: Building2,
  wallet: Activity,
  search: Search,
};

export function AppShell({
  area,
  homeHref,
  session,
  navItems,
  children,
}: {
  area: "Panel de clínica" | "Administración Voone";
  homeHref: string;
  session: VooneSession;
  navItems: ShellNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#f6f0e8] text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_78%_10%,rgba(217,180,119,0.22),transparent_30%),radial-gradient(circle_at_18%_18%,rgba(239,220,213,0.8),transparent_34%),linear-gradient(180deg,#fbf4ee,#f3e6dc_58%,#eadbd1)]" />
      <div className="voone-grain pointer-events-none fixed inset-0 -z-10 opacity-[0.035]" />
      <motion.aside
        initial={reducedMotion ? false : { opacity: 0, x: -24 }}
        animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-hidden border-r border-[#d9b477]/20 bg-[#130c0a] px-4 py-5 text-[#f9eedf] shadow-[24px_0_80px_-54px_rgba(19,12,10,0.95)] xl:block"
      >
        <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.07]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(208,161,84,0.19),transparent_70%)]" />
        <Link href={homeHref} className="relative flex items-center gap-3 rounded-lg px-2 py-2">
          {/* Knockout mark: the sidebar is #130c0a, so this takes the dark variant. The
              light-surface mark is solid brown and would disappear here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/voone-mark-dark.png" alt="" className="h-10 w-10 object-contain" />
          <span>
            <span className="block font-serif text-xl font-semibold tracking-wide">VOONE</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b89b77]">{area}</span>
          </span>
        </Link>

        <nav className="relative mt-10 space-y-1">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <motion.div
                key={item.href}
                initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.08 + navItems.indexOf(item) * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#b8a69a] transition-all hover:translate-x-1 hover:bg-white/[0.06] hover:text-[#fff7ec]",
                    active && "border border-[#e3bc76]/25 bg-[linear-gradient(135deg,rgba(213,169,99,0.2),rgba(255,255,255,0.03))] text-[#fff8ec] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  )}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-[#d7b274] transition-colors group-hover:bg-white/[0.1]", active && "bg-[#e3bc76]/18 text-[#f4d59a]")}> 
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-[#e3bc76]/20 bg-white/[0.05] p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-2 font-medium">
            <BadgeCheck className="h-4 w-4 text-[#e3bc76]" />
            {session.name}
          </div>
          <p className="mt-1 text-xs text-[#aa9687]">{formatRole(session.role)}</p>
          <LogoutButton variant="secondary" className="mt-4 rounded-md bg-[#fffaf3]" />
        </div>
      </motion.aside>

      <div className="xl:pl-72">
        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: -14 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.62, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="sticky top-0 z-20 border-b border-[#d9c9b6]/80 bg-[#f6f0e8]/82 px-4 py-4 shadow-[0_18px_60px_-48px_rgba(67,48,43,0.7)] backdrop-blur-xl md:px-8"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a47845]">{area}</p>
              <h1 className="font-serif text-2xl font-semibold tracking-wide md:text-3xl">Buenos días, {session.name.split(" ")[0]}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-fit border-[#cbaa75] bg-[#fffaf3] capitalize text-[#765533] shadow-sm">
                {formatRole(session.role)}
              </Badge>
              <LogoutButton className="rounded-xl bg-[#fffaf3]" />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
            {navItems.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-md border border-[#d9c9b6] bg-[#fffaf3] px-3 py-2 text-sm font-medium text-muted-foreground",
                    active && "border-[#2a1b16] bg-[#2a1b16] text-[#fff8ec]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </motion.header>

        <motion.main
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden px-4 py-7 md:px-8 md:py-9"
        >
          <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.025]" />
          <div className="relative">{children}</div>
        </motion.main>
      </div>
    </div>
  );
}

export function AccessPanel({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}