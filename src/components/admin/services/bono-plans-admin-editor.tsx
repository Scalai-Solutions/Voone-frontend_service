"use client";

import * as React from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import {
  InlineConfirm,
  inputClass,
  panelClass,
  servicesErrorMessage,
} from "@/components/admin/services/services-shared";
import { Field } from "@/components/ui/field";
import {
  useClinicBonoPlans,
  useCreateClinicBonoPlan,
  useDeleteClinicBonoPlan,
  useUpdateClinicBonoPlan,
} from "@/features/admin-services/api/useAdminServices";
import {
  buildBonoPatch,
  parsePriceInput,
  priceToText,
  readSessionsInput,
  type BonoFormValues,
} from "@/lib/admin-services";
import type { BonoPlanRow } from "@/lib/bono-api";
import { formatEuros } from "@/lib/euros";

function BonoForm({
  idPrefix,
  initial,
  isPending,
  serverError,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  initial: BonoFormValues;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: BonoFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState(initial);
  const [errors, setErrors] = React.useState<{
    name?: string;
    price?: string;
    sessions?: string;
  }>({});

  const price = parsePriceInput(values.price, true);
  const sessions = readSessionsInput(values.sessions);
  const perSession =
    "value" in price && "value" in sessions
      ? Math.round((price.value / sessions.value) * 100) / 100
      : null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: typeof errors = {};

    if (!values.name.trim()) next.name = "Enter a name.";
    if ("error" in price) next.price = price.error;
    if ("error" in sessions) next.sessions = sessions.error;

    setErrors(next);

    if (Object.keys(next).length === 0)
      onSubmit({ ...values, name: values.name.trim() });
  }

  const set = (key: keyof BonoFormValues) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-3 border-b border-[#eadfd8] bg-[#fffaf6] p-4 md:grid-cols-[1.4fr_160px_110px_auto]"
    >
      <Field label="Name" error={errors.name}>
        <input
          id={`${idPrefix}-name`}
          value={values.name}
          maxLength={120}
          onChange={set("name")}
          placeholder="Facial pack"
          className={inputClass}
        />
      </Field>
      <Field
        label="Pack price (€)"
        error={errors.price}
        hint={perSession !== null ? `${formatEuros(perSession)} per session` : undefined}
      >
        <input
          id={`${idPrefix}-price`}
          inputMode="decimal"
          value={values.price}
          onChange={set("price")}
          placeholder="199.50"
          className={inputClass}
        />
      </Field>
      <Field label="Sessions" error={errors.sessions}>
        <input
          id={`${idPrefix}-sessions`}
          inputMode="numeric"
          value={values.sessions}
          onChange={set("sessions")}
          placeholder="5"
          className={inputClass}
        />
      </Field>
      <div className="flex gap-2 self-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center rounded-xl bg-[#2d211e] px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save size={15} className="mr-1" />
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-xl border border-[#cdb9aa] px-3 text-sm font-semibold text-[#754b36]"
          aria-label="Cancel"
        >
          <X size={15} />
        </button>
      </div>
      {serverError ? (
        <p role="alert" className="text-sm font-semibold text-[#b94135] md:col-span-full">
          {serverError}
        </p>
      ) : null}
    </form>
  );
}

/**
 * A clinic's session-voucher (bono) plans: add, edit, retire or delete. The price is the
 * whole pack (the per-session figure is derived from it). A plan members already hold is
 * retired instead of deleted, and the result says which happened.
 */
export function BonoPlansAdminEditor({ clinicId }: { clinicId: string }) {
  const plansQuery = useClinicBonoPlans(clinicId);
  const create = useCreateClinicBonoPlan(clinicId);
  const update = useUpdateClinicBonoPlan(clinicId);
  const remove = useDeleteClinicBonoPlan(clinicId);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<{ scope: string; text: string } | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const plans = plansQuery.data ?? [];
  const errorFor = (scope: string) => (error?.scope === scope ? error.text : null);

  function open(id: string | null) {
    setEditingId(id);
    setConfirmingId(null);
    setError(null);
    setNotice(null);
  }

  function add(values: BonoFormValues) {
    const price = parsePriceInput(values.price, true);
    const sessions = readSessionsInput(values.sessions);

    if ("error" in price || "error" in sessions) return;

    setError(null);
    create.mutate(
      { name: values.name, priceEuro: price.value, totalSessions: sessions.value },
      {
        onSuccess: () => setEditingId(null),
        onError: (failure) =>
          setError({ scope: "new", text: servicesErrorMessage(failure, "plan") }),
      },
    );
  }

  function edit(plan: BonoPlanRow, values: BonoFormValues) {
    const patch = buildBonoPatch(plan, values);

    if (!patch) return;

    if (Object.keys(patch).length === 0) {
      setEditingId(null);

      return;
    }

    setError(null);
    update.mutate(
      { id: plan.id, patch },
      {
        onSuccess: () => setEditingId(null),
        onError: (failure) =>
          setError({ scope: plan.id, text: servicesErrorMessage(failure, "plan") }),
      },
    );
  }

  function toggleActive(plan: BonoPlanRow) {
    setError(null);
    setNotice(null);
    update.mutate(
      { id: plan.id, patch: { active: !plan.active } },
      {
        onError: (failure) =>
          setError({ scope: plan.id, text: servicesErrorMessage(failure, "plan") }),
      },
    );
  }

  function drop(plan: BonoPlanRow) {
    setError(null);
    remove.mutate(plan.id, {
      onSuccess: (result) => {
        setConfirmingId(null);
        setNotice(
          result.status === "retired"
            ? `"${plan.name}" was retired, not deleted, because clients already hold it. It no longer appears when recording visits.`
            : `"${plan.name}" was deleted.`,
        );
      },
      onError: (failure) =>
        setError({ scope: plan.id, text: servicesErrorMessage(failure, "plan") }),
    });
  }

  return (
    <section className={`${panelClass} overflow-hidden !p-0`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd8] p-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            Session vouchers (bonos)
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[#806d63]">
            Packs the client pays for up front and uses over several visits. The
            pack price is split across the sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => open("new")}
          className="rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} className="mr-1 inline" />
          Add voucher
        </button>
      </div>

      {editingId === "new" ? (
        <BonoForm
          key="new"
          idPrefix="bono-new"
          initial={{ name: "", price: "", sessions: "" }}
          isPending={create.isPending}
          serverError={errorFor("new")}
          onSubmit={add}
          onCancel={() => open(null)}
        />
      ) : null}

      {notice ? (
        <p role="status" className="border-b border-[#eadfd8] bg-[#fff7e7] px-5 py-3 text-sm text-[#7a5a1e]">
          {notice}
        </p>
      ) : null}
      {plansQuery.isPending ? (
        <p className="px-5 py-4 text-sm text-[#806d63]">Loading vouchers...</p>
      ) : null}
      {plansQuery.isError ? (
        <p role="alert" className="px-5 py-4 text-sm font-semibold text-[#b94135]">
          Could not load the vouchers.
        </p>
      ) : null}
      {plansQuery.data && plans.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[#806d63]">No vouchers yet.</p>
      ) : null}

      {plans.map((plan) =>
        editingId === plan.id ? (
          <BonoForm
            key={plan.id}
            idPrefix={`bono-${plan.id}`}
            initial={{
              name: plan.name,
              // The pack total, not the per-session price.
              price: priceToText(plan.totalEuro),
              sessions: String(plan.totalSessions),
            }}
            isPending={update.isPending}
            serverError={errorFor(plan.id)}
            onSubmit={(values) => edit(plan, values)}
            onCancel={() => open(null)}
          />
        ) : (
          <div key={plan.id} className="border-b border-[#eadfd8] px-5 py-4 last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {plan.name}
                  {plan.active ? "" : " (retired)"}
                </p>
                <p className="mt-1 text-xs text-[#806d63]">
                  {formatEuros(plan.totalEuro)} for {plan.totalSessions} sessions
                  {" · "}
                  {formatEuros(plan.pricePerSessionEuro)} per session{" · "}
                  {plan.issuedCount === 0
                    ? "no clients yet"
                    : `${plan.issuedCount} client${plan.issuedCount === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5 text-xs text-[#806d63]">
                  <input
                    type="checkbox"
                    checked={plan.active}
                    disabled={update.isPending}
                    onChange={() => toggleActive(plan)}
                    aria-label={`Active: ${plan.name}`}
                    className="h-4 w-4"
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => open(plan.id)}
                  className="text-[#9b633e]"
                  aria-label={`Edit ${plan.name}`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setError(null);
                    setNotice(null);
                    setConfirmingId(plan.id);
                  }}
                  className="text-[#b94135]"
                  aria-label={`Delete ${plan.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {confirmingId === plan.id ? (
              <InlineConfirm
                message={
                  plan.issuedCount > 0
                    ? `Delete "${plan.name}"? Clients already hold it, so it will be retired instead and their progress is kept.`
                    : `Delete "${plan.name}"? This cannot be undone.`
                }
                confirmLabel={plan.issuedCount > 0 ? "Yes, retire" : "Yes, delete"}
                pendingLabel="Working..."
                pending={remove.isPending}
                onConfirm={() => drop(plan)}
                onCancel={() => {
                  setConfirmingId(null);
                  setError(null);
                }}
              />
            ) : null}
            {errorFor(plan.id) ? (
              <p role="alert" className="mt-2 text-sm font-semibold text-[#b94135]">
                {errorFor(plan.id)}
              </p>
            ) : null}
          </div>
        ),
      )}
    </section>
  );
}
