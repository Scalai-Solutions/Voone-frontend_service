import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Building2, Mail, MapPin, Phone, Sparkles, Users, WalletCards } from "lucide-react";

import { PageHeader } from "@/components/shared/page-kit";
import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { getClinic, getTemplates } from "@/lib/api-client";

function formatPlan(plan: string) {
  if (plan === "Launch") return "Lanzamiento";
  if (plan === "Growth") return "Crecimiento";
  if (plan === "Enterprise") return "Empresa";
  return plan;
}

export default async function ClinicDetailPage({ params }: PageProps<"/admin/clinics/[clinicId]">) {
  const { clinicId } = await params;
  const [clinic, templates] = await Promise.all([getClinic(clinicId), getTemplates()]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clinic profile" title={clinic.name} description={`${clinic.city} · ${formatPlan(clinic.plan)} plan`} action={{ href: "/admin/templates", label: "Edit template" }} />

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="relative overflow-hidden rounded-[30px] bg-[#211918] p-6 text-[#fff8f2] shadow-[0_20px_60px_rgba(67,42,30,0.14)]">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_58%_46%,rgba(154,111,82,0.36),transparent_34%),linear-gradient(90deg,transparent,rgba(117,82,65,0.34))]" />
          <div className="relative">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1d6bd] text-[#402d26]"><Building2 className="h-6 w-6" /></span>
            <h2 className="mt-6 max-w-md font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.03em]">{clinic.name}</h2>
            <p className="mt-5 flex items-center gap-2 text-sm text-[#c9bbb3]"><MapPin className="h-4 w-4" /> {clinic.city} · {formatPlan(clinic.plan)} plan</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <DarkMetric icon={Users} label="Members" value={clinic.members.toLocaleString()} />
              <DarkMetric icon={WalletCards} label="Templates" value={clinic.templates.toString()} />
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Operating status</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Clinic readiness</h2>
            </div>
            <span className="rounded-full bg-[#f1e2d6] px-3 py-1 text-xs font-semibold text-[#6f4d3f]">{clinic.status === "active" ? "Active" : "Setup"}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Owner email" value={`owner@${clinic.id.replace("clinic-", "")}.voone.test`} />
            <InfoRow icon={Phone} label="Center mobile" value={`+34 600 12 ${clinic.members.toString().padStart(3, "0")}`} />
            <InfoRow icon={Sparkles} label="Rewards" value="Tier + milestone program" />
            <InfoRow icon={BadgeCheck} label="Consent" value="Data processing ready" />
          </div>
          <div className="mt-5 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Onboarding progress</p>
                <p className="mt-1 text-xs text-[#8c7870]">Branding, card direction, treatments and rewards</p>
              </div>
              <span className="text-sm font-semibold">{clinic.status === "active" ? "100%" : "62%"}</span>
            </div>
            <span className="mt-3 block h-2 rounded-full bg-[#eadfd8]"><span className="block h-full rounded-full bg-[#b98a4f]" style={{ width: clinic.status === "active" ? "100%" : "62%" }} /></span>
          </div>
        </div>
      </section>

      <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl font-semibold tracking-tight">Template designs</h2>
          <Button asChild variant="outline" className="rounded-full"><Link href="/admin/templates">Open builder <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="mt-5 space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="grid gap-3 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">{template.memberCount} miembros</p>
              </div>
              <WalletStatusBadges statuses={template.walletStatus} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/templates/${template.id}`}>Abrir</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DarkMetric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <Icon className="h-4 w-4 text-[#d6a979]" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#bca99d]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-[#fff7f0]">{value}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4">
      <Icon className="h-4 w-4 text-[#a47845]" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}