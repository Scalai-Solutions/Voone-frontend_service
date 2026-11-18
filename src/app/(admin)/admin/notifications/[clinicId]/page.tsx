import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Cake, CheckCircle2, Ticket, XCircle } from "lucide-react";

import { CommunicationsPageClient } from "@/components/dashboard/communications-page-client";
import { EmptyState, PageHeader } from "@/components/shared/page-kit";
import { Badge } from "@/components/ui/badge";
import { StaffScopeProvider } from "@/features/members/staff-scope";
import {
  getAdminClinic,
  getAdminClinicNotificationReport,
  type AutomationNotificationDetail,
  type BirthdayCandidate,
  type DeliveryBreakdownEntry,
  type NotificationDeliveryDetail,
} from "@/lib/admin-api";
import { ApiError, type Clinic } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Tab = "informacion" | "ajustes";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "informacion", label: "Información" },
  { id: "ajustes", label: "Ajustes" },
];

/** A clinic that no longer exists sends the admin back to the list. */
const backToListOn404 = (error: unknown): never => {
  if (error instanceof ApiError && error.status === 404) {
    redirect("/admin/notifications");
  }

  throw error;
};

const Panel = ({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">{eyebrow}</p>
    <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">{title}</h2>
    <div className="mt-5">{children}</div>
  </div>
);

const statusVariant = (status: string) =>
  status === "SENT"
    ? "default"
    : status === "FAILED" || status === "PARTIAL_FAILED"
      ? "destructive"
      : "secondary";

const deliveryVariant = (status: string) =>
  status === "SENT"
    ? "default"
    : status === "FAILED"
      ? "destructive"
      : status === "DOWNGRADED"
        ? "secondary"
        : "outline";

const TYPE_LABELS: Record<string, string> = {
  BIRTHDAY: "Birthday",
  BONO_REMINDER: "Inactive bono reminder",
  REVIEW_REQUEST: "Google review request",
  REFERRAL_PROMO: "Referral program push",
  BROADCAST: "Broadcast",
  SEGMENT: "Segment",
  SINGLE: "Single member",
  POINTS: "Points update",
  TIER: "Tier change",
};

const typeLabel = (type: string) => TYPE_LABELS[type] ?? type;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

const ToggleRow = ({ label, on, detail }: { label: string; on: boolean; detail: string }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3 text-sm">
    <span>
      <span className="block font-semibold text-[#2e2421]">{label}</span>
      <span className="mt-0.5 block text-xs text-[#8c7870]">{detail}</span>
    </span>
    <Badge variant={on ? "default" : "secondary"}>{on ? "On" : "Off"}</Badge>
  </div>
);

function DeliveryChips({ breakdown }: { breakdown: DeliveryBreakdownEntry[] }) {
  if (breakdown.length === 0) return <span className="text-xs text-[#8c7870]">No deliveries</span>;

  return (
    <span className="flex flex-wrap gap-1.5">
      {breakdown.map((entry) => (
        <Badge key={`${entry.status}-${entry.errorCode ?? ""}-${entry.provider}`} variant={deliveryVariant(entry.status)}>
          {entry.provider === "GOOGLE" ? "Google" : "Apple"} · {entry.status}
          {entry.errorCode ? ` · ${entry.errorCode}` : ""}: {entry.count}
        </Badge>
      ))}
    </span>
  );
}

function NotificationRow({ notification }: { notification: AutomationNotificationDetail }) {
  return (
    <div className="space-y-2 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#d9c9b6] bg-[#fffaf3]">
            {typeLabel(notification.type)}
          </Badge>
          <Badge variant={statusVariant(notification.status)}>{notification.status}</Badge>
          <Badge variant={notification.notify ? "default" : "secondary"}>
            {notification.notify ? "Push requested" : "Text only"}
          </Badge>
          <span className="text-xs text-[#8c7870]">{formatDate(notification.createdAt)}</span>
        </span>
        <span className="text-xs font-semibold text-[#6f625d]">
          {notification.deliveriesTotal} deliveries
        </span>
      </div>
      <p className="font-medium text-[#2e2421]">{notification.header}</p>
      <DeliveryChips breakdown={notification.breakdown} />
      {notification.deliveries.length > 0 ? (
        <div className="space-y-1.5 border-t border-[#ede4de] pt-2.5">
          {notification.deliveries.map((delivery) => (
            <DeliveryRow key={`${delivery.memberId}-${delivery.provider}`} delivery={delivery} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DeliveryRow({ delivery }: { delivery: NotificationDeliveryDetail }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="font-semibold text-[#2e2421]">{delivery.memberName}</span>
      <span className="flex items-center gap-2 text-[#8c7870]">
        <span>{delivery.provider === "GOOGLE" ? "Google Wallet" : "Apple Wallet"}</span>
        <Badge variant={deliveryVariant(delivery.status)}>{delivery.status}</Badge>
        {delivery.errorCode ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a06a3a]">
            {delivery.errorCode}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function BirthdayRow({ candidate }: { candidate: BirthdayCandidate }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3 text-sm">
      <span className="flex items-center gap-3">
        <Cake className="h-4 w-4 text-[#a47845]" />
        <span>
          <span className="block font-semibold text-[#2e2421]">{candidate.name}</span>
          <span className="mt-0.5 block text-xs text-[#8c7870]">Birthday {candidate.birthday}</span>
        </span>
      </span>
      {candidate.willSend ? (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Will send
        </Badge>
      ) : (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Skipped · {candidate.skipReasons.join(", ")}
        </Badge>
      )}
    </div>
  );
}

/**
 * One clinic in the Notification Manager. "Información" is the read-only report; "Ajustes" is the
 * clinic dashboard's own Comunicaciones screen, so an admin can change the clinic's automations
 * and send manual messages on its behalf. The tab lives in the URL (?tab=ajustes), so it can be
 * linked to and survives a refresh.
 */
export default async function ClinicNotificationReportPage({
  params,
  searchParams,
}: PageProps<"/admin/notifications/[clinicId]">) {
  const { clinicId } = await params;
  const tab: Tab = (await searchParams).tab === "ajustes" ? "ajustes" : "informacion";
  const [report, clinic] = await Promise.all([
    getAdminClinicNotificationReport(clinicId).catch(backToListOn404),
    tab === "ajustes" ? getAdminClinic(clinicId).catch(backToListOn404) : null,
  ]);

  return (
    <div className="space-y-6">
      <ReportHeader report={report} />
      <ClinicTabs clinicId={clinicId} active={tab} />
      {clinic ? <SettingsTab clinic={clinic} /> : <ReportBody report={report} />}
    </div>
  );
}

function ClinicTabs({ clinicId, active }: { clinicId: string; active: Tab }) {
  const base = `/admin/notifications/${encodeURIComponent(clinicId)}`;

  return (
    <nav aria-label="Secciones del centro" className="flex gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.id === "ajustes" ? `${base}?tab=ajustes` : base}
          aria-current={active === tab.id ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition",
            active === tab.id ? "bg-[#2d211e] text-white" : "text-[#806d63] hover:text-[#2d211e]",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/** Everything the clinic sees on its Comunicaciones page, acting for this clinic. */
function SettingsTab({ clinic }: { clinic: Clinic }) {
  return (
    <div className="space-y-4">
      {!clinic.isActive ? (
        <p className="rounded-lg border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
          El centro está inactivo: las automatizaciones no se envían y sus miembros y audiencias no
          están disponibles. Actívalo antes de mandar mensajes.
        </p>
      ) : null}
      <StaffScopeProvider clinicId={clinic.id}>
        <CommunicationsPageClient
          adminClinic={{
            id: clinic.id,
            name: clinic.name,
            notificationsUsedThisMonth: clinic.notificationsUsedThisMonth ?? 0,
          }}
        />
      </StaffScopeProvider>
    </div>
  );
}

function ReportHeader({
  report,
}: {
  report: Awaited<ReturnType<typeof getAdminClinicNotificationReport>>;
}) {
  return (
    <div className="space-y-3">
      <Link
        href="/admin/notifications"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7870] transition hover:text-[#2e2421]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Notification Manager
      </Link>
      <PageHeader
        eyebrow="Notification Manager"
        title={report.name}
        description="Información: past sends, delivery outcomes and upcoming candidates. Ajustes: change this clinic's automations and send manual messages on its behalf."
      />
      {!report.isActive ? (
        <Badge variant="secondary">Clinic inactive · automations skip inactive clinics</Badge>
      ) : null}
    </div>
  );
}

function ReportBody({
  report,
}: {
  report: Awaited<ReturnType<typeof getAdminClinicNotificationReport>>;
}) {
  const { settings } = report;

  return (
    <div className="space-y-6">

      <section className="grid gap-4 lg:grid-cols-1">
        <Panel eyebrow="All time" title="Notifications sent">
          <p className="font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">
            {report.totals.sentAllTime.toLocaleString()}
          </p>
          {report.totals.byType.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {report.totals.byType.map((total) => (
                <Badge key={total.type} variant="outline" className="border-[#d9c9b6] bg-[#fffaf3]">
                  {typeLabel(total.type)}: {total.count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#8c7870]">No notifications sent yet.</p>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="Automation" title="Birthday">
          <div className="space-y-2.5">
            <ToggleRow
              label="Birthday automation"
              on={settings.birthdayEnabled}
              detail={
                settings.usesDefaults
                  ? "Using platform defaults (no clinic settings row yet)"
                  : "Configured by the clinic"
              }
            />
            <ToggleRow
              label="Push notification"
              on={settings.birthdayNotify}
              detail="TEXT_AND_NOTIFY vs text-only message on the pass"
            />
            <ToggleRow
              label="Marketing consent gate"
              on={settings.marketingEnabled}
              detail="Manual sends also need the member's consent; automatic ones do not"
            />
            <div className="rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3 text-sm">
              <span className="block font-semibold text-[#2e2421]">Last birthday run</span>
              <span className="mt-0.5 block text-xs text-[#8c7870]">
                {settings.birthdayLastRunDate ?? "Never"}
              </span>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Automation" title="Bono reminder">
          <div className="space-y-2.5">
            <ToggleRow
              label="Bono reminder"
              on={settings.bonoReminderEnabled}
              detail={
                settings.usesDefaults
                  ? "Using platform defaults (no clinic settings row yet)"
                  : "Configured by the clinic"
              }
            />
            <ToggleRow
              label="Push notification"
              on={settings.bonoReminderNotify}
              detail="TEXT_AND_NOTIFY vs text-only message on the pass"
            />
            <div className="rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3 text-sm">
              <span className="block font-semibold text-[#2e2421]">Next send date</span>
              <span className="mt-0.5 block text-xs text-[#8c7870]">
                {formatDate(report.bono.nextSendDate)} · monthly, on the 1st
              </span>
            </div>
            <div className="rounded-2xl border border-warning/40 bg-[#fff7e7] p-4 text-sm">
              <span className="flex items-center gap-2 font-semibold text-[#2e2421]">
                <Ticket className="h-4 w-4" /> {report.bono.eligible} members will receive it
              </span>
              {report.bono.eligibleNames.length > 0 ? (
                <p className="mt-1.5 text-xs leading-5 text-[#8c7870]">
                  {report.bono.eligibleNames.join(", ")}
                  {report.bono.eligible > report.bono.eligibleNames.length
                    ? ` · +${report.bono.eligible - report.bono.eligibleNames.length} more`
                    : ""}
                </p>
              ) : null}
              {report.bono.skipped > 0 ? (
                <p className="mt-1.5 text-xs text-[#a06a3a]">
                  {report.bono.skipped} member(s) with an active bono skipped: no synced pass.
                </p>
              ) : null}
            </div>
          </div>
        </Panel>
      </section>

      <Panel eyebrow="History" title="Past automation sends (last 90 days)">
        {report.notifications.length > 0 ? (
          <div className="space-y-3">
            {report.notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No automation sends yet"
            message="Either the cron has not fired for this clinic, no candidate matched, or the toggles are off."
          />
        )}
      </Panel>

      <Panel eyebrow="Upcoming" title="Birthday candidates (next 7 days)">
        {report.birthdayCandidates.length > 0 ? (
          <div className="space-y-2.5">
            {report.birthdayCandidates.map((candidate) => (
              <BirthdayRow key={candidate.memberId} candidate={candidate} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No birthdays coming up"
            message="No member of this clinic has a birthday in the next seven days."
          />
        )}
      </Panel>
    </div>
  );
}

