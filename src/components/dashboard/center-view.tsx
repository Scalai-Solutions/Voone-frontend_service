"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import type { Clinic, MilestoneRewardsInput, TierRewardInput, Treatment } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CenterViewProps {
  treatments?: Treatment[];
  canEdit: boolean;
}

type CenterTab = "tratamientos" | "recompensas" | "niveles" | "informacion";

interface SetupItem {
  id: string;
  name: string;
  detail: string;
  value: string;
}

const EMPTY_TREATMENTS: Treatment[] = [];

const ownerEmailFor = (clinic: Clinic) =>
  clinic.users.find((user) => user.role.toUpperCase() === "OWNER")?.email ??
  clinic.users[0]?.email;

const formatNumber = (value: number) => value.toLocaleString("es-ES");

function toTreatmentRows(treatments: Treatment[]): SetupItem[] {
  return treatments.map((treatment) => ({
    id: treatment.id,
    name: treatment.name,
    detail: typeof treatment.priceEuro === "number" ? `Precio: ${formatNumber(treatment.priceEuro)} euro` : "Precio no configurado",
    value: `${formatNumber(treatment.points)} puntos`,
  }));
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
      value: `${formatNumber(milestone.pointsToNextMilestone)} puntos`,
    },
    {
      id: "points-conversion",
      name: "Conversión de puntos",
      detail: `Por cada ${formatNumber(milestone.priceAmount)} euro`,
      value: `${formatNumber(milestone.pointsAwarded)} puntos`,
    },
  ];
}

function toClinicDetails(clinic: Clinic | undefined): Array<{ label: string; value: string }> {
  if (!clinic) return [];

  const ownerEmail = ownerEmailFor(clinic);

  return [
    { label: "Nombre comercial", value: clinic.name },
    { label: "Identificador público", value: clinic.slug },
    { label: "Dirección", value: clinic.addressLine },
    { label: "Código postal", value: clinic.pincode },
    ...(ownerEmail ? [{ label: "Email propietario", value: ownerEmail }] : []),
    { label: "Programa Wallet", value: clinic.template?.programName ?? "Sin plantilla Wallet" },
    { label: "Plan Voone", value: clinic.voonePlan },
    { label: "Aviso de privacidad", value: clinic.privacyPolicyVersion },
    {
      label: "Notificaciones disponibles",
      value: `${formatNumber(clinic.notificationsRemainingThisMonth)} de ${formatNumber(clinic.notificationsMonthlyQuota)}`,
    },
  ];
}

export function CenterView({ treatments = EMPTY_TREATMENTS, canEdit }: CenterViewProps) {
  const currentClinic = useCurrentClinic();
  const clinic = currentClinic.data;
  const [tab, setTab] = React.useState<CenterTab>("tratamientos");
  const treatmentRowsFromClinic = React.useMemo(() => toTreatmentRows(clinic?.treatments ?? treatments), [clinic?.treatments, treatments]);
  const rewardRowsFromClinic = React.useMemo(() => toRewardRows(clinic?.template?.tierRewards), [clinic?.template?.tierRewards]);
  const tierRowsFromClinic = React.useMemo(() => toTierRows(clinic?.template?.milestoneRewards), [clinic?.template?.milestoneRewards]);
  const clinicDetails = React.useMemo(() => toClinicDetails(clinic), [clinic]);
  const treatmentRowsKey = React.useMemo(() => rowsKey(treatmentRowsFromClinic), [treatmentRowsFromClinic]);
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
        <button type="button" onClick={() => setTab("informacion")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "informacion" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Información del centro</button>
      </div>

      {tab === "tratamientos" ? <SetupList key={`treatments-${treatmentRowsKey}`} title="Catálogo de tratamientos" description="Servicios disponibles para tu equipo y tu programa de fidelización." valueLabel="Puntos" initialRows={treatmentRowsFromClinic} canEdit={canEdit} isLoading={currentClinic.isPending} /> : null}
      {tab === "recompensas" ? <SetupList key={`rewards-${rewardRowsKey}`} title="Recompensas" description="Premios y beneficios creados durante el onboarding." valueLabel="Valor" initialRows={rewardRowsFromClinic} canEdit={canEdit} isLoading={currentClinic.isPending} /> : null}
      {tab === "niveles" ? <SetupList key={`tiers-${tierRowsKey}`} title="Niveles" description="Tiers del programa y requisitos de acceso." valueLabel="Requisito" initialRows={tierRowsFromClinic} canEdit={canEdit} isLoading={currentClinic.isPending} /> : null}

      {tab === "informacion" ? (
        <div className="mt-4 rounded-3xl border border-[#e2d5cc] bg-white/80 p-6">
          <h2 className="font-serif text-2xl font-semibold">Información del centro</h2>
          {clinicDetails.length > 0 ? (
            <div className="mt-5 grid gap-x-20 gap-y-5 sm:grid-cols-2">
              {clinicDetails.map((detail) => (
                <div key={detail.label}>
                  <p className="text-xs text-[#927e72]">{detail.label}</p>
                  <p className="mt-1 font-semibold">{detail.value}</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 text-sm text-[#927e72]">Cargando la información guardada durante el onboarding...</p>}
          {canEdit ? <Link href="/dashboard/settings" className="mt-6 inline-flex rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]">Editar información</Link> : null}
        </div>
      ) : null}
    </section>
  );
}

function rowsKey(rows: SetupItem[]) {
  return rows.map((row) => `${row.id}:${row.name}:${row.detail}:${row.value}`).join("|") || "empty";
}

function SetupList({ title, description, valueLabel, initialRows, canEdit, isLoading }: { title: string; description: string; valueLabel: string; initialRows: SetupItem[]; canEdit: boolean; isLoading: boolean }) {
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

      {rows.length > 0 ? rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd8] px-5 py-4 last:border-0">
          <div>
            <p className="font-semibold">{row.name}</p>
            <p className="mt-1 text-xs text-[#927e72]">{row.detail}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{row.value}</span>
            {canEdit ? <button type="button" onClick={() => startEdit(row)} className="text-[#9b633e]" aria-label={`Editar ${row.name}`}><Pencil size={15} /></button> : null}
            {canEdit ? <button type="button" onClick={() => setRows((currentRows) => currentRows.filter((item) => item.id !== row.id))} className="text-[#b94135]" aria-label={`Eliminar ${row.name}`}><Trash2 size={15} /></button> : null}
          </div>
        </div>
      )) : <p className="px-5 py-4 text-sm text-[#927e72]">{isLoading ? "Cargando datos guardados durante el onboarding..." : "No hay datos guardados para esta sección."}</p>}
    </div>
  );
}
