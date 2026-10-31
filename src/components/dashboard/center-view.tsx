"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import { useStaffProgram } from "@/features/program/api/useStaffProgram";
import { TreatmentsEditor } from "@/components/dashboard/treatments-editor";
import type { MilestoneRewardsInput, TierRewardInput } from "@/lib/api-client";
import type { PresentedProgram } from "@/lib/onboarding-api";
import { toPoints, formatEuros } from "@/lib/points";
import { cn } from "@/lib/utils";

interface CenterViewProps {
  canEdit: boolean;
}

type CenterTab = "tratamientos" | "recompensas" | "niveles" | "tarjeta";

interface SetupItem {
  id: string;
  name: string;
  detail: string;
  value: string;
  /**
   * A second right-hand figure (levels: the euros a client has spent), shown as its own column
   * whenever the list renders one. Absent on single-column lists.
   */
  secondValue?: string;
}

const formatNumber = (value: number) => value.toLocaleString("es-ES");

/**
 * The live programme's rewards and perks, in the order a client reaches them. Tier-ups are the Niveles tab's.
 *
 * The right column is what the client has spent by the time she reaches the step (`realSpend`), in
 * euros — not points, and not the engine's `threshold`, which is internal progress and diverges
 * from real spend once the upper tiers multiply it.
 */
function programRewardRows(program: PresentedProgram): SetupItem[] {
  return program.ladder
    .filter((step) => step.type !== "nivel")
    .map((step) => {
      const name = step.reward?.name ?? step.perk?.name ?? `Paso ${step.n}`;
      const detail = step.perk?.description || step.reward?.items.map((item) => item.name).join(", ") || "Sin descripción guardada";

      return {
        id: `program-step-${step.n}`,
        name,
        detail,
        value: formatEuros(step.realSpend),
      };
    });
}

/**
 * A tier's floor is the PROGRESS at which the ladder promotes a member, which is the `threshold` of
 * the "nivel" step for that tier. `PresentedTier.threshold` is real spend (what a client has paid),
 * not progress, so it would show the upper levels too low. The first tier has no promotion step: it
 * starts at zero. Three columns, like the other tabs: the level with its perks, the card's points
 * when the promotion happens (`threshold` ×10) and what the client has actually paid to get there
 * (`realSpend`) — the two diverge in the upper tiers, whose progress runs ahead of their spend.
 */
function programTierRows(program: PresentedProgram): SetupItem[] {
  return program.tiers.map((tier) => {
    const promotion = program.ladder.find((step) => step.type === "nivel" && step.tier?.key === tier.key);
    const floorPoints = promotion ? toPoints(promotion.threshold) : 0;
    const floorSpend = promotion ? promotion.realSpend : 0;

    return {
      id: `program-tier-${tier.key}`,
      name: tier.label,
      detail: tier.benefits.length > 0 ? tier.benefits.join(" · ") : "Sin ventajas adicionales",
      value: formatNumber(floorPoints),
      secondValue: formatEuros(floorSpend),
    };
  });
}

function toRewardRows(rewards: TierRewardInput[] | undefined): SetupItem[] {
  return (rewards ?? []).map((reward, index) => ({
    id: `reward-${index}-${reward.name}`,
    name: reward.name,
    detail: reward.rewardText?.trim() || "Sin descripción guardada",
    value: "Nivel",
  }));
}

function toTierRows(milestone: MilestoneRewardsInput | undefined): SetupItem[] {
  if (!milestone) return [];

  return [
    {
      id: "milestone-count",
      name: "Hitos configurados",
      detail: "Número de hitos del programa",
      value: formatNumber(milestone.milestoneCount),
    },
    {
      id: "points-to-next-milestone",
      name: "Siguiente hito",
      detail: "Puntos necesarios para alcanzar el siguiente hito",
      value: `${formatNumber(milestone.pointsToNextMilestone)} puntos · ${formatEuros(milestone.pointsToNextMilestone / 10)}`,
    },
    {
      id: "points-conversion",
      name: "Conversión de puntos",
      detail: `Por cada ${formatNumber(milestone.priceAmount)} €`,
      value: `${formatNumber(milestone.pointsAwarded)} puntos`,
    },
  ];
}

export function CenterView({ canEdit }: CenterViewProps) {
  const currentClinic = useCurrentClinic();
  const clinic = currentClinic.data;
  const [tab, setTab] = React.useState<CenterTab>("tratamientos");
  // A centre with a live programme reads its rewards and levels from it; a 404 (null) means it is still
  // on the card design's own figures, which stay as the fallback.
  const staffProgram = useStaffProgram();
  const liveProgram = staffProgram.data?.program ?? null;
  const rewardRowsFromClinic = React.useMemo(() => liveProgram ? programRewardRows(liveProgram) : toRewardRows(clinic?.template?.tierRewards), [liveProgram, clinic?.template?.tierRewards]);
  const tierRowsFromClinic = React.useMemo(() => liveProgram ? programTierRows(liveProgram) : toTierRows(clinic?.template?.milestoneRewards), [liveProgram, clinic?.template?.milestoneRewards]);
  const programLoading = staffProgram.isPending;
  // Only a 404 (null above) means "no live programme". Any other failure is shown, not papered over
  // with the card design's figures, which may not match what the centre actually runs.
  const programFailed = staffProgram.isError;
  const rewardRowsKey = React.useMemo(() => rowsKey(rewardRowsFromClinic), [rewardRowsFromClinic]);
  const tierRowsKey = React.useMemo(() => rowsKey(tierRowsFromClinic), [tierRowsFromClinic]);

  return (
    <section className="text-[#2e2421]">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Configuración del negocio</p>
      <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">Mi centro</h1>
      <p className="mt-3 max-w-xl text-[#927e72]">Toda la información de tu negocio, en un solo lugar.</p>

      {currentClinic.isError ? <p className="mt-4 rounded-2xl border border-[#ead0bd] bg-[#fff8f2] px-4 py-3 text-sm font-semibold text-[#8a4d2a]">No se pudieron cargar los datos del centro.</p> : null}

      <div className="mt-7 flex flex-wrap gap-1 rounded-2xl border border-[#e2d5cc] bg-white/60 p-1">
        <button type="button" onClick={() => setTab("tratamientos")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "tratamientos" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Tratamientos</button>
        <button type="button" onClick={() => setTab("recompensas")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "recompensas" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Recompensas</button>
        <button type="button" onClick={() => setTab("niveles")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "niveles" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Niveles</button>
        {canEdit && clinic?.template?.id ? <button type="button" onClick={() => setTab("tarjeta")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "tarjeta" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Tarjeta Wallet</button> : null}
      </div>

      {tab === "tratamientos" ? <TreatmentsEditor canEdit={canEdit} /> : null}
      {tab === "recompensas" ? (programFailed ? <ProgramLoadError /> : <SetupList key={`rewards-${rewardRowsKey}`} title="Recompensas" description="Premios y beneficios de tu programa de fidelización. Para cambiarlos, contacta con Voone." nameLabel="Premio o ventaja" valueLabel="Total gastado por la clienta" initialRows={rewardRowsFromClinic} canEdit={false} isLoading={currentClinic.isPending || programLoading} />) : null}
      {tab === "niveles" ? (programFailed ? <ProgramLoadError /> : <SetupList key={`tiers-${tierRowsKey}`} title="Niveles" description="Niveles del programa y requisitos de acceso. Para cambiarlos, contacta con Voone." nameLabel="Nivel" valueLabel={liveProgram ? "Puntos" : "Requisito (gasto · puntos)"} secondValueLabel={liveProgram ? "Total gastado" : undefined} initialRows={tierRowsFromClinic} canEdit={false} isLoading={currentClinic.isPending || programLoading} />) : null}

      {tab === "tarjeta" && clinic?.template?.id ? (
        <div className="mt-4 rounded-3xl border border-[#e2d5cc] bg-white/80 p-6">
          <h2 className="font-serif text-2xl font-semibold">Tarjeta Wallet</h2>
          <p className="mt-2 max-w-xl text-sm text-[#927e72]">Cambia el logo, la imagen, los colores y los textos de la tarjeta. Al guardar, las tarjetas que ya tienen tus clientes se actualizan solas.</p>
          <Link href={`/dashboard/templates/${clinic.template.id}`} className="mt-5 inline-flex rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white">Editar el diseño de la tarjeta</Link>
        </div>
      ) : null}
    </section>
  );
}

function ProgramLoadError() {
  return <p role="alert" className="mt-4 rounded-2xl border border-[#ead0bd] bg-[#fff8f2] px-4 py-3 text-sm font-semibold text-[#8a4d2a]">No se ha podido cargar el programa.</p>;
}

function rowsKey(rows: SetupItem[]) {
  return rows.map((row) => `${row.id}:${row.name}:${row.detail}:${row.value}:${row.secondValue ?? ""}`).join("|") || "empty";
}

function SetupList({ title, description, nameLabel, valueLabel, secondValueLabel, initialRows, canEdit, isLoading }: { title: string; description: string; nameLabel: string; valueLabel: string; secondValueLabel?: string; initialRows: SetupItem[]; canEdit: boolean; isLoading: boolean }) {
  const emptyDraft = { name: "", detail: "", value: "" };
  const [rows, setRows] = React.useState(initialRows);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState(emptyDraft);

  function startAdd() {
    setEditingId("new");
    setDraft(emptyDraft);
  }

  function startEdit(row: SetupItem) {
    setEditingId(row.id);
    setDraft({ name: row.name, detail: row.detail, value: row.value });
  }

  function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextItem = {
      id: editingId === "new" ? `setup-${Date.now()}` : editingId ?? `setup-${Date.now()}`,
      name: draft.name.trim(),
      detail: draft.detail.trim(),
      value: draft.value.trim(),
    };

    if (!nextItem.name || !nextItem.detail || !nextItem.value) return;

    setRows((currentRows) => editingId === "new" ? [nextItem, ...currentRows] : currentRows.map((row) => row.id === editingId ? nextItem : row));
    setEditingId(null);
    setDraft(emptyDraft);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-[#e2d5cc] bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd8] p-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[#927e72]">{description}</p>
        </div>
        {canEdit ? <button type="button" onClick={startAdd} className="rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"><Plus size={15} className="mr-1 inline" />Añadir</button> : null}
      </div>

      {canEdit && editingId ? (
        <form onSubmit={saveItem} className="grid gap-3 border-b border-[#eadfd8] bg-[#fffaf6] p-5 md:grid-cols-[1fr_1.2fr_160px_auto]">
          <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-11 rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none focus:border-[#b8864b]" />
          <input value={draft.detail} onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))} placeholder="Descripción" className="h-11 rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none focus:border-[#b8864b]" />
          <input value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} placeholder={valueLabel} className="h-11 rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none focus:border-[#b8864b]" />
          <div className="flex gap-2">
            <button type="submit" className="inline-flex h-11 items-center rounded-xl bg-[#2d211e] px-3 text-sm font-semibold text-white"><Save size={15} className="mr-1" />Guardar</button>
            <button type="button" onClick={() => setEditingId(null)} className="inline-flex h-11 items-center rounded-xl border border-[#cdb9aa] px-3 text-sm font-semibold text-[#754b36]" aria-label="Cancelar"><X size={15} /></button>
          </div>
        </form>
      ) : null}

      {/* The header and every row share one grid, so each column keeps its own width however
          long a description grows: the level and its perks wrap inside the first column (60%),
          and the figures never drop below. The second value column (levels: total spent)
          renders only when the list has one. */}
      <div className={cn(
        "grid items-center gap-3 bg-[#faf5f0] px-5 py-2",
        secondValueLabel
          ? "grid-cols-[minmax(0,60fr)_minmax(0,20fr)_minmax(0,20fr)]"
          : "grid-cols-[minmax(0,60fr)_minmax(0,40fr)]",
      )}>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{nameLabel}</span>
        <span className="text-right text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{valueLabel}</span>
        {secondValueLabel ? <span className="text-right text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{secondValueLabel}</span> : null}
      </div>

      {rows.length > 0 ? rows.map((row) => (
        <div key={row.id} className={cn(
          "grid items-center gap-3 border-b border-[#eadfd8] px-5 py-4 last:border-0",
          secondValueLabel
            ? "grid-cols-[minmax(0,60fr)_minmax(0,20fr)_minmax(0,20fr)]"
            : "grid-cols-[minmax(0,60fr)_minmax(0,40fr)]",
        )}>
          {/* The name and description wrap inside their own column, never pushing the figures out of theirs. */}
          <div className="min-w-0">
            <p className="break-words font-semibold">{row.name}</p>
            <p className="mt-1 break-words text-xs leading-5 text-[#927e72]">{row.detail}</p>
          </div>
          {secondValueLabel ? (
            <>
              {/* The card's points, at the right edge of their own column. */}
              <p className="justify-self-end break-words text-right text-sm font-semibold">{row.value}</p>
              {/* The euros as the pill, at the right edge of theirs. */}
              <div className="flex items-center justify-end gap-2">
                <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{row.secondValue ?? "—"}</span>
                {canEdit ? <button type="button" onClick={() => startEdit(row)} className="text-[#9b633e]" aria-label={`Editar ${row.name}`}><Pencil size={15} /></button> : null}
                {canEdit ? <button type="button" onClick={() => setRows((currentRows) => currentRows.filter((item) => item.id !== row.id))} className="text-[#b94135]" aria-label={`Eliminar ${row.name}`}><Trash2 size={15} /></button> : null}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{row.value}</span>
              {canEdit ? <button type="button" onClick={() => startEdit(row)} className="text-[#9b633e]" aria-label={`Editar ${row.name}`}><Pencil size={15} /></button> : null}
              {canEdit ? <button type="button" onClick={() => setRows((currentRows) => currentRows.filter((item) => item.id !== row.id))} className="text-[#b94135]" aria-label={`Eliminar ${row.name}`}><Trash2 size={15} /></button> : null}
            </div>
          )}
        </div>
      )) : <p className="px-5 py-4 text-sm text-[#927e72]">{isLoading ? "Cargando datos guardados durante el onboarding..." : "No hay datos guardados para esta sección."}</p>}
    </div>
  );
}
