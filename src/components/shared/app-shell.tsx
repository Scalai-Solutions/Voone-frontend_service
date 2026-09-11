"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BadgeCheck, Building2, CreditCard, LayoutDashboard, QrCode, Search, Settings, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VooneSession } from "@/lib/auth";

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
  area: "Clinic Dashboard" | "Voone Admin";
  homeHref: string;
  session: VooneSession;
  navItems: ShellNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f0e8] text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-hidden border-r border-[#d9b477]/20 bg-[#130c0a] px-4 py-5 text-[#f9eedf] shadow-2xl xl:block">
        <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.07]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(208,161,84,0.19),transparent_70%)]" />
        <Link href={homeHref} className="relative flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e4be79]/35 bg-[linear-gradient(145deg,#38241c,#100908)] font-serif text-xl font-semibold text-[#e8c17e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">V</span>
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
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#b8a69a] transition-all hover:bg-white/[0.06] hover:text-[#fff7ec]",
                  active && "border border-[#e3bc76]/25 bg-[linear-gradient(135deg,rgba(213,169,99,0.2),rgba(255,255,255,0.03))] text-[#fff8ec] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-[#e3bc76]/20 bg-white/[0.05] p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-2 font-medium">
            <BadgeCheck className="h-4 w-4 text-[#e3bc76]" />
            {session.name}
          </div>
          <p className="mt-1 text-xs capitalize text-[#aa9687]">{session.role.replace("_", " ")}</p>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#d9c9b6] bg-[#f6f0e8]/92 px-4 py-4 backdrop-blur-xl md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a47845]">{area}</p>
              <h1 className="font-serif text-2xl font-semibold tracking-wide md:text-3xl">Good morning, {session.name.split(" ")[0]}</h1>
            </div>
            <Badge variant="outline" className="w-fit border-[#cbaa75] bg-[#fffaf3] capitalize text-[#765533] shadow-sm">
              {session.role.replace("_", " ")}
            </Badge>
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
        </header>

        <main className="relative overflow-hidden px-4 py-7 md:px-8 md:py-9">
          <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.025]" />
          <div className="relative">{children}</div>
        </main>
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