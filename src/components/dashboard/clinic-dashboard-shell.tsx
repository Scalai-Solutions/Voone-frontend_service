"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, ScanLine, Settings, Users, WalletCards, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";
import type { VooneSession } from "@/lib/auth";

export type ClinicShellIcon = "overview" | "templates" | "members" | "scan" | "engage" | "settings";

export interface ClinicShellNavItem {
  href: string;
  label: string;
  icon: ClinicShellIcon;
  emblem?: boolean;
}

const ICONS: Record<ClinicShellIcon, LucideIcon> = {
  overview: LayoutDashboard,
  templates: WalletCards,
  members: Users,
  scan: ScanLine,
  engage: Bell,
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
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!profileOpen) return;

    function closeProfileMenu(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function closeProfileMenuWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeProfileMenu);
    document.addEventListener("keydown", closeProfileMenuWithEscape);

    return () => {
      document.removeEventListener("pointerdown", closeProfileMenu);
      document.removeEventListener("keydown", closeProfileMenuWithEscape);
    };
  }, [profileOpen]);

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#f6f1ed] text-[#2e2421]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_16%_0%,rgba(255,255,255,0.72),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.52),transparent_30%),linear-gradient(180deg,#f7f1ed,#f3ece8_58%,#f5efeb)]" />

      <header className="sticky inset-x-0 top-0 z-40 px-4 py-5 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-32 bg-[#f6f1ed]/82 backdrop-blur-xl" />
        <motion.div
          initial={false}
          className="relative z-10 mx-auto grid max-w-[1500px] grid-cols-[1fr_auto] items-center gap-3 xl:grid-cols-[1fr_auto_1fr]"
        >
          <Link href="/dashboard" className="relative z-20 h-10 w-[180px] overflow-hidden" aria-label="Voone inicio">
            <Image src="/voone-logo.png" alt="Voone" fill sizes="180px" priority className="object-contain object-left" />
          </Link>

          <nav className="ml-auto flex min-h-14 max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-full bg-[#201715] p-1.5 shadow-[0_16px_38px_-28px_rgba(0,0,0,0.85)] no-scrollbar xl:mx-auto" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.emblem ? "Voone, volver al inicio" : item.label}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold transition sm:px-4",
                    item.emblem && "w-12 px-0 hover:bg-transparent",
                    active && !item.emblem ? "bg-[#f5e8dd] text-[#35241f] shadow-sm hover:bg-[#fff7ef] hover:text-[#35241f]" : "text-[#eadfd8] hover:bg-white/10 hover:text-white",
                    active && item.emblem && "text-[#35241f]"
                  )}
                >
                  {item.emblem ? (
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5e8dd] p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_20px_-14px_rgba(0,0,0,0.75)]">
                      <Image src="/2.svg" alt="" fill sizes="40px" className="rounded-full object-contain p-1" />
                    </span>
                  ) : <Icon className="h-4 w-4" strokeWidth={1.8} />}
                  <span className={cn(item.emblem && "sr-only")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden justify-self-end xl:flex">
            <div ref={profileMenuRef} className="relative flex items-center gap-2 rounded-full border border-[#ded2cb] bg-white/70 p-1.5 shadow-[0_14px_40px_-34px_rgba(67,48,43,0.72)] backdrop-blur-xl">
              <Link href="/dashboard/settings" className="rounded-full px-3 py-2 text-left transition hover:bg-white" aria-label="Abrir perfil">
                <p className="text-xs font-semibold leading-4">{session.name}</p>
                <p className="text-[10px] leading-4 text-[#8c7870]">Perfil · Clínica Aurea</p>
              </Link>
              <button type="button" onClick={() => setProfileOpen((open) => !open)} className="rounded-full border border-[#e4d8d1] bg-[#fbf8f6] p-2.5 text-[#8e4d41]" aria-label="Abrir ajustes de perfil" aria-expanded={profileOpen}>
                <Settings className="h-4 w-4" />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-56 rounded-2xl border border-[#e3d5cd] bg-[#fffaf6] p-2 shadow-xl">
                  <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#35241f] hover:bg-[#f4e8df]"><Settings className="h-4 w-4" /> Ajustes de perfil</Link>
                  <LogoutButton showLabel className="mt-1 w-full justify-start gap-2 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm font-semibold text-[#8e4d41] hover:bg-[#f4e8df]" variant="ghost" />
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </header>

      <div className="fixed bottom-3 left-3 z-50 xl:hidden">
        <LogoutButton className="rounded-full border-white/70 bg-background/90 shadow-xl backdrop-blur" />
      </div>

      <main className="relative z-10 mx-auto max-w-[1500px] px-4 pb-8 pt-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}