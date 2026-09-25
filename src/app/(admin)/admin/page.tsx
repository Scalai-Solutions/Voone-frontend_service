import Link from "next/link";
import { CalendarDays, Ellipsis, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAdminClinics } from "@/lib/admin-api";
import { getTemplates } from "@/lib/api-client";

const ownerLabel = (clinic: Awaited<ReturnType<typeof getAdminClinics>>[number]) =>
  clinic.users.find((user) => user.role === "OWNER")?.email ?? clinic.users[0]?.email ?? "Sin usuario";

export default async function AdminOverviewPage() {
  const [clinics, templates] = await Promise.all([getAdminClinics(), getTemplates()]);
  const activeClinics = clinics.filter((clinic) => clinic.status === "active");
  const setupClinics = clinics.filter((clinic) => clinic.status === "setup");
  const totalMembers = clinics.reduce((total, clinic) => total + clinic.members, 0);
  const activeMembers = activeClinics.reduce((total, clinic) => total + clinic.members, 0);
  const recentOnboards = clinics.slice(0, 4).map((clinic) => ({
    ...clinic,
    owner: ownerLabel(clinic),
    progress: clinic.status === "active" ? 100 : 62,
  }));
  const networkNodes = clinics.slice(0, 3);
  const nodePositions = [
    { className: "left-12 top-20", tone: "bg-[#201715]" },
    { className: "right-10 top-12", tone: "bg-[#b98a4f]" },
    { className: "bottom-8 left-1/3", tone: "bg-[#b94f5a]" },
  ];
  const memberBars = clinics.length ? clinics.slice(0, 7).map((clinic) => Math.max(8, Math.min(100, clinic.members))) : [];

  return (
    <div className="mx-auto max-w-[1180px] space-y-2 text-[#2e2421]">
      <header className="flex flex-col gap-5 px-2 py-2 lg:flex-row lg:items-start">
        <div className="lg:flex-1">
          <h1 className="text-4xl font-semibold tracking-tight text-[#2e2421] sm:text-5xl">Dashboard</h1>
          <button type="button" className="mt-2 inline-flex items-center gap-1 text-sm text-[#806d63]">Sep 1 - Sep 30, 2026 <CalendarDays className="h-3.5 w-3.5" /></button>
        </div>
        <HeaderMetric label="Active clinics" value={activeClinics.length.toString()} detail="this month" />
        <HeaderMetric label="Members" value={totalMembers.toLocaleString()} detail={`${activeMembers.toLocaleString()} active`} />
        <Button asChild className="mt-1 rounded-xl bg-[#201715] px-4 text-white hover:bg-[#3b2a25]">
          <Link href="/admin/onboarding"><Rocket className="mr-2 h-4 w-4" /> Onboard clinic</Link>
        </Button>
      </header>

      <section className="grid gap-1.5 lg:grid-cols-2">
        <DashboardPanel title="Clinics by status" actionLabel="Open clinics" actionHref="/admin/clinics">
          <div className="grid gap-6 p-5 sm:grid-cols-[210px_1fr] sm:items-center">
            <div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full" style={{ background: "conic-gradient(#201715 0deg 238deg, #b98a4f 238deg 312deg, #eadfd8 312deg 360deg)" }}>
              <div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center">
                <div><p className="text-3xl font-semibold tracking-tight">{clinics.length}</p><p className="mt-1 text-xs text-[#687476]">Total clinics</p></div>
              </div>
            </div>
            <div className="space-y-4">
              <StatusRow color="bg-[#201715]" label="Active" value={activeClinics.length.toString()} total={clinics.length} />
              <StatusRow color="bg-[#b98a4f]" label="Onboarding" value={setupClinics.length.toString()} total={clinics.length} />
              <StatusRow color="bg-[#eadfd8]" label="Draft programs" value={templates.filter((template) => template.status !== "ACTIVE").length.toString()} total={clinics.length} />
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Clinic network" actionLabel="View map" actionHref="/admin/clinics">
          <div className="relative h-64 overflow-hidden p-5">
            <div className="absolute inset-5 rounded-[18px] bg-[#f5ede8] [background-image:linear-gradient(rgba(186,155,132,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(186,155,132,.18)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="absolute left-12 top-24 h-24 w-32 rounded-[45%_55%_55%_45%] bg-[#e3c9b7] opacity-70" />
            <div className="absolute right-16 top-12 h-28 w-36 rounded-[55%_45%_40%_60%] bg-[#e9d7ca]" />
            <div className="absolute bottom-10 left-1/3 h-16 w-28 rounded-[50%_50%_38%_62%] bg-[#efe3da]" />
            {networkNodes.map((clinic, index) => <NetworkNode key={clinic.id} className={nodePositions[index].className} name={clinic.name} value={clinic.members.toLocaleString()} tone={nodePositions[index].tone} />)}
            <div className="absolute bottom-5 right-5 rounded-xl bg-[#201715] px-4 py-3 text-white shadow-lg"><p className="text-2xl font-semibold">{totalMembers.toLocaleString()}</p><p className="text-xs text-white/70">Members network</p></div>
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-1.5 lg:grid-cols-[1.07fr_0.93fr]">
        <DashboardPanel title="Recent onboards" actionLabel="Start onboarding" actionHref="/admin/onboarding">
          <div className="divide-y divide-[#eadfd8] px-5 py-3">
            {recentOnboards.map((clinic) => (
              <Link key={clinic.id} href={`/admin/clinics/${clinic.id}`} className="grid gap-3 py-3 transition hover:bg-[#fffaf6] sm:grid-cols-[1fr_auto] sm:items-center">
                <span>
                  <span className="block font-semibold">{clinic.name}</span>
                  <span className="mt-1 block text-xs text-[#806d63]">{clinic.owner} · {clinic.addressLine}</span>
                </span>
                <span className="min-w-36">
                  <span className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-[#806d63]"><span>{clinic.status === "active" ? "Launched" : "Setup"}</span><span>{clinic.progress}%</span></span>
                  <span className="block h-2 overflow-hidden rounded-full bg-[#eadfd8]"><span className="block h-full rounded-full bg-[#b98a4f]" style={{ width: `${clinic.progress}%` }} /></span>
                </span>
              </Link>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Member activation" actionLabel="Open analytics" actionHref="/admin/clinics">
          <div className="p-5">
            <div className="flex items-end justify-between border-b border-[#eadfd8] pb-3 text-xs text-[#927e72]"><span>Members by clinic</span><span className="font-semibold text-[#a47845]">{totalMembers.toLocaleString()} total</span></div>
            <div className="relative mt-4 h-36 border-b border-[#eadfd8]">
              {memberBars.map((height, index) => <span key={`${height}-${index}`} className="absolute bottom-0 w-[10%] rounded-t-md bg-[#e3c9b7]" style={{ height: `${height}%`, left: `${index * 14 + 4}%` }} />)}
              {memberBars.length ? <div className="absolute inset-x-[6%] top-[20%] border-t-2 border-[#201715]" /> : null}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-[#748082]"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
          </div>
        </DashboardPanel>
      </section>
    </div>
  );
}

function DashboardPanel({ title, children, actionLabel, actionHref }: { title: string; children: React.ReactNode; actionLabel: string; actionHref: string }) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_26px_rgba(67,48,43,0.08)]">
      <div className="flex items-center justify-between px-5 pt-5"><h2 className="text-sm font-semibold">{title}</h2><div className="flex items-center gap-2"><Link href={actionHref} className="hidden text-xs font-medium text-[#a47845] sm:block">{actionLabel}</Link><button type="button" aria-label={`More options for ${title}`} className="grid h-8 w-8 place-items-center rounded-full bg-[#f5ede8] text-[#704f40]"><Ellipsis className="h-4 w-4" /></button></div></div>
      {children}
    </section>
  );
}

function HeaderMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="min-w-[110px] pt-1"><p className="text-4xl font-semibold tracking-tight text-[#2e2421]">{value}</p><p className="mt-1 text-sm text-[#806d63]">{label}</p><p className="mt-1 text-[11px] text-[#a47845]">{detail}</p></div>;
}

function StatusRow({ color, label, value, total }: { color: string; label: string; value: string; total: number }) {
  return <div className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-sm"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="border-b border-dashed border-[#ded2cb] pb-1">{label}</span><span className="font-semibold">{value}/{total}</span></div>;
}

function NetworkNode({ className, name, value, tone }: { className: string; name: string; value: string; tone: string }) {
  return <div className={`absolute z-10 flex items-center gap-2 ${className}`}><span className={`h-3 w-3 rounded-full ring-4 ring-white/70 ${tone}`} /><span className="rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold shadow-sm">{name} · {value}</span></div>;
}

