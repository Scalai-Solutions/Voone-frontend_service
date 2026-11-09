"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { BonoPlansEditor } from "@/components/shared/bono-plans-editor";
import { RequestIconButton } from "@/components/ui/request-icon-button";
import { ChangeRequestPanel } from "@/components/dashboard/change-request-panel";
import { useRestoreFocus } from "@/components/dashboard/use-restore-focus";
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
 * The centre's services. The owner or manager (`canRequest`) adds, edits and removes treatments
 * and bono plans themselves: a change is applied when saved and the backend keeps it as a
 * resolved ticket in Mis solicitudes. Anyone else sees the list without the buttons. With the
 * catalogue a category is part of a service; without it prices are whole euros and there is no
 * category.
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
  const focus = useRestoreFocus();
  const openPanel = (next: ActivePanel, trigger: HTMLElement) => {
    focus.remember(trigger);
    setActive(next);
  };

  const items = catalogue.data?.items ?? [];

  const panel = active ? (
    <ChangeRequestPanel
      key={`${active.area}-${active.id}-${active.context.kind}`}
      context={active.context}
      categories={categories}
      categoriesFailed={categoriesQuery.isError}
      onClose={() => {
        setActive(null);
        focus.restore();
      }}
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
              ? "Servicios disponibles para tu equipo y tu programa de fidelización. Puedes añadir, editar y eliminar tratamientos y bonos: el cambio se aplica al momento y queda registrado en Mis solicitudes."
              : "Servicios disponibles para tu equipo y tu programa de fidelización."}
          </p>
        </div>
        {canRequest && catalogue.data ? (
          <button
            type="button"
            onClick={(event) =>
              openPanel(
                {
                  id: "new",
                  area: "treatment",
                  context: { kind: "service-add", usesCatalogue },
                },
                event.currentTarget,
              )
            }
            className="rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} className="mr-1 inline" />
            Añadir tratamiento
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
                    <RequestIconButton
                      kind="edit"
                      subject={treatment.name}
                      onClick={(event) =>
                        openPanel(
                          {
                            id: treatment.id,
                            area: "treatment",
                            context: {
                              kind: "service-edit",
                              treatment: ref,
                              usesCatalogue,
                            },
                          },
                          event.currentTarget,
                        )
                      }
                    />
                    <RequestIconButton
                      kind="remove"
                      subject={treatment.name}
                      onClick={(event) =>
                        openPanel(
                          {
                            id: treatment.id,
                            area: "treatment",
                            context: { kind: "service-remove", treatment: ref },
                          },
                          event.currentTarget,
                        )
                      }
                    />
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
              onAdd: (trigger) =>
                openPanel(
                  { id: "new", area: "bono", context: { kind: "bono-add" } },
                  trigger,
                ),
              onEdit: (plan, trigger) =>
                openPanel(
                  {
                    id: plan.id,
                    area: "bono",
                    context: { kind: "bono-edit", plan: bonoRef(plan) },
                  },
                  trigger,
                ),
              onRemove: (plan, trigger) =>
                openPanel(
                  {
                    id: plan.id,
                    area: "bono",
                    context: { kind: "bono-remove", plan: bonoRef(plan) },
                  },
                  trigger,
                ),
              activePlanId: active?.area === "bono" ? active.id : null,
              panel,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
