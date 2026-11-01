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
  useClinicTreatmentCategories,
  useClinicTreatments,
  useCreateClinicTreatment,
  useDeleteClinicTreatment,
  useUpdateClinicTreatment,
} from "@/features/admin-services/api/useAdminServices";
import type { ManagedTreatment } from "@/lib/api-client";
import {
  buildTreatmentPatch,
  parsePriceInput,
  priceToText,
  type TreatmentFormValues,
} from "@/lib/admin-services";
import { formatEuros } from "@/lib/euros";

interface FormProps {
  idPrefix: string;
  initial: TreatmentFormValues;
  usesCatalogue: boolean;
  categories: Array<{ id: string; label: string }>;
  categoriesFailed: boolean;
  isPending: boolean;
  serverError: string | null;
  submitLabel: string;
  /** An old row with no price or category may be edited without being given one. */
  keepMissing: boolean;
  onSubmit: (values: TreatmentFormValues) => void;
  onCancel: () => void;
}

function TreatmentForm({
  idPrefix,
  initial,
  usesCatalogue,
  categories,
  categoriesFailed,
  isPending,
  serverError,
  submitLabel,
  keepMissing,
  onSubmit,
  onCancel,
}: FormProps) {
  const [values, setValues] = React.useState(initial);
  const [errors, setErrors] = React.useState<{
    name?: string;
    price?: string;
    category?: string;
  }>({});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: typeof errors = {};

    if (!values.name.trim()) next.name = "Enter a name.";

    if (!(keepMissing && !values.price.trim())) {
      const price = parsePriceInput(values.price, usesCatalogue);

      if ("error" in price) next.price = price.error;
    }

    if (usesCatalogue && !values.categoryId && !keepMissing)
      next.category = "Choose a category.";

    setErrors(next);

    if (Object.keys(next).length === 0)
      onSubmit({ ...values, name: values.name.trim() });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-3 border-b border-[#eadfd8] bg-[#fffaf6] p-4 md:grid-cols-[1.4fr_150px_1fr_auto]"
    >
      <Field label="Name" error={errors.name}>
        <input
          id={`${idPrefix}-name`}
          value={values.name}
          maxLength={120}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Hydrafacial"
          className={inputClass}
        />
      </Field>
      <Field
        label={usesCatalogue ? "Price (€)" : "Price (whole €)"}
        error={errors.price}
      >
        <input
          id={`${idPrefix}-price`}
          inputMode="decimal"
          value={values.price}
          onChange={(event) =>
            setValues((current) => ({ ...current, price: event.target.value }))
          }
          placeholder={usesCatalogue ? "60.00" : "60"}
          className={inputClass}
        />
      </Field>
      {usesCatalogue ? (
        <Field
          label="Category"
          error={
            errors.category ??
            (categoriesFailed ? "Could not load the categories." : undefined)
          }
        >
          <select
            id={`${idPrefix}-category`}
            value={values.categoryId}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                categoryId: event.target.value,
              }))
            }
            className={inputClass}
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <div className="flex gap-2 self-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center rounded-xl bg-[#2d211e] px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save size={15} className="mr-1" />
          {isPending ? "Saving..." : submitLabel}
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
        <p
          role="alert"
          className="text-sm font-semibold text-[#b94135] md:col-span-full"
        >
          {serverError}
        </p>
      ) : null}
    </form>
  );
}

/**
 * A clinic's treatments for the admin: a table with add, edit and delete. Owners can no longer
 * edit these themselves (their requests arrive as tickets), so this is where the change is made
 * outside a ticket. Which fields exist depends on the centre: with the catalogue a category is
 * required and prices may have cents; without it prices are whole euros and there is no category.
 * Points are shown as the backend returns them (derived from the price; not editable).
 */
export function TreatmentsAdminEditor({ clinicId }: { clinicId: string }) {
  const catalogue = useClinicTreatments(clinicId);
  const usesCatalogue = catalogue.data?.usesCatalogue ?? false;
  const categoriesQuery = useClinicTreatmentCategories(clinicId, usesCatalogue);
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const categoryLabels = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
  const createMutation = useCreateClinicTreatment(clinicId);
  const updateMutation = useUpdateClinicTreatment(clinicId);
  const deleteMutation = useDeleteClinicTreatment(clinicId);
  // "new", a treatment id being edited, or null.
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<{
    scope: string;
    text: string;
  } | null>(null);

  const items = catalogue.data?.items ?? [];
  const errorFor = (scope: string) =>
    error?.scope === scope ? error.text : null;

  function open(id: string | null) {
    setEditingId(id);
    setConfirmingId(null);
    setError(null);
  }

  function create(values: TreatmentFormValues) {
    const price = parsePriceInput(values.price, usesCatalogue);

    if ("error" in price) return;

    setError(null);
    createMutation.mutate(
      {
        name: values.name,
        priceEuro: price.value,
        ...(usesCatalogue && values.categoryId
          ? { categoryId: values.categoryId }
          : {}),
      },
      {
        onSuccess: () => setEditingId(null),
        onError: (failure) =>
          setError({
            scope: "new",
            text: servicesErrorMessage(failure, "treatment"),
          }),
      },
    );
  }

  function update(treatment: ManagedTreatment, values: TreatmentFormValues) {
    const patch = buildTreatmentPatch(treatment, values, usesCatalogue);

    if (!patch) return;

    if (Object.keys(patch).length === 0) {
      setEditingId(null);

      return;
    }

    setError(null);
    updateMutation.mutate(
      { id: treatment.id, input: patch },
      {
        onSuccess: () => setEditingId(null),
        onError: (failure) =>
          setError({
            scope: treatment.id,
            text: servicesErrorMessage(failure, "treatment"),
          }),
      },
    );
  }

  function remove(treatment: ManagedTreatment) {
    setError(null);
    deleteMutation.mutate(treatment.id, {
      onSuccess: () => setConfirmingId(null),
      onError: (failure) =>
        setError({
          scope: treatment.id,
          text: servicesErrorMessage(failure, "treatment"),
        }),
    });
  }

  return (
    <section className={`${panelClass} overflow-hidden !p-0`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd8] p-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            Treatments
          </h2>
          <p className="mt-1 text-sm text-[#806d63]">
            The services the clinic records at each visit. Changes show up on
            the clinic&apos;s scan screen straight away.
          </p>
        </div>
        {catalogue.data ? (
          <button
            type="button"
            onClick={() => open("new")}
            className="rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} className="mr-1 inline" />
            Add treatment
          </button>
        ) : null}
      </div>

      {editingId === "new" ? (
        <TreatmentForm
          key="new"
          idPrefix="treatment-new"
          initial={{ name: "", price: "", categoryId: "" }}
          usesCatalogue={usesCatalogue}
          categories={categories}
          categoriesFailed={categoriesQuery.isError}
          isPending={createMutation.isPending}
          serverError={errorFor("new")}
          submitLabel="Save"
          keepMissing={false}
          onSubmit={create}
          onCancel={() => open(null)}
        />
      ) : null}

      {catalogue.isPending ? (
        <p className="px-5 py-4 text-sm text-[#806d63]">Loading treatments...</p>
      ) : null}
      {catalogue.isError ? (
        <p role="alert" className="px-5 py-4 text-sm font-semibold text-[#b94135]">
          Could not load the treatments.
        </p>
      ) : null}
      {catalogue.data && items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[#806d63]">No treatments yet.</p>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#eadfd8] text-[10px] font-bold uppercase tracking-[0.16em] text-[#a47845]">
              <tr>
                <th scope="col" className="px-5 py-3">Name</th>
                <th scope="col" className="px-3 py-3">Price</th>
                {usesCatalogue ? (
                  <th scope="col" className="px-3 py-3">Category</th>
                ) : null}
                <th scope="col" className="px-3 py-3">Points</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((treatment) => {
                if (editingId === treatment.id) {
                  return (
                    <tr key={treatment.id}>
                      <td colSpan={usesCatalogue ? 5 : 4} className="p-0">
                        <TreatmentForm
                          idPrefix={`treatment-${treatment.id}`}
                          initial={{
                            name: treatment.name,
                            price: priceToText(treatment.priceEuro),
                            categoryId: treatment.categoryId ?? "",
                          }}
                          usesCatalogue={usesCatalogue}
                          categories={categories}
                          categoriesFailed={categoriesQuery.isError}
                          isPending={updateMutation.isPending}
                          serverError={errorFor(treatment.id)}
                          submitLabel="Save"
                          keepMissing={
                            treatment.priceEuro === null ||
                            (usesCatalogue && treatment.categoryId === null)
                          }
                          onSubmit={(values) => update(treatment, values)}
                          onCancel={() => open(null)}
                        />
                      </td>
                    </tr>
                  );
                }

                return (
                  <React.Fragment key={treatment.id}>
                    <tr className="border-b border-[#eadfd8] last:border-0">
                      <td className="px-5 py-3 font-semibold">{treatment.name}</td>
                      <td className="px-3 py-3">
                        {typeof treatment.priceEuro === "number"
                          ? formatEuros(treatment.priceEuro)
                          : "No price"}
                      </td>
                      {usesCatalogue ? (
                        <td className="px-3 py-3 text-[#806d63]">
                          {(treatment.categoryId &&
                            categoryLabels.get(treatment.categoryId)) ||
                            treatment.categoryId ||
                            "None"}
                        </td>
                      ) : null}
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">
                          {treatment.points.toLocaleString("en-GB")} points
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => open(treatment.id)}
                            className="text-[#9b633e]"
                            aria-label={`Edit ${treatment.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setError(null);
                              setConfirmingId(treatment.id);
                            }}
                            className="text-[#b94135]"
                            aria-label={`Delete ${treatment.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {confirmingId === treatment.id || errorFor(treatment.id) ? (
                      <tr className="border-b border-[#eadfd8]">
                        <td colSpan={usesCatalogue ? 5 : 4} className="px-5 pb-3">
                          {confirmingId === treatment.id ? (
                            <InlineConfirm
                              message={`Delete "${treatment.name}"? This cannot be undone.`}
                              confirmLabel="Yes, delete"
                              pendingLabel="Deleting..."
                              pending={deleteMutation.isPending}
                              onConfirm={() => remove(treatment)}
                              onCancel={() => {
                                setConfirmingId(null);
                                setError(null);
                              }}
                            />
                          ) : null}
                          {errorFor(treatment.id) ? (
                            <p role="alert" className="mt-2 text-sm font-semibold text-[#b94135]">
                              {errorFor(treatment.id)}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
