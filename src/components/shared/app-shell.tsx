"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, CreditCard, Headphones, LayoutDashboard, Rocket, Search, Settings, Sparkles, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

export type ShellIcon = "overview" | "templates" | "members" | "scan" | "engage" | "settings" | "clinics" | "wallet" | "search" | "onboarding" | "care";

export interface ShellNavItem {
  href: string;
  label: string;
  icon: ShellIcon;
}

const ICONS: Record<ShellIcon, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  overview: LayoutDashboard,
  templates: CreditCard,
  members: Users,
  scan: Search,
  engage: Sparkles,
  settings: Settings,
  clinics: Building2,
  wallet: Activity,
  search: Search,
  onboarding: Rocket,
  care: Headphones,
};

export function AppShell({
  homeHref,
  navItems,
  children,
}: {
  homeHref: string;
  navItems: ShellNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <div className="h-dvh overflow-hidden bg-[#eee3dc] p-0 text-[#2e2421] lg:p-5">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto h-full max-w-[1360px] overflow-hidden bg-[#f6f1ed] lg:h-[calc(100vh-2.5rem)] lg:rounded-[32px] lg:shadow-[0_30px_80px_rgba(67,48,43,0.18)]"
      >
        <div className="grid h-full lg:grid-cols-[68px_minmax(0,1fr)]">
          <aside className="relative hidden bg-[#f0e5de] py-5 lg:flex lg:flex-col lg:items-center">
            <Link href={homeHref} className="flex h-9 w-9 items-center justify-center" aria-label="Voone admin home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/voone-mark.png" alt="" className="h-8 w-8 object-contain" />
            </Link>
            <nav className="mt-12 flex flex-col gap-3" aria-label="Admin navigation">
              {navItems.map((item) => {
                const Icon = ICONS[item.icon];
                const active = pathname === item.href || (item.href !== homeHref && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-[#704f40] transition",
                      active ? "bg-[#201715] text-white shadow-[0_8px_18px_rgba(32,23,21,0.18)]" : "bg-[#fffaf6] hover:bg-white"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto flex flex-col items-center gap-3">
              <LogoutButton className="h-10 w-10 rounded-full bg-[#201715] p-0 text-transparent hover:bg-[#201715]" />
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-[#ded2cb] bg-[#f6f1ed]/90 px-5 py-4 backdrop-blur lg:hidden">
              <Link href={homeHref} className="flex items-center gap-2" aria-label="Voone admin home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/voone-mark.png" alt="" className="h-7 w-7 object-contain" />
                <span className="text-sm font-black tracking-[0.12em]">VOONE</span>
              </Link>
              <LogoutButton className="rounded-full bg-[#201715]" />
            </header>

            <nav className="flex gap-2 overflow-x-auto border-b border-[#ded2cb] bg-[#f6f1ed] px-4 py-3 no-scrollbar lg:hidden" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname === item.href || (item.href !== homeHref && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold transition",
                    active ? "bg-[#201715] text-white" : "bg-[#fffaf6] text-[#704f40]"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}
            </nav>

            <motion.main
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 lg:p-7"
            >
              {children}
            </motion.main>
          </div>
        </div>
      </motion.div>
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