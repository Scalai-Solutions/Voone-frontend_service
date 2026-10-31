"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { BonoPlansEditor } from "@/components/shared/bono-plans-editor";
import { ChangeRequestPanel } from "@/components/dashboard/change-request-panel";
import { useStaffBonoPlansStore } from "@/features/bonos/api/useBonos";
import {
  useTreatmentCatalogue,
  useTreatmentCategories,
} from "@/features/treatments/api/useManageTreatments";
import type { BonoPlanRow } from "@/lib/bono-api";
import type { BonoRef, RequestContext } from "@/lib/change-request-form";
import { formatEuros } from "@/lib/euros";

const formatNumber = (value: number) => value.toLocaleString("es-ES");

const bonoRef = (plan: BonoPlanRow): BonoRef => ({
  id: plan.id,
  name: plan.name,
  totalEuro: plan.totalEuro,
  totalSessions: plan.totalSessions,
});

/** Which request panel is open: one at a time across treatments and bonos. */
interface ActivePanel {
  /** "new" for a new service or bono, otherwise the id of the row it belongs to. */
  id: string;
  area: "treatment" | "bono";
  context: RequestContext;
}

/**
 * The centre's services, read-only: treatments and bono plans are the price list the loyalty
 * programme is built on, so the centre changes them by asking Voone (a change request that
 * Voone resolves) rather than editing. `canRequest` is the owner or manager; anyone else sees
 * the list without the buttons. With the catalogue a category is part of a service; without it
 * prices are whole euros and there is no category.
 */
export function TreatmentsEditor({
  canEdit,
  canRequest,
}: {
  /** May see the bono plans too (the permission that opens My Center). */
  canEdit: boolean;
  canRequest: boolean;
}) {
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
  const bonoStore = useStaffBonoPlansStore();
  const [active, setActive] = React.useState<ActivePanel | null>(null);

  const items = catalogue.data?.items ?? [];

  const panel = active ? (
    <ChangeRequestPanel
      key={`${active.area}-${active.id}-${active.context.kind}`}
      context={active.context}
      categories={categories}
      categoriesFailed={categoriesQuery.isError}
      onClose={() => setActive(null)}
    />
  ) : null;

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-[#e2d5cc] bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd8] p-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold">
            Catálogo de tratamientos
          </h2>
          <p className="mt-1 text-sm text-[#927e72]">
            {canRequest
              ? "Servicios disponibles para tu equipo y tu programa de fidelización. Para cambiarlos, solicita un cambio a Voone."
              : "Servicios disponibles para tu equipo y tu programa de fidelización."}
          </p>
        </div>
        {canRequest && catalogue.data ? (
          <button
            type="button"
            onClick={() =>
              setActive({
                id: "new",
                area: "treatment",
                context: { kind: "service-add", usesCatalogue },
              })
            }
            className="rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} className="mr-1 inline" />
            Solicitar nuevo servicio
          </button>
        ) : null}
      </div>

      {active?.area === "treatment" && active.id === "new" ? (
        <div className="border-b border-[#eadfd8]">{panel}</div>
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
        const categoryLabel =
          usesCatalogue && treatment.categoryId
            ? categoryLabels.get(treatment.categoryId)
            : undefined;
        const price =
          typeof treatment.priceEuro === "number"
            ? `Precio: ${formatEuros(treatment.priceEuro)}`
            : "sin precio";
        const ref = {
          id: treatment.id,
          name: treatment.name,
          priceEuro: treatment.priceEuro,
          categoryId: treatment.categoryId,
        };

        return (
          <div
            key={treatment.id}
            className="border-b border-[#eadfd8] last:border-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold">{treatment.name}</p>
                <p className="mt-1 text-xs text-[#927e72]">
                  {categoryLabel ? `${price} · ${categoryLabel}` : price}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">
                  {formatNumber(treatment.points)} puntos
                </span>
                {canRequest ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActive({
                          id: treatment.id,
                          area: "treatment",
                          context: {
                            kind: "service-edit",
                            treatment: ref,
                            usesCatalogue,
                          },
                        })
                      }
                      className="text-xs font-semibold text-[#9b633e] underline-offset-2 hover:underline"
                      aria-label={`Solicitar cambio en ${treatment.name}`}
                    >
                      Solicitar cambio
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActive({
                          id: treatment.id,
                          area: "treatment",
                          context: { kind: "service-remove", treatment: ref },
                        })
                      }
                      className="text-xs font-semibold text-[#b94135] underline-offset-2 hover:underline"
                      aria-label={`Solicitar baja de ${treatment.name}`}
                    >
                      Solicitar baja
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {active?.area === "treatment" && active.id === treatment.id ? (
              <div className="border-t border-[#eadfd8]">{panel}</div>
            ) : null}
          </div>
        );
      })}

      {canEdit ? (
        <div className="border-t border-[#eadfd8] p-5">
          <BonoPlansEditor
            store={bonoStore}
            requests={{
              enabled: canRequest,
              onAdd: () =>
                setActive({
                  id: "new",
                  area: "bono",
                  context: { kind: "bono-add" },
                }),
              onEdit: (plan) =>
                setActive({
                  id: plan.id,
                  area: "bono",
                  context: { kind: "bono-edit", plan: bonoRef(plan) },
                }),
              onRemove: (plan) =>
                setActive({
                  id: plan.id,
                  area: "bono",
                  context: { kind: "bono-remove", plan: bonoRef(plan) },
                }),
              activePlanId: active?.area === "bono" ? active.id : null,
              panel,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
