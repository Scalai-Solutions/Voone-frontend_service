import {
  ApiError,
  getAutomationCatalog,
  getNotificationSettings,
  patchNotificationSettings,
  type AutomationCatalogEntry,
  type NotificationSettings,
  type NotificationSettingsPatch,
} from "@/lib/api-client";

/**
 * How a screen reads and saves a centre's automatic messages. Onboarding (Voone admin) and the
 * clinic dashboard reach the same backend through different proxies; the panel only sees this.
 */
export interface NotificationSettingsApi {
  /** Cache key: distinct per surface and centre. */
  scope: string;
  getSettings(): Promise<NotificationSettings>;
  patchSettings(
    patch: NotificationSettingsPatch,
  ): Promise<NotificationSettings>;
  getCatalog(): Promise<AutomationCatalogEntry[]>;
}

export const staffSettingsApi = (
  clinicId: string,
): NotificationSettingsApi => ({
  scope: `staff:${clinicId}`,
  getSettings: () => getNotificationSettings(clinicId),
  patchSettings: (patch) => patchNotificationSettings(clinicId, patch),
  getCatalog: getAutomationCatalog,
});

const adminRequest = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new ApiError(
      "Settings request failed",
      response.status,
      undefined,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
};

export const adminSettingsApi = (clinicId: string): NotificationSettingsApi => {
  const path = `/clinics/${encodeURIComponent(clinicId)}/notification-settings`;

  return {
    scope: `admin:${clinicId}`,
    getSettings: () => adminRequest<NotificationSettings>(path),
    patchSettings: (patch) =>
      adminRequest<NotificationSettings>(path, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    getCatalog: () =>
      adminRequest<{ automations: AutomationCatalogEntry[] }>(
        "/notification-automations/catalog",
      ).then((response) => response.automations),
  };
};

export const errorText = (error: unknown, fallback: string): string =>
  error instanceof ApiError && error.detail ? error.detail : fallback;
