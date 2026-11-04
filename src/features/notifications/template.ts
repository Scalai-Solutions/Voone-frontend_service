import type {
  AutomationCatalogEntry,
  NotificationSettings,
} from "@/lib/api-client";

/** What each {variable} is called to staff, shown on the insert chips. */
export const VARIABLE_LABELS: Record<string, string> = {
  first_name: "Nombre",
  clinic_name: "Centro",
  google_maps_link: "Enlace de reseñas",
  referral_reward: "Premio por referido",
  birthday_gift: "Regalo",
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

/**
 * Example values for the preview; the centre's real name and review link are used when set.
 * The referral reward and birthday gift are worked out per client from the live programme when
 * the message is sent, so the preview can only show an example.
 */
export const sampleValues = (
  clinicName: string,
  clinic: Pick<NotificationSettings, "googleReviewUrl">,
): Record<string, string> => ({
  first_name: "Lucía",
  clinic_name: clinicName,
  google_maps_link:
    clinic.googleReviewUrl ?? "https://g.page/r/tu-centro/review",
  referral_reward: "una limpieza facial",
  birthday_gift: "un tratamiento de cortesía",
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
  settings: Pick<NotificationSettings, "googleReviewUrl">,
): boolean => Boolean(entry.requires && !settings[entry.requires]);
