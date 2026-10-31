import type {
  AutomationCatalogEntry,
  NotificationSettings,
} from "@/lib/api-client";

/** What each {variable} is called to staff, shown on the insert chips. */
export const VARIABLE_LABELS: Record<string, string> = {
  first_name: "Nombre",
  clinic_name: "Centro",
  google_maps_link: "Enlace de reseñas",
  referral_reward: "Recompensa",
  new_tier: "Nuevo nivel",
  benefits_summary: "Ventajas",
};

const PLACEHOLDER = /\{([a-z_]+)\}/g;

/** The {names} in `text` that the event does not provide (typos, or another event's variable). */
export const unknownVariables = (
  text: string,
  allowed: readonly string[],
): string[] => [
  ...new Set(
    [...text.matchAll(PLACEHOLDER)]
      .map((match) => match[1])
      .filter((name) => !allowed.includes(name)),
  ),
];

/** Example values for the preview; the centre's real name, link and reward are used when set. */
export const sampleValues = (
  clinicName: string,
  clinic: Pick<NotificationSettings, "googleReviewUrl" | "referralRewardText">,
): Record<string, string> => ({
  first_name: "Lucía",
  clinic_name: clinicName,
  google_maps_link:
    clinic.googleReviewUrl ?? "https://g.page/r/tu-centro/review",
  referral_reward: clinic.referralRewardText ?? "10 € de descuento",
  new_tier: "Oro",
  benefits_summary: "descuento en cosmética y prioridad en citas",
});

export const renderPreview = (
  text: string,
  values: Record<string, string>,
): string =>
  text.replace(
    PLACEHOLDER,
    (_match, name: string) => values[name] ?? `{${name}}`,
  );

/** What the clinic still has to fill in before this event can be switched on. */
export const missingClinicValue = (
  entry: AutomationCatalogEntry,
  settings: Pick<
    NotificationSettings,
    "googleReviewUrl" | "referralRewardText"
  >,
): boolean => Boolean(entry.requires && !settings[entry.requires]);
