import "server-only";

import { ApiError, type Clinic, type DashboardOverview, type Member, type WalletInfrastructure } from "@/lib/api-client";
import { unresolvedCount, type ChangeRequestPage } from "@/lib/admin-change-requests";
import type { ProgramListItem } from "@/lib/onboarding-api";
import { staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

async function adminFetch<T>(
  path: string,
  headers?: Record<string, string>,
): Promise<T> {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    const body = (await guard.response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone admin request failed: ${guard.response.status}`,
      guard.response.status,
      body?.code,
      body?.message,
    );
  }

  const response = await staffFetch(path, { method: "GET", headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone admin request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

export function getAdminClinics() {
  return adminFetch<Clinic[]>("/v1/admin/clinics");
}

export function getAdminClinic(clinicId: string) {
  return adminFetch<Clinic>(`/v1/admin/clinics/${encodeURIComponent(clinicId)}`);
}

export function getAdminMembers() {
  return adminFetch<Member[]>("/v1/admin/members");
}

export function getAdminWalletInfrastructure() {
  return adminFetch<WalletInfrastructure>("/v1/admin/wallet");
}

export function getAdminClinicPrograms(clinicId: string) {
  return adminFetch<{ programs: ProgramListItem[] }>(
    `/v1/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/programs`
  ).then((response) => response.programs);
}

/**
 * One clinic's own dashboard figures (members, points, revenue, redemptions, top clients), for
 * the admin's analytics page. The backend scopes /dashboard/overview by clinicId alone, so this
 * is the same answer the clinic sees. Null when it fails: the page shows "—", never invented 0s.
 */
export async function getAdminClinicOverview(clinicId: string): Promise<DashboardOverview | null> {
  try {
    return await adminFetch<DashboardOverview>(
      `/v1/dashboard/overview?clinicId=${encodeURIComponent(clinicId)}`,
    );
  } catch {
    return null;
  }
}

/**
 * A clinic's members list, as its own metrics page reads it, for the tier, Wallet and age
 * breakdowns. The clinic routes answer only for an active centre, so an inactive one is null
 * without a call, as is a failed one.
 */
export async function getAdminClinicMembers(
  clinic: Pick<Clinic, "slug" | "isActive">,
): Promise<Member[] | null> {
  if (!clinic.isActive || !clinic.slug) return null;

  try {
    return await adminFetch<Member[]>(`/v1/clinics/${encodeURIComponent(clinic.slug)}/members`);
  } catch {
    return null;
  }
}

export interface AutomationClinicSettings {
  marketingEnabled: boolean;
  birthdayEnabled: boolean;
  birthdayNotify: boolean;
  birthdayLastRunDate: string | null;
  bonoReminderEnabled: boolean;
  bonoReminderNotify: boolean;
  /** Every automated event, so a new one needs no change here. */
  automations?: Record<string, { enabled: boolean; notify: boolean }>;
  usesDefaults: boolean;
}

export interface ManualNotificationQuota {
  monthlyQuota: number;
  usedThisMonth: number;
  remainingThisMonth: number;
}

export interface ClinicAutomationOverviewItem {
  clinicId: string;
  name: string;
  addressLine: string;
  isActive: boolean;
  settings: AutomationClinicSettings;
  manualQuota: ManualNotificationQuota;
  totalNotificationsSent: number;
  upcomingBirthdayCandidates: number;
  bonoCandidates: number;
  recentBirthdayNotifications: number;
  recentBonoNotifications: number;
  lastAutomationSentAt: string | null;
}

export interface DeliveryBreakdownEntry {
  status: string;
  errorCode: string | null;
  provider: string;
  count: number;
}

export interface NotificationDeliveryDetail {
  memberId: string;
  memberName: string;
  provider: string;
  status: string;
  errorCode: string | null;
}

export interface AutomationNotificationDetail {
  id: string;
  type: string;
  status: string;
  notify: boolean;
  header: string;
  createdAt: string;
  deliveriesTotal: number;
  breakdown: DeliveryBreakdownEntry[];
  deliveries: NotificationDeliveryDetail[];
}

export interface BirthdayCandidate {
  memberId: string;
  name: string;
  birthday: string;
  willSend: boolean;
  skipReasons: string[];
}

export interface BonoCandidateSummary {
  eligible: number;
  skipped: number;
  eligibleNames: string[];
  nextSendDate: string;
}

export interface NotificationTypeTotal {
  type: string;
  count: number;
}

export interface NotificationTotals {
  sentAllTime: number;
  byType: NotificationTypeTotal[];
}

export interface ClinicAutomationReport {
  clinicId: string;
  name: string;
  isActive: boolean;
  settings: AutomationClinicSettings;
  manualQuota: ManualNotificationQuota;
  totals: NotificationTotals;
  notifications: AutomationNotificationDetail[];
  birthdayCandidates: BirthdayCandidate[];
  bono: BonoCandidateSummary;
}

export function getAdminNotificationOverview() {
  return adminFetch<{ clinics: ClinicAutomationOverviewItem[] }>(
    "/v1/admin/notifications/overview"
  );
}

export function getAdminClinicNotificationReport(clinicId: string) {
  return adminFetch<ClinicAutomationReport>(
    `/v1/admin/notifications/clinics/${encodeURIComponent(clinicId)}`
  );
}

/**
 * How many of a clinic's change requests still need attention (open or in progress), for the
 * clinic profile. Soft by design: the profile must keep working when the tickets API is not
 * there (an older backend) or fails, so any failure is null and the profile just shows no count.
 */
export async function getAdminClinicOpenRequests(
  clinicId: string,
): Promise<{ count: number; more: boolean } | null> {
  try {
    const base = `/v1/admin/clinics/${encodeURIComponent(clinicId)}/change-requests`;
    const asAdmin = { "x-actor-role": "voone_admin" };
    const [open, inProgress] = await Promise.all([
      adminFetch<ChangeRequestPage>(`${base}?status=OPEN&limit=50`, asAdmin),
      adminFetch<ChangeRequestPage>(`${base}?status=IN_PROGRESS&limit=50`, asAdmin),
    ]);

    return unresolvedCount([open, inProgress]);
  } catch {
    return null;
  }
}
