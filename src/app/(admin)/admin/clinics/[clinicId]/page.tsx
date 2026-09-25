import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Bell, Building2, CreditCard, Gift, Mail, MapPin, Phone, Sparkles, Target, Users, WalletCards } from "lucide-react";

import { ClinicAccountActions, ClinicCredentialsActions } from "@/components/admin/clinic-account-actions";
import { PageHeader } from "@/components/shared/page-kit";
import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError, type MilestoneRewardsInput, type TierRewardInput } from "@/lib/api-client";

const ownerLabel = (clinic: Awaited<ReturnType<typeof getAdminClinic>>) =>
  clinic.users.find((user) => user.role === "OWNER")?.email ?? clinic.users[0]?.email ?? "Sin usuario";

export default async function ClinicDetailPage({ params }: PageProps<"/admin/clinics/[clinicId]">) {
  const { clinicId } = await params;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });
  const template = clinic.template;
  const tierRewards = Array.isArray(template?.tierRewards) ? template.tierRewards : [];
  const milestoneRewards = template?.milestoneRewards;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clinic profile" title={clinic.name} description={`${clinic.addressLine} · ${clinic.pincode}`} action={template ? { href: `/dashboard/templates/${template.id}`, label: "Open builder" } : { href: "/admin/onboarding/new", label: "Create template" }} />

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="relative overflow-hidden rounded-[30px] bg-[#211918] p-6 text-[#fff8f2] shadow-[0_20px_60px_rgba(67,42,30,0.14)]">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_58%_46%,rgba(154,111,82,0.36),transparent_34%),linear-gradient(90deg,transparent,rgba(117,82,65,0.34))]" />
          <div className="relative">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1d6bd] text-[#402d26]"><Building2 className="h-6 w-6" /></span>
            <h2 className="mt-6 max-w-md font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.03em]">{clinic.name}</h2>
            <p className="mt-5 flex items-center gap-2 text-sm text-[#c9bbb3]"><MapPin className="h-4 w-4" /> {clinic.addressLine} · {clinic.pincode}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <DarkMetric icon={Users} label="Members" value={clinic.members.toLocaleString()} />
              <DarkMetric icon={CreditCard} label="Voone plan" value={clinic.voonePlan} />
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
            <InfoRow icon={Mail} label="Owner email" value={ownerLabel(clinic)} />
            <InfoRow icon={Phone} label="Clinic slug" value={clinic.slug} />
            <InfoRow icon={Sparkles} label="Wallet template" value={clinic.template?.programName ?? "No pass created"} />
            <InfoRow icon={BadgeCheck} label="Privacy notice" value={clinic.privacyPolicyVersion} />
            <InfoRow icon={CreditCard} label="Current Voone plan" value={clinic.voonePlan} />
            <InfoRow icon={Bell} label="Notifications left" value={`${clinic.notificationsRemainingThisMonth} of ${clinic.notificationsMonthlyQuota}`} />
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

      <section className="space-y-4">
        <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Template designs</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Selected clinic template</h2>
            </div>
            {template ? <Button asChild variant="outline" className="rounded-full"><Link href={`/dashboard/templates/${template.id}`}>Open builder <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button> : null}
          </div>
          {template ? (
            <div className="mt-5 grid gap-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4 md:grid-cols-[180px_1fr]">
              <div className="rounded-2xl p-4 text-[#2e2421]" style={{ backgroundColor: template.hexBackgroundColor }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">VOONE PASS</p>
                <p className="mt-8 font-serif text-2xl font-semibold leading-tight">{template.programName}</p>
                <p className="mt-8 text-xs">{template.pointsLabel} · {template.tierLabel}</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{template.programName}</p>
                <p className="mt-2 text-sm leading-6 text-[#806d63]">{template.benefitsText}</p>
                <div className="mt-4"><WalletStatusBadges statuses={template.walletStatus} /></div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <SmallFact label="Status" value={template.status} />
                  <SmallFact label="Website" value={template.websiteUrl ?? "Not set"} />
                  <SmallFact label="Appointment" value={template.appointmentUrl ?? "Not set"} />
                  <SmallFact label="Pass info" value={template.infoText} />
                </div>
              </div>
            </div>
          ) : <p className="mt-5 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4 text-sm text-[#806d63]">No selected template for this clinic yet.</p>}
        </div>

        <ClinicCredentialsActions clinicId={clinic.id} email={clinic.onboardingCredentials?.email} generatedAt={clinic.onboardingCredentials?.generatedAt} sentAt={clinic.onboardingCredentials?.sentAt} hasPassword={clinic.onboardingCredentials?.hasPassword} />
      </section>

      <section className="space-y-4">
        <SetupPanel icon={WalletCards} title="Treatments" description="Clinic dashboard treatment catalog and points setup.">
          {(clinic.treatments ?? []).length > 0 ? (clinic.treatments ?? []).map((treatment) => <SetupRow key={treatment.id} name={treatment.name} detail={treatment.priceEuro ? `${treatment.priceEuro} euro` : "No price set"} value={`${treatment.points} points`} />) : <EmptySetupRow label="No treatments saved" />}
        </SetupPanel>
        <SetupPanel icon={Gift} title="Tier rewards" description="Reward tiers created during onboarding.">
          {tierRewards.length > 0 ? tierRewards.map((tier, index) => <SetupRow key={`${tier.name}-${index}`} name={tier.name} detail={tier.rewardText || "No reward text set"} value="Tier" />) : <EmptySetupRow label="No tier rewards saved" />}
        </SetupPanel>
        <SetupPanel icon={Target} title="Milestone rewards" description="Conversion and next milestone rules.">
          {milestoneRewards ? <MilestoneSummary milestone={milestoneRewards} /> : <EmptySetupRow label="No milestone rules saved" />}
        </SetupPanel>
        <SetupPanel icon={Building2} title="Clinic information" description="Business details shown in the clinic dashboard.">
          <SetupRow name="Commercial name" detail={clinic.name} value="Clinic" />
          <SetupRow name="Address" detail={`${clinic.addressLine} · ${clinic.pincode}`} value="Location" />
          <SetupRow name="Owner" detail={ownerLabel(clinic)} value="Contact" />
          <SetupRow name="Plan" detail={`${clinic.voonePlan} · ${clinic.notificationsRemainingThisMonth} notifications left`} value="Billing" />
        </SetupPanel>
      </section>

      <ClinicAccountActions clinicId={clinic.id} isActive={clinic.isActive} />
    </div>
  );
}

function SmallFact({ label, value }: { label: string; value: string }) {
  return <p className="rounded-xl bg-white/70 px-3 py-2"><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#a47845]">{label}</span><span className="mt-1 block text-xs text-[#4d3b35]">{value}</span></p>;
}

function SetupPanel({ icon: Icon, title, description, children }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: React.ReactNode }) {
  return <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1e2d6] text-[#704f40]"><Icon className="h-4 w-4" /></span><div><h2 className="font-serif text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-[#806d63]">{description}</p></div></div><div className="mt-5 space-y-3">{children}</div></div>;
}

function SetupRow({ name, detail, value }: { name: string; detail: string; value: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3"><div><p className="font-semibold">{name}</p><p className="mt-1 text-xs text-[#806d63]">{detail}</p></div><span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{value}</span></div>;
}

function EmptySetupRow({ label }: { label: string }) {
  return <p className="rounded-2xl border border-dashed border-[#e4d8d1] bg-[#fffaf6]/70 px-4 py-3 text-sm text-[#806d63]">{label}</p>;
}

function MilestoneSummary({ milestone }: { milestone: MilestoneRewardsInput }) {
  return <div className="grid gap-3 sm:grid-cols-2"><SetupRow name="Milestones" detail="Total milestone count" value={milestone.milestoneCount.toLocaleString()} /><SetupRow name="Next milestone" detail="Points needed for next milestone" value={`${milestone.pointsToNextMilestone.toLocaleString()} points`} /><SetupRow name="Price conversion" detail={`${milestone.priceAmount} euro spend`} value={`${milestone.pointsAwarded} points`} /><SetupRow name="Monthly notifications" detail="Remaining allowance for this clinic" value="Tracked above" /></div>;
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