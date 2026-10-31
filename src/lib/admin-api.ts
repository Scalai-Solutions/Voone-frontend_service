import "server-only";

import { ApiError, type Clinic, type Member, type WalletInfrastructure } from "@/lib/api-client";
import type { ProgramListItem } from "@/lib/onboarding-api";
import { staffFetch } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

async function adminFetch<T>(path: string): Promise<T> {
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

  const response = await staffFetch(path, { method: "GET" });

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