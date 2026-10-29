import Link from "next/link";
import { ArrowUpRight, Bell, Cake, Ticket } from "lucide-react";

import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-kit";
import { Badge } from "@/components/ui/badge";
import { getAdminNotificationOverview } from "@/lib/admin-api";

const NotificationToggle = ({ on }: { on: boolean }) => (
  <Badge variant={on ? "default" : "secondary"} className="w-fit">
    {on ? "On" : "Off"}
  </Badge>
);

export default async function NotificationManagerPage() {
  const overview = await getAdminNotificationOverview();
  const clinics = overview.clinics;
  const birthdayTotal = clinics.reduce(
    (total, clinic) => total + clinic.upcomingBirthdayCandidates,
    0
  );
  const bonoTotal = clinics.reduce((total, clinic) => total + clinic.bonoCandidates, 0);
  const quotaRemainingTotal = clinics.reduce(
    (total, clinic) => total + clinic.manualQuota.remainingThisMonth,
    0
  );
  const sentTotal = clinics.reduce(
    (total, clinic) => total + clinic.recentBirthdayNotifications + clinic.recentBonoNotifications,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Notification Manager"
        description="Automated birthday and bono-reminder wallet notifications: clinic settings, past sends with delivery outcomes, and upcoming candidates."
      />

      <section className="grid gap-4 lg:grid-cols-5">
        <StatCard label="Active clinics" value={clinics.length.toLocaleString()} detail="Reporting automations" />
        <StatCard label="Birthdays next 7 days" value={birthdayTotal.toLocaleString()} detail="Eligible candidates" />
        <StatCard label="Bono candidates" value={bonoTotal.toLocaleString()} detail="Active bonos with a pass" />
        <StatCard label="Automation sends" value={sentTotal.toLocaleString()} detail="Last 90 days" />
        <StatCard label="Manual quota left" value={quotaRemainingTotal.toLocaleString()} detail="This month, all clinics" />
      </section>

      {clinics.length > 0 ? (
        <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
          <div className="hidden grid-cols-[minmax(220px,1.4fr)_120px_150px_170px_160px_170px_36px] items-center gap-4 border-b border-[#e7ddd7] bg-[#fffaf6]/82 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c7870] lg:grid">
            <span>Clinic</span>
            <span>Birthday</span>
            <span>Bono reminder</span>
            <span>Upcoming</span>
            <span>Manual quota</span>
            <span>Last automation</span>
            <span />
          </div>
          {clinics.map((clinic) => (
            <Link
              key={clinic.clinicId}
              href={`/admin/notifications/${clinic.clinicId}`}
              className="grid gap-3 border-b border-[#ede4de] px-5 py-4 text-sm transition last:border-b-0 hover:bg-[#f5efeb] lg:grid-cols-[minmax(220px,1.4fr)_120px_150px_170px_160px_170px_36px] lg:items-center"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#201715] text-[#f1d6bd]">
                  <Bell className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold text-[#2e2421]">{clinic.name}</span>
                  <span className="mt-1 block text-xs text-[#8c7870]">{clinic.addressLine}</span>
                </span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                <NotificationToggle on={clinic.settings.birthdayEnabled} />
              </span>
              <span className="flex flex-wrap gap-1.5">
                <NotificationToggle on={clinic.settings.bonoReminderEnabled} />
              </span>
              <span className="flex items-center gap-4 text-xs font-semibold text-[#6f625d]">
                <span className="flex items-center gap-1.5">
                  <Cake className="h-3.5 w-3.5" /> {clinic.upcomingBirthdayCandidates}
                </span>
                <span className="flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5" /> {clinic.bonoCandidates}
                </span>
              </span>
              <span className="text-xs font-semibold text-[#6f625d]">
                {clinic.manualQuota.remainingThisMonth} / {clinic.manualQuota.monthlyQuota} left
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[#a09288]">
                  {clinic.manualQuota.usedThisMonth} used · {clinic.totalNotificationsSent} sent all-time
                </span>
              </span>
              <span className="text-xs text-[#6f625d]">
                {clinic.lastAutomationSentAt
                  ? new Date(clinic.lastAutomationSentAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Never"}
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[#a09288]">
                  {clinic.recentBirthdayNotifications + clinic.recentBonoNotifications} sends · 90d
                </span>
              </span>
              <ArrowUpRight className="hidden h-4 w-4 text-[#8c7870] lg:block" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No clinics to report"
          message="There are no active clinics yet, so no automations are running."
        />
      )}
    </div>
  );
}
