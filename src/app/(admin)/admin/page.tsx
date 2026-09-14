import Link from "next/link";
import { Activity, ArrowUpRight, Building2, CreditCard, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPlatformOverview } from "@/lib/api-client";

function daysUntil(value: string) {
  const remaining = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 86_400_000));
}

export default async function AdminOverviewPage() {
  const overview = await getPlatformOverview();
  const expiryDays = daysUntil(overview.wallet.appleCertificateExpiresAt);

  return (
    <div className="space-y-6">
      <section className="voone-dark-panel p-6 md:p-8">
        <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="voone-kicker text-gold-light">Control de plataforma</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">Resumen de administración</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/64 md:text-base">Crecimiento de clínicas, estado de Wallet y puntos de soporte en una sola vista operativa.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/18 text-gold-light">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-light/70">Operativa Wallet</p>
                <p className="mt-1 text-sm text-white/72">Google está en modo {overview.wallet.googlePublishingStatus === "live" ? "producción" : "demo"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <AdminStat icon={Building2} label="Clínicas" value={overview.totalClinics.toLocaleString()} detail="Activas y en configuración" />
        <AdminStat icon={Users} label="Miembros" value={overview.totalMembers.toLocaleString()} detail="En todas las clínicas" />
        <AdminStat icon={CreditCard} label="Certificado Apple" value={`${expiryDays} días`} detail="Renovar antes del vencimiento evita fallos al actualizar pases" />
      </section>

      <Card className="overflow-hidden rounded-[24px] border-[#d9b477]/35 bg-[#fffaf3]/88 shadow-[0_28px_80px_-54px_rgba(67,48,43,0.75)]">
        <CardHeader>
          <CardTitle className="font-serif text-2xl tracking-tight">Infraestructura Wallet</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-white/58 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a47845]">Apple Wallet</p>
            <p className="mt-1 text-sm text-muted-foreground">{overview.wallet.appleEnabled ? "Activo" : "Próximamente"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/58 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a47845]">Google Wallet</p>
            <p className="mt-1 text-sm text-muted-foreground capitalize">{overview.wallet.googlePublishingStatus === "live" ? "Producción" : "Demo"}</p>
          </div>
          <div className="flex items-end md:justify-end">
            <Button asChild className="rounded-2xl">
              <Link href="/admin/wallet">Ver estado Wallet <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, detail }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; detail: string }) {
  return (
    <Card className="group overflow-hidden rounded-[24px] border-[#d9c9b6] bg-[#fffaf3]/88 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.74)] transition-transform duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a47845]">{label}</CardTitle>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2a1b16] text-gold-light transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
            <Icon className="h-4 w-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-serif text-4xl font-semibold tracking-wide">{value}</div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}