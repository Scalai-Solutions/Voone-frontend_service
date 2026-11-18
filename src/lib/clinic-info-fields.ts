/**
 * The only fields the owner's own "Información del centro" save may send.
 *
 * The backend route this save reaches (`PATCH /v1/admin/clinics/:id`) is the Voone admin's
 * clinic editor and also writes the plan, the active flag and the notification quota. The
 * handler therefore never forwards what the browser sent: it forwards this allowlist, and
 * refuses a body that carries anything else. Keep in step with the backend's
 * clinicDetailsSchema; ClinicInfoPatch (api-client.ts), what ClinicInfoForm sends, is checked
 * against this list at compile time below.
 *
 * Pure (a type-only import, erased at runtime) so the node test runner can load it.
 */
import type { ClinicInfoPatch } from "./api-client";

export const CLINIC_INFO_FIELDS = [
  "name",
  "addressLine",
  "pincode",
  "billingName",
  "billingTaxId",
  "billingEmail",
  "billingAddressLine",
  "billingPostalCode",
  "contactPhone",
  "contactEmail",
] as const;

export type ClinicInfoField = (typeof CLINIC_INFO_FIELDS)[number];

/**
 * Fails to compile when the form's patch and this allowlist disagree. Without it a field added
 * to the form (contact phone and email were) is refused here and every save from the form fails
 * with INVALID_BODY, which only shows once deployed.
 */
export const CLINIC_INFO_FIELDS_MATCH_PATCH: [
  Exclude<keyof ClinicInfoPatch, ClinicInfoField>,
  Exclude<ClinicInfoField, keyof ClinicInfoPatch>,
] extends [never, never]
  ? true
  : never = true;

export type ClinicInfoBody = Partial<Record<ClinicInfoField, string>>;

export type ClinicInfoParse =
  | { ok: true; value: ClinicInfoBody }
  | { ok: false; message: string };

const allowed: ReadonlySet<string> = new Set(CLINIC_INFO_FIELDS);

/**
 * Parses the raw request text of the centre-info save.
 *
 * Refuses (rather than silently strips) anything that is not a plain object of allowed string
 * fields, so a tampered request fails loudly and a client bug cannot go unnoticed. Whether a
 * value is acceptable (empty name, invalid email) stays the backend's call.
 */
export const parseClinicInfoBody = (raw: string): ClinicInfoParse => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "La solicitud no es válida." };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: "La solicitud no es válida." };
  }

  const value: ClinicInfoBody = {};

  for (const [key, field] of Object.entries(parsed)) {
    if (!allowed.has(key)) {
      return {
        ok: false,
        message:
          "Solo se pueden modificar los datos del centro y de facturación.",
      };
    }

    if (typeof field !== "string") {
      return {
        ok: false,
        message: "Los datos del centro deben ser texto.",
      };
    }

    value[key as ClinicInfoField] = field;
  }

  return { ok: true, value };
};
