"use client";

import * as React from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { Field } from "@/components/ui/field";
import { BonoPlansEditor } from "@/components/shared/bono-plans-editor";
import { useStaffBonoPlansStore } from "@/features/bonos/api/useBonos";
import {
  useCreateTreatment,
  useDeleteTreatment,
  useTreatmentCatalogue,
  useTreatmentCategories,
  useUpdateTreatment,
} from "@/features/treatments/api/useManageTreatments";
import {
  ApiError,
  type ManagedTreatment,
  type TreatmentCategory,
  type UpdateTreatmentInput,
} from "@/lib/api-client";

const formatNumber = (value: number) => value.toLocaleString("es-ES");

const inputClass =
  "h-11 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none focus:border-[#b8864b]";

/** What a person sees when a save or a removal fails. A 422's own message is Spanish copy for the form. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.detail) return error.detail;
    if (error.status === 404) return "No se ha encontrado ese tratamiento.";
    if (error.status === 403)
      return "No tienes permiso para cambiar los tratamientos.";
  }

  return "No se pudo guardar. Inténtalo de nuevo.";
}

type PriceResult = { value: number } | { error: string };

/**
 * Reads the price as typed. Accepts "60", "60,5" and "60.50". A dot followed by exactly three
 * digits is Spanish thousands grouping ("1.500" is 1500, "1.234,50" is 1234.5). The result is a
 * number, which is what the API wants. Centres on the catalogue may use cents; the others only whole euros.
 */
function parsePrice(raw: string, usesCatalogue: boolean): PriceResult {
  let text = raw.replace(/[\s€]/g, "");

  if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(text))
    text = text.replace(/\./g, "");

  if (!text) return { error: "Indica el precio." };
  if (!/^\d+([.,]\d+)?$/.test(text))
    return { error: "El precio debe ser un número, por ejemplo 60 o 60,50." };

  const value = Number(text.replace(",", "."));

  if (!Number.isFinite(value))
    return { error: "El precio debe ser un número, por ejemplo 60 o 60,50." };
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
    return { error: "El precio admite como máximo dos decimales." };
  }
  if (!usesCatalogue && !Number.isInteger(value)) {
    return { error: "El precio debe ser en euros enteros, sin céntimos." };
  }

  return { value };
}

const priceToText = (price: number | null) =>
  price === null ? "" : String(price).replace(".", ",");

interface TreatmentFormValues {
  name: string;
  price: string;
  categoryId: string;
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
}: {
  idPrefix: string;
  initial: TreatmentFormValues;
  usesCatalogue: boolean;
  categories: TreatmentCategory[];
  categoriesFailed: boolean;
  isPending: boolean;
  serverError: string | null;
  submitLabel: string;
  /** An old row missing a price or category may be edited without being given one: missing values stay as they are. */
  keepMissing: boolean;
  onSubmit: (values: TreatmentFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState(initial);
  const [errors, setErrors] = React.useState<{
    name?: string;
    price?: string;
    category?: string;
  }>({});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: typeof errors = {};

    if (!values.name.trim()) next.name = "Escribe el nombre del tratamiento.";

    if (!(keepMissing && !values.price.trim())) {
      const price = parsePrice(values.price, usesCatalogue);
      if ("error" in price) next.price = price.error;
    }

    if (usesCatalogue && !values.categoryId && !keepMissing)
      next.category = "Elige una categoría.";

    setErrors(next);

    if (Object.keys(next).length === 0)
      onSubmit({ ...values, name: values.name.trim() });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-3 border-b border-[#eadfd8] bg-[#fffaf6] p-5 md:grid-cols-[1.4fr_140px_1fr_auto]"
    >
      <Field label="Nombre" error={errors.name}>
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
        label={usesCatalogue ? "Precio (€)" : "Precio (€ enteros)"}
        error={errors.price}
      >
        <input
          id={`${idPrefix}-price`}
          inputMode="decimal"
          value={values.price}
          onChange={(event) =>
            setValues((current) => ({ ...current, price: event.target.value }))
          }
          placeholder={usesCatalogue ? "60,00" : "60"}
          className={inputClass}
        />
      </Field>
      {usesCatalogue ? (
        <Field
          label="Categoría"
          error={
            errors.category ??
            (categoriesFailed
              ? "No se pudieron cargar las categorías."
              : undefined)
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
            <option value="">Elige una categoría</option>
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
          className="inline-flex h-11 items-center rounded-xl bg-[#2d211e] px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save size={15} className="mr-1" />
          {isPending ? "Guardando..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center rounded-xl border border-[#cdb9aa] px-3 text-sm font-semibold text-[#754b36]"
          aria-label="Cancelar"
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
 * The centre's treatments: always listed, and editable by owners and managers. Which fields exist
 * depends on the centre: with the catalogue a category is required and prices may have cents;
 * without it prices are whole euros and there is no category.
 */
export function TreatmentsEditor({ canEdit }: { canEdit: boolean }) {
  const catalogue = useTreatmentCatalogue();
  const usesCatalogue = catalogue.data?.usesCatalogue ?? false;
  const categoriesQuery = useTreatmentCategories(usesCatalogue);
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const categoryLabels = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
  const createMutation = useCreateTreatment();
  const updateMutation = useUpdateTreatment();
  const deleteMutation = useDeleteTreatment();
  const bonoStore = useStaffBonoPlansStore();
  // "new", a treatment id (edit or removal), or null. The error shows next to that form or row.
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
    const price = parsePrice(values.price, usesCatalogue);
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
          setError({ scope: "new", text: messageFor(failure) }),
      },
    );
  }

  function update(treatment: ManagedTreatment, values: TreatmentFormValues) {
    // Only what changed goes in the request, so an unchanged price is never rewritten.
    const patch: UpdateTreatmentInput = {};

    if (values.name !== treatment.name) patch.name = values.name;

    if (values.price.trim()) {
      const price = parsePrice(values.price, usesCatalogue);
      if ("error" in price) return;
      if (price.value !== treatment.priceEuro) patch.priceEuro = price.value;
    }

    if (
      usesCatalogue &&
      values.categoryId &&
      values.categoryId !== treatment.categoryId
    ) {
      patch.categoryId = values.categoryId;
    }

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
          setError({ scope: treatment.id, text: messageFor(failure) }),
      },
    );
  }

  function remove(treatment: ManagedTreatment) {
    setError(null);
    deleteMutation.mutate(treatment.id, {
      onSuccess: () => setConfirmingId(null),
      onError: (failure) =>
        setError({ scope: treatment.id, text: messageFor(failure) }),
    });
  }

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-[#e2d5cc] bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd8] p-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold">
            Catálogo de tratamientos
          </h2>
          <p className="mt-1 text-sm text-[#927e72]">
            {canEdit
              ? "Los servicios que registra tu equipo en cada visita. Los cambios se ven al momento en la pantalla de escaneo."
              : "Servicios disponibles para tu equipo y tu programa de fidelización."}
          </p>
        </div>
        {canEdit && catalogue.data ? (
          <button
            type="button"
            onClick={() => open("new")}
            className="rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} className="mr-1 inline" />
            Añadir
          </button>
        ) : null}
      </div>

      {canEdit && editingId === "new" ? (
        <TreatmentForm
          key="new"
          idPrefix="treatment-new"
          initial={{ name: "", price: "", categoryId: "" }}
          usesCatalogue={usesCatalogue}
          categories={categories}
          categoriesFailed={categoriesQuery.isError}
          isPending={createMutation.isPending}
          serverError={errorFor("new")}
          submitLabel="Guardar"
          keepMissing={false}
          onSubmit={create}
          onCancel={() => open(null)}
        />
      ) : null}

      {catalogue.isPending ? (
        <p className="px-5 py-4 text-sm text-[#927e72]">
          Cargando tratamientos...
        </p>
      ) : null}
      {catalogue.isError ? (
        <p
          role="alert"
          className="px-5 py-4 text-sm font-semibold text-[#b94135]"
        >
          No se pudieron cargar los tratamientos.
        </p>
      ) : null}
      {catalogue.data && items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[#927e72]">
          Todavía no hay tratamientos.
        </p>
      ) : null}

      {items.map((treatment) => {
        if (canEdit && editingId === treatment.id) {
          return (
            <TreatmentForm
              key={treatment.id}
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
              submitLabel="Guardar"
              keepMissing={
                treatment.priceEuro === null ||
                (usesCatalogue && treatment.categoryId === null)
              }
              onSubmit={(values) => update(treatment, values)}
              onCancel={() => open(null)}
            />
          );
        }

        const categoryLabel =
          usesCatalogue && treatment.categoryId
            ? categoryLabels.get(treatment.categoryId)
            : undefined;
        const price =
          typeof treatment.priceEuro === "number"
            ? `Precio: ${formatNumber(treatment.priceEuro)} €`
            : "sin precio";

        return (
          <div
            key={treatment.id}
            className="border-b border-[#eadfd8] px-5 py-4 last:border-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{treatment.name}</p>
                <p className="mt-1 text-xs text-[#927e72]">
                  {categoryLabel ? `${price} · ${categoryLabel}` : price}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">
                  {formatNumber(treatment.points)} puntos
                </span>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => open(treatment.id)}
                    className="text-[#9b633e]"
                    aria-label={`Editar ${treatment.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setError(null);
                      setConfirmingId(treatment.id);
                    }}
                    className="text-[#b94135]"
                    aria-label={`Eliminar ${treatment.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            </div>
            {canEdit && confirmingId === treatment.id ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fff3ef] px-4 py-3 text-sm">
                <p className="font-semibold text-[#8a3a30]">
                  ¿Eliminar «{treatment.name}»? Esta acción no se puede
                  deshacer.
                </p>
                <button
                  type="button"
                  onClick={() => remove(treatment)}
                  disabled={deleteMutation.isPending}
                  className="rounded-full bg-[#b94135] px-4 py-1.5 font-semibold text-white disabled:opacity-60"
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingId(null);
                    setError(null);
                  }}
                  className="rounded-full border border-[#cdb9aa] px-4 py-1.5 font-semibold text-[#754b36]"
                >
                  Cancelar
                </button>
              </div>
            ) : null}
            {errorFor(treatment.id) && editingId !== treatment.id ? (
              <p
                role="alert"
                className="mt-2 text-sm font-semibold text-[#b94135]"
              >
                {errorFor(treatment.id)}
              </p>
            ) : null}
          </div>
        );
      })}

      {canEdit ? (
        <div className="border-t border-[#eadfd8] p-5">
          <BonoPlansEditor store={bonoStore} />
        </div>
      ) : null}
    </div>
  );
}
