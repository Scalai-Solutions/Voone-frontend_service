import * as React from "react";

/** The billing details of a centre, as the backend stores them. All optional; "" means not set. */
export const BILLING_KEYS = [
  "billingName",
  "billingTaxId",
  "billingEmail",
  "billingAddressLine",
  "billingPostalCode",
] as const;

export type BillingKey = (typeof BILLING_KEYS)[number];
export type BillingDraft = Record<BillingKey, string>;

const FIELDS: Array<{
  key: BillingKey;
  label: string;
  type: "text" | "email";
  placeholder: string;
  autoComplete: string;
}> = [
  {
    key: "billingName",
    label: "Razón social",
    type: "text",
    placeholder: "Como en las facturas",
    autoComplete: "organization",
  },
  {
    key: "billingTaxId",
    label: "NIF / CIF",
    type: "text",
    placeholder: "B12345678",
    autoComplete: "off",
  },
  {
    key: "billingEmail",
    label: "Email de facturación",
    type: "email",
    placeholder: "facturas@tucentro.com",
    autoComplete: "email",
  },
  {
    key: "billingAddressLine",
    label: "Dirección de facturación",
    type: "text",
    placeholder: "Calle, número, piso",
    autoComplete: "street-address",
  },
  {
    key: "billingPostalCode",
    label: "Código postal de facturación",
    type: "text",
    placeholder: "28003",
    autoComplete: "postal-code",
  },
];

/** A saved value as the form shows it: empty meaning "not set". */
export const billingDraftFrom = (
  source: Partial<Record<BillingKey, string | null>>,
): BillingDraft =>
  Object.fromEntries(
    BILLING_KEYS.map((key) => [key, source[key] ?? ""]),
  ) as BillingDraft;

const inputClass =
  "mt-2 h-10 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm font-normal outline-none focus:border-[#b8864b] disabled:bg-[#faf5f0] disabled:text-[#927e72]";

/**
 * The billing inputs, shared by onboarding and Settings › Información del centro so both collect
 * and show exactly the same details.
 */
export function BillingFields({
  value,
  onChange,
  disabled,
}: {
  value: BillingDraft;
  onChange: (key: BillingKey, next: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2" disabled={disabled}>
      {FIELDS.map((field) => (
        <label key={field.key} className="text-sm font-semibold">
          {field.label}
          <input
            type={field.type}
            value={value[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            className={inputClass}
          />
        </label>
      ))}
    </fieldset>
  );
}
