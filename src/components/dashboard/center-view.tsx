"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import type { Treatment } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CenterViewProps {
  treatments: Treatment[];
  canEdit: boolean;
}

type CenterTab = "tratamientos" | "recompensas" | "niveles" | "informacion";

interface SetupItem {
  id: string;
  name: string;
  detail: string;
  value: string;
}

const clinicDetails = [
  { label: "Nombre comercial", value: "Clínica Aurea" },
  { label: "Razón social", value: "Aurea Beauty S.L." },
  { label: "CIF", value: "B-72938410" },
  { label: "Dirección", value: "Calle Serrano 42, 28001 Madrid" },
  { label: "Teléfono", value: "+34 910 240 118" },
  { label: "Persona de contacto", value: "Ana López · Directora" },
  { label: "Tiempo como miembro", value: "2 años y 6 meses" },
  { label: "Número de cuenta", value: "ES12 3456 7890 1234 5678" },
  { label: "Email", value: "hola@clinicaaurea.com" },
];

const fallbackTreatments = [
  { id: "hydrafacial", name: "Hydrafacial", points: 120, description: "Limpieza profunda y luminosidad" },
  { id: "laser", name: "Sesión láser", points: 220, description: "Tratamiento facial avanzado" },
  { id: "consult", name: "Consulta inicial", points: 60, description: "Valoración personalizada" },
  { id: "peel", name: "Peeling químico", points: 90, description: "Renovación y cuidado de la piel" },
];

const descriptionsByName: Record<string, string> = {
  Hydrafacial: "Limpieza profunda y luminosidad",
  "Sesión láser": "Tratamiento facial avanzado",
  Consulta: "Valoración personalizada",
  "Consulta inicial": "Valoración personalizada",
  Peeling: "Renovación y cuidado de la piel",
  "Peeling químico": "Renovación y cuidado de la piel",
};

const initialRewards: SetupItem[] = [
  { id: "reward-birthday", name: "Crédito de cumpleaños", detail: "Beneficio automático para miembros activos", value: "80 puntos" },
  { id: "reward-referral", name: "Bono por referido", detail: "Se concede tras la primera visita de la persona referida", value: "100 puntos" },
  { id: "reward-vip", name: "Revisión VIP", detail: "Recompensa canjeable para clientes Diamond", value: "1 sesión" },
];

const initialTiers: SetupItem[] = [
  { id: "tier-silver", name: "Silver", detail: "Acceso base al programa y saldo Wallet", value: "0 puntos" },
  { id: "tier-gold", name: "Gold", detail: "Reservas prioritarias y bonos de campaña", value: "1.000 puntos" },
  { id: "tier-diamond", name: "Diamond", detail: "Acceso completo a ventajas premium", value: "2.000 puntos" },
];

function toTreatmentRows(treatments: Treatment[]): SetupItem[] {
  const rows = treatments.length > 0 ? treatments : fallbackTreatments;

  return rows.map((treatment) => {
    const displayName = treatment.name === "Consulta" ? "Consulta inicial" : treatment.name === "Peeling" ? "Peeling químico" : treatment.name;
    const detail = "description" in treatment && typeof treatment.description === "string" ? treatment.description : descriptionsByName[treatment.name] ?? "Servicio disponible para acreditación de puntos";

    return {
      id: treatment.id,
      name: displayName,
      detail,
      value: `${treatment.points} puntos`,
    };
  });
}

export function CenterView({ treatments, canEdit }: CenterViewProps) {
  const [tab, setTab] = React.useState<CenterTab>("tratamientos");
  const initialTreatmentRows = React.useMemo(() => toTreatmentRows(treatments), [treatments]);
  const [treatmentRows, setTreatmentRows] = React.useState<SetupItem[]>(initialTreatmentRows);
  const [rewardRows, setRewardRows] = React.useState<SetupItem[]>(initialRewards);
  const [tierRows, setTierRows] = React.useState<SetupItem[]>(initialTiers);

  return (
    <section className="text-[#2e2421]">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Configuración del negocio</p>
      <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">Mi centro</h1>
      <p className="mt-3 max-w-xl text-[#927e72]">Toda la información de tu negocio, en un solo lugar.</p>

      <div className="mt-7 flex flex-wrap gap-1 rounded-2xl border border-[#e2d5cc] bg-white/60 p-1">
        <button type="button" onClick={() => setTab("tratamientos")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "tratamientos" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Tratamientos</button>
        <button type="button" onClick={() => setTab("recompensas")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "recompensas" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Recompensas</button>
        <button type="button" onClick={() => setTab("niveles")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "niveles" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Niveles</button>
        <button type="button" onClick={() => setTab("informacion")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "informacion" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Información del centro</button>
      </div>

      {tab === "tratamientos" ? <SetupList title="Catálogo de tratamientos" description="Servicios disponibles para tu equipo y tu programa de fidelización." valueLabel="Puntos" rows={treatmentRows} setRows={setTreatmentRows} canEdit={canEdit} /> : null}
      {tab === "recompensas" ? <SetupList title="Recompensas" description="Premios y beneficios creados durante el onboarding." valueLabel="Valor" rows={rewardRows} setRows={setRewardRows} canEdit={canEdit} /> : null}
      {tab === "niveles" ? <SetupList title="Niveles" description="Tiers del programa y requisitos de acceso." valueLabel="Requisito" rows={tierRows} setRows={setTierRows} canEdit={canEdit} /> : null}

      {tab === "informacion" ? (
        <div className="mt-4 rounded-3xl border border-[#e2d5cc] bg-white/80 p-6">
          <h2 className="font-serif text-2xl font-semibold">Información del centro</h2>
          <div className="mt-5 grid gap-x-20 gap-y-5 sm:grid-cols-2">
            {clinicDetails.map((detail) => (
              <div key={detail.label}>
                <p className="text-xs text-[#927e72]">{detail.label}</p>
                <p className="mt-1 font-semibold">{detail.value}</p>
              </div>
            ))}
          </div>
          {canEdit ? <Link href="/dashboard/settings" className="mt-6 inline-flex rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]">Editar información</Link> : null}
        </div>
      ) : null}
    </section>
  );
}

function SetupList({ title, description, valueLabel, rows, setRows, canEdit }: { title: string; description: string; valueLabel: string; rows: SetupItem[]; setRows: React.Dispatch<React.SetStateAction<SetupItem[]>>; canEdit: boolean }) {
  const emptyDraft = { name: "", detail: "", value: "" };
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

      {rows.map((row) => (
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
      ))}
    </div>
  );
}
