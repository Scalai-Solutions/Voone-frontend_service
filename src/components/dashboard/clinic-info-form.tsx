"use client";

import * as React from "react";
import { Check, Loader2, Save } from "lucide-react";

import {
  BillingFields,
  billingDraftFrom,
  type BillingDraft,
  type BillingKey,
} from "@/components/billing/billing-fields";
import {
  ApiError,
  saveCurrentClinicInfo,
  type Clinic,
  type ClinicInfoPatch,
} from "@/lib/api-client";

const messageOf = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.detail ? error.detail : fallback;

/** The form's own state: every field is a plain string, "not set" being the empty one. */
type ClinicInfoDraft = Pick<
  ClinicInfoPatch,
  "name" | "addressLine" | "pincode"
> &
  BillingDraft;

/**
 * The centre's own information in Settings: its commercial details (name, address, postal code)
 * and its billing details, all editable in place. This is the only place a centre edits itself —
 * My center's "Información del centro" tab is gone, and everything about the centre lives here.
 *
 * `canEdit` is the clinic-edit permission: without it the fields render read-only, because the
 * commercial identity is what members' cards and invoices read.
 */
export function ClinicInfoForm({
  clinic,
  canEdit,
}: {
  clinic: Clinic;
  canEdit: boolean;
}) {
  const [draft, setDraft] = React.useState<ClinicInfoDraft>(() => ({
    name: clinic.name,
    addressLine: clinic.addressLine,
    pincode: clinic.pincode,
    ...billingDraftFrom(clinic),
  }));
  const [state, setState] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [message, setMessage] = React.useState<string | null>(null);

  const inputClass =
    "mt-2 h-10 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm font-normal outline-none focus:border-[#b8864b] disabled:bg-[#faf5f0] disabled:text-[#927e72]";

  const set =
    (field: keyof ClinicInfoPatch) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setDraft((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage(null);

    try {
      const saved = await saveCurrentClinicInfo(draft);

      setDraft({
        name: saved.name,
        addressLine: saved.addressLine,
        pincode: saved.pincode,
        ...billingDraftFrom(saved),
      });
      setState("saved");
      setMessage("Información del centro guardada.");
    } catch (error) {
      setState("error");
      setMessage(
        messageOf(error, "No se pudo guardar la información del centro."),
      );
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={!canEdit}>
        <label className="text-sm font-semibold">
          Nombre comercial
          <input
            type="text"
            value={draft.name}
            onChange={set("name")}
            required
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold">
          Dirección
          <input
            type="text"
            value={draft.addressLine}
            onChange={set("addressLine")}
            required
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold">
          Código postal
          <input
            type="text"
            value={draft.pincode}
            onChange={set("pincode")}
            required
            className={inputClass}
          />
        </label>
      </fieldset>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">
          Facturación
        </p>
        <p className="mt-1 text-xs text-[#927e72]">
          Los datos con los que se emiten las facturas de Voone.
        </p>
        <div className="mt-3">
          <BillingFields
            value={draft}
            disabled={!canEdit}
            onChange={(key: BillingKey, next) =>
              setDraft((current) => ({ ...current, [key]: next }))
            }
          />
        </div>
      </div>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={state === "saving"}
            className="inline-flex items-center rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "saving" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : state === "saved" ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar información del centro
          </button>
          {message ? (
            <p
              role={state === "error" ? "alert" : "status"}
              className={
                state === "error"
                  ? "text-sm font-semibold text-[#b94135]"
                  : "text-sm font-semibold text-[#3d6a48]"
              }
            >
              {message}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-2xl bg-[#fffaf6] px-4 py-3 text-sm text-[#806d63]">
          Solo el propietario o un administrador del centro puede editar esta
          información.
        </p>
      )}
    </form>
  );
}
