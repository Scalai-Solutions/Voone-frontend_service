"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Download, Filter, Pencil, Plus, Search, SlidersHorizontal, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/page-kit";
import { LuxuryLoading } from "@/components/shared/luxury-loading";
import { useInfiniteMembers } from "@/features/members/api/useMembers";
import { type Member } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatPoints } from "@/lib/points";

type AudienceRow = {
  id: string;
  name: string;
  tier: string;
  updated: string;
};

const sexLabels: Record<NonNullable<Member["sex"]>, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  otro: "Otro",
  prefiero_no_decirlo: "Prefiere no decirlo",
};

const ageFromBirthDate = (birthDate: string) => {
  const today = new Date();
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  let age = today.getFullYear() - date.getUTCFullYear();
  const birthdayThisYear = new Date(Date.UTC(today.getFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (today.getTime() < birthdayThisYear.getTime()) age -= 1;

  return age;
};

const memberAge = (member: Member) => {
  if (member.birthDate) return ageFromBirthDate(member.birthDate);
  if (member.birthYear) return new Date().getFullYear() - member.birthYear;

  return "-";
};

const tierColors: Record<string, string> = {
  Gold: "bg-[#f2d09a] text-[#68451f]",
  Diamond: "bg-[#c9d7e5] text-[#30465d]",
  Silver: "bg-[#d8d8d4] text-[#4d4e4a]",
  Nuevo: "bg-[#eadfd8] text-[#6f5c53]",
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "Sin visitas";

export function MembersTable() {
  const [tab, setTab] = React.useState<"personas" | "audiencias">("personas");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("all");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const members = useInfiniteMembers(debouncedSearch);
  const loadedMembers = React.useMemo(() => members.data?.pages.flat() ?? [], [members.data]);
  const isSearching = searchTerm.trim() !== debouncedSearch.trim() || (members.isFetching && !members.isFetchingNextPage);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);

    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  React.useEffect(() => {
    const node = loadMoreRef.current;

    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && members.hasNextPage && !members.isFetchingNextPage) {
        void members.fetchNextPage();
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [members]);

  if (members.isLoading) {
    return <LuxuryLoading label="Preparing member records" />;
  }

  if (members.error) {
    return <div className="rounded-[24px] border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">No se pudieron cargar los miembros. Revisa la conexión con la API e inténtalo de nuevo.</div>;
  }

  const tiers = Array.from(new Set(loadedMembers.map((member) => member.tier)));
  const filteredMembers = loadedMembers.filter((member) => tierFilter === "all" || member.tier === tierFilter);

  function exportMembersCsv() {
    const headers = ["Nombre", "Código", "Identificación", "Nivel", "Puntos", "Dinero gastado", "Última visita"];
    const escape = (value: string | number | null | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = filteredMembers.map((member) => [
      member.name,
      member.code ?? "",
      member.identity,
      member.tier,
      member.points,
      member.moneySpent,
      member.lastVisitedAt ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "members.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

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

      {tab === "audiencias" ? <AudiencesTable members={loadedMembers} /> : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-[#e2d5cc] bg-white/75 p-4">
            <label className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-[#ded1c8] bg-[#fffdfb] px-4 py-3 text-[#9a877c]">
              <Search size={19} />
              <span className="sr-only">Buscar miembros</span>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar por nombre, ID, teléfono o email" />
              {isSearching ? <span className="text-xs font-semibold text-[#b7874a]">Buscando...</span> : null}
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
            <button type="button" onClick={exportMembersCsv} className="rounded-2xl bg-[#b8864b] px-4 py-3 text-sm font-semibold text-white"><Download size={16} className="mr-2 inline" />Exportar</button>
          </div>

          {filteredMembers.length === 0 && !isSearching ? <EmptyState title="Aún no hay miembros" message="No hay miembros que coincidan con la búsqueda actual." action={{ href: "/dashboard/members/new", label: "Añadir persona" }} /> : null}

          {filteredMembers.length > 0 ? <div className="overflow-x-auto rounded-3xl border border-[#e2d5cc] bg-white/80">
            <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-[#2d211e] text-[#fff9f4]">
                <tr>{["Persona", "Sexo", "Edad", "Móvil", "Nivel", "Puntos", "Dinero gastado", "Última visita", "Acciones"].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => <MemberRow key={member.id} member={member} />)}
              </tbody>
            </table>
          </div> : null}
          <div ref={loadMoreRef} className="py-4 text-center text-sm font-semibold text-[#806d63]">
            {members.isFetchingNextPage ? "Loading 10 more members..." : members.hasNextPage ? "Scroll for more members" : filteredMembers.length > 0 ? "All matching members loaded" : ""}
          </div>
        </>
      )}
    </section>
  );
}

function MemberRow({ member }: { member: Member }) {
  const identityIsPhone = member.identity.trim().startsWith("+");
  const spent = `${Math.max(member.moneySpent, 0).toLocaleString("es-ES")} €`;

  return (
    <tr className="border-t border-[#eadfd8]">
      <td className="px-5 py-4">
        <Link href={`/dashboard/members/${member.id}`} className="font-semibold hover:text-[#9b633e]">{member.name}</Link>
        {/* The number on the member's card. Falls back to the old line for members the
            backfill has not reached — a uuid, which is why the code exists. */}
        <p className="mt-1 text-xs text-[#927e72]">{member.code ?? (identityIsPhone ? member.id : member.identity)}</p>
      </td>
      <td className="px-5 py-4">{member.sex ? sexLabels[member.sex] : "-"}</td>
      <td className="px-5 py-4">{memberAge(member)}</td>
      <td className="px-5 py-4">{identityIsPhone ? member.identity : "-"}</td>
      <td className="px-5 py-4"><span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", tierColors[member.tier] ?? "bg-[#eadfd8] text-[#6f5c53]")}>{member.tier}</span></td>
      <td className="px-5 py-4 font-semibold">{formatPoints(member.points)}</td>
      <td className="px-5 py-4 font-semibold">{spent}</td>
      <td className="px-5 py-4"><CalendarDays size={14} className="mr-1 inline text-[#b8864b]" />{formatDate(member.lastVisitedAt)}</td>
      <td className="px-5 py-4"><Link href={`/dashboard/members/${member.id}`} className="inline-flex items-center rounded-full border border-[#d9c9bf] px-4 py-2 text-xs font-semibold hover:bg-[#f6eee8]"><Pencil size={14} className="mr-1" />Editar</Link></td>
    </tr>
  );
}

function AudiencesTable({ members }: { members: Member[] }) {
  const [rows, setRows] = React.useState<AudienceRow[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("all");
  const [draftName, setDraftName] = React.useState("");
  const [draftTier, setDraftTier] = React.useState("all");
  const [creating, setCreating] = React.useState(false);
  const tiers = Array.from(new Set(members.map((member) => member.tier))).sort();
  const visibleRows = rows.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchesTier = tierFilter === "all" || row.tier === tierFilter;

    return matchesSearch && matchesTier;
  });
  const countFor = (row: AudienceRow) =>
    row.tier === "all" ? members.length : members.filter((member) => member.tier === row.tier).length;

  function addSegment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();

    if (!name) return;

    setRows((current) => [
      { id: crypto.randomUUID(), name, tier: draftTier, updated: "Ahora" },
      ...current,
    ]);
    setDraftName("");
    setDraftTier("all");
    setCreating(false);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[#e2d5cc] bg-white/80">
      <div className="flex flex-wrap gap-3 border-b border-[#eadfd8] p-4">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-[#927e72]">
          <Search size={17} />
          <span className="sr-only">Buscar segmento</span>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar segmento" />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-[#dedfd8] px-4 py-2 text-sm font-semibold">
          <Filter size={16} />
          <span className="sr-only">Filtrar por nivel</span>
          <select value={tierFilter} onChange={(event) => setTierFilter(event.target.value)} className="bg-transparent outline-none">
            <option value="all">Todos los niveles</option>
            {tiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setCreating((open) => !open)} className="rounded-xl bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"><Plus size={15} className="mr-2 inline" />Añadir segmento</button>
      </div>

      {creating ? (
        <form onSubmit={addSegment} className="grid gap-3 border-b border-[#eadfd8] bg-[#fffaf6] p-4 sm:grid-cols-[1fr_220px_auto]">
          <input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Nombre del segmento" className="h-10 rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none" />
          <select value={draftTier} onChange={(event) => setDraftTier(event.target.value)} className="h-10 rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none">
            <option value="all">Todos los niveles</option>
            {tiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
          </select>
          <button type="submit" className="rounded-xl bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white">Guardar</button>
        </form>
      ) : null}

      <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-[#2d211e] text-white">
          <tr>{["Segmento", "Criterios", "Personas", "Actualización", "Acciones"].map((heading) => <th key={heading} className="px-5 py-3 font-semibold">{heading}</th>)}</tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id} className="border-t border-[#eadfd8]">
              <td className="px-5 py-4 font-semibold">{row.name}</td>
              <td className="px-5 py-4 text-[#806d63]">{row.tier === "all" ? "Todos los niveles" : `Nivel · ${row.tier}`}</td>
              <td className="px-5 py-4">{countFor(row)}</td>
              <td className="px-5 py-4 text-[#806d63]">{row.updated}</td>
              <td className="px-5 py-4"><button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className="font-semibold text-[#9b633e]">Eliminar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {visibleRows.length === 0 ? <p className="px-5 py-4 text-sm text-[#927e72]">No hay segmentos guardados para este centro.</p> : null}
    </div>
  );
}
