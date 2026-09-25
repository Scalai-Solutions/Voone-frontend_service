import Link from "next/link";
import { ArrowUpRight, Rocket } from "lucide-react";

import { PageHeader } from "@/components/shared/page-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminClinics } from "@/lib/admin-api";

const ownerLabel = (clinic: Awaited<ReturnType<typeof getAdminClinics>>[number]) =>
  clinic.users.find((user) => user.role === "OWNER")?.email ?? clinic.users[0]?.email ?? "Sin usuario";

export default async function AdminOnboardingPage() {
  const clinics = await getAdminClinics();
  const recent = clinics.map((clinic) => ({ ...clinic, owner: ownerLabel(clinic), progress: clinic.status === "active" ? 100 : 62 }));

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <PageHeader eyebrow="Clinic launch" title="Onboarding" description="Start a guided clinic setup or resume a previous launch." />

      <section className="flex flex-col justify-between gap-6 rounded-[22px] bg-[#201715] p-7 text-[#fff8f2] shadow-[0_18px_38px_rgba(67,48,43,0.18)] md:flex-row md:items-end">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8cf9a]">New clinic</p><h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">A five-step launch flow for every new center.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#d7c4ba]">Owner, center, brand, loyalty program, and the first Wallet pass design are collected in one focused flow.</p></div>
        <Button asChild className="shrink-0 rounded-xl bg-[#f5e8dd] text-[#3b2a25] hover:bg-white"><Link href="/admin/onboarding/new"><Rocket className="mr-2 h-4 w-4" /> New onboarding</Link></Button>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-[#ded2cb] bg-white shadow-[0_12px_28px_rgba(67,48,43,0.08)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#eadfd8] px-5 py-4"><h2 className="text-lg font-semibold">Previous onboards</h2><Badge variant="secondary" className="bg-[#f1e3d6] text-[#805637]">Latest</Badge></div>
        <div className="divide-y divide-[#eadfd8]">
          {recent.length ? recent.map((clinic) => (
            <Link key={clinic.id} href={`/admin/clinics/${clinic.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-[#fffaf6] md:grid-cols-[1fr_160px_180px_24px] md:items-center">
              <span><span className="block font-semibold">{clinic.name}</span><span className="mt-1 block text-xs text-[#806d63]">{clinic.owner} · {clinic.addressLine}</span></span>
              <span className="text-sm text-[#806d63]">{clinic.templates} designs</span>
              <span><span className="mb-1 block text-xs font-semibold text-[#806d63]">{clinic.progress}% complete</span><span className="block h-2 overflow-hidden rounded-full bg-[#eadfd8]"><span className="block h-full rounded-full bg-[#b98a4f]" style={{ width: `${clinic.progress}%` }} /></span></span>
              <ArrowUpRight className="h-4 w-4 text-[#a47845]" />
            </Link>
          )) : <p className="px-5 py-8 text-sm font-semibold text-[#806d63]">No clinics onboarded yet.</p>}
        </div>
      </section>
    </div>
  );
}
