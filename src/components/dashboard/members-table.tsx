"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, MapPin, Pencil, Plus, Search, SlidersHorizontal, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/page-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { getMembers, type Member } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const audienceRows = [
  { name: "Mujeres · 25-40 · Madrid", criteria: "Sexo · Edad · Ubicación", count: 84, updated: "Hoy" },
  { name: "Clientes Diamond", criteria: "Nivel", count: 32, updated: "Ayer" },
  { name: "Sin visita · 90 días", criteria: "Actividad", count: 47, updated: "12 sep" },
];

const profileByMember: Record<string, { sex: string; age: number; city: string }> = {
  "MEM-1048": { sex: "Mujer", age: 29, city: "Madrid" },
  "MEM-2033": { sex: "Hombre", age: 34, city: "Valencia" },
  "MEM-3110": { sex: "Mujer", age: 41, city: "Barcelona" },
};

const tierColors: Record<string, string> = {
  Gold: "bg-[#f2d09a] text-[#68451f]",
  Diamond: "bg-[#c9d7e5] text-[#30465d]",
  Silver: "bg-[#d8d8d4] text-[#4d4e4a]",
  Nuevo: "bg-[#eadfd8] text-[#6f5c53]",
};

export function MembersTable() {
  const [tab, setTab] = React.useState<"personas" | "audiencias">("personas");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("all");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const members = useQuery({ queryKey: ["members"], queryFn: getMembers });

  if (members.isLoading) {
    return <Skeleton className="h-72 w-full rounded-[28px]" />;
  }

  if (members.error) {
    return <div className="rounded-[24px] border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">No se pudieron cargar los miembros. Revisa la conexión con la API e inténtalo de nuevo.</div>;
  }

  if (!members.data?.length) {
    return <EmptyState title="Aún no hay miembros" message="Añade el primer miembro y envíale un pase Wallet desde recepción." action={{ href: "/dashboard/members/new", label: "Añadir persona" }} />;
  }

  const tiers = Array.from(new Set(members.data.map((member) => member.tier)));
  const filteredMembers = members.data.filter((member) => {
    const searchable = `${member.name} ${member.id} ${member.identity} ${member.templateName} ${member.tier}`.toLowerCase();
    const matchesSearch = searchable.includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "all" || member.tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  return (
    <section className="space-y-6 text-[#2e2421]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#b7874a]">CRM de fidelización</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">Miembros</h1>
        </div>
        <Link href="/dashboard/members/new" className="inline-flex items-center gap-2 rounded-full bg-[#b8864b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9e6d3d]">
          <Plus size={17} /> Añadir persona
        </Link>
      </div>

      <div className="flex gap-2 border-b border-[#ded1c8]">
        <button onClick={() => setTab("personas")} className={cn("rounded-t-xl px-5 py-3 text-sm font-semibold", tab === "personas" ? "border-b-2 border-[#9e6740] text-[#75462f]" : "text-[#927e72]")}> 
          <Users size={16} className="mr-2 inline" />Personas
        </button>
        <button onClick={() => setTab("audiencias")} className={cn("rounded-t-xl px-5 py-3 text-sm font-semibold", tab === "audiencias" ? "border-b-2 border-[#9e6740] text-[#75462f]" : "text-[#927e72]")}>Audiencias</button>
      </div>

      {tab === "audiencias" ? <AudiencesTable /> : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-[#e2d5cc] bg-white/75 p-4">
            <label className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-[#ded1c8] bg-[#fffdfb] px-4 py-3 text-[#9a877c]">
              <Search size={19} />
              <span className="sr-only">Buscar miembros</span>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar por nombre, ID, teléfono o email" />
            </label>
            <div className="relative">
              <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="rounded-2xl border border-[#ded1c8] px-4 py-3 text-sm font-semibold">
                <SlidersHorizontal size={16} className="mr-2 inline" />Filtros
              </button>
              {filtersOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-[#ded1c8] bg-[#fffaf6] p-4 shadow-xl">
                  <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7874a]" htmlFor="member-tier-filter">Nivel</label>
                  <select id="member-tier-filter" value={tierFilter} onChange={(event) => setTierFilter(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none">
                    <option value="all">Todos los niveles</option>
                    {tiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                  </select>
                </div>
              ) : null}
            </div>
            <button className="rounded-2xl bg-[#b8864b] px-4 py-3 text-sm font-semibold text-white"><Download size={16} className="mr-2 inline" />Exportar</button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[#e2d5cc] bg-white/80">
            <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-[#2d211e] text-[#fff9f4]">
                <tr>{["Persona", "Sexo", "Edad", "Móvil", "Nivel", "Gasto", "Ubicación", "Acciones"].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => <MemberRow key={member.id} member={member} />)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function MemberRow({ member }: { member: Member }) {
  const profile = profileByMember[member.id] ?? { sex: "-", age: "-", city: "Madrid" };
  const identityIsPhone = member.identity.trim().startsWith("+");
  const spent = `${Math.max(member.points, 0).toLocaleString("es-ES")} €`;

  return (
    <tr className="border-t border-[#eadfd8]">
      <td className="px-5 py-4">
        <Link href={`/dashboard/members/${member.id}`} className="font-semibold hover:text-[#9b633e]">{member.name}</Link>
        <p className="mt-1 text-xs text-[#927e72]">{identityIsPhone ? member.id : member.identity}</p>
      </td>
      <td className="px-5 py-4">{profile.sex}</td>
      <td className="px-5 py-4">{profile.age}</td>
      <td className="px-5 py-4">{identityIsPhone ? member.identity : "-"}</td>
      <td className="px-5 py-4"><span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", tierColors[member.tier] ?? "bg-[#eadfd8] text-[#6f5c53]")}>{member.tier}</span></td>
      <td className="px-5 py-4 font-semibold">{spent}</td>
      <td className="px-5 py-4"><MapPin size={14} className="mr-1 inline text-[#b8864b]" />{profile.city}</td>
      <td className="px-5 py-4"><Link href={`/dashboard/members/${member.id}`} className="inline-flex items-center rounded-full border border-[#d9c9bf] px-4 py-2 text-xs font-semibold hover:bg-[#f6eee8]"><Pencil size={14} className="mr-1" />Editar</Link></td>
    </tr>
  );
}

function AudiencesTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#e2d5cc] bg-white/80">
      <div className="flex flex-wrap gap-3 border-b border-[#eadfd8] p-4">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-[#927e72]"><Search size={17} /><span className="text-sm">Buscar segmento</span></div>
        <button className="rounded-xl border border-[#dedfd8] px-4 py-2 text-sm font-semibold"><Filter size={16} className="mr-2 inline" />Filtros</button>
        <button className="rounded-xl bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"><Plus size={15} className="mr-2 inline" />Añadir segmento</button>
      </div>
      <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-[#2d211e] text-white">
          <tr>{["Segmento", "Criterios", "Personas", "Actualización", "Acciones"].map((heading) => <th key={heading} className="px-5 py-3 font-semibold">{heading}</th>)}</tr>
        </thead>
        <tbody>
          {audienceRows.map((row) => (
            <tr key={row.name} className="border-t border-[#eadfd8]">
              <td className="px-5 py-4 font-semibold">{row.name}</td>
              <td className="px-5 py-4 text-[#806d63]">{row.criteria}</td>
              <td className="px-5 py-4">{row.count}</td>
              <td className="px-5 py-4 text-[#806d63]">{row.updated}</td>
              <td className="px-5 py-4"><button className="font-semibold text-[#9b633e]">Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
