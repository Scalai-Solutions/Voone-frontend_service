"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Download, Filter, Pencil, Plus, Search, SlidersHorizontal, Users } from "lucide-react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/shared/page-kit";
import { LuxuryLoading } from "@/components/shared/luxury-loading";
import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import { useInfiniteMembers } from "@/features/members/api/useMembers";
import { useStaffScope } from "@/features/members/staff-scope";
import {
  createAudience,
  deleteAudience,
  getAudiences,
  type ClinicAudience,
  type Member,
  type NotificationSegmentInput,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatEuros } from "@/lib/euros";
import { formatPoints } from "@/lib/points";

const sexLabels: Record<NonNullable<Member["sex"]>, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  otro: "Otro",
  prefiero_no_decirlo: "Prefiere no decirlo",
};

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

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

/** Metallic tag per tier, keyed by lowercase name; a renamed tier falls back to the neutral tag. */
const tierColors: Record<string, string> = {
  bronce: "bg-gradient-to-br from-[#e3b88f] via-[#c08a5c] to-[#9a6640] text-white ring-1 ring-[#8a5a37]/40",
  plata: "bg-gradient-to-br from-[#f4f4f6] via-[#c9cad0] to-[#a3a5ad] text-[#3e4048] ring-1 ring-[#8f919a]/40",
  oro: "bg-gradient-to-br from-[#f7e08f] via-[#d9b24c] to-[#b48a2c] text-[#4a3510] ring-1 ring-[#a07a22]/40",
  platino: "bg-gradient-to-br from-[#eef3f4] via-[#b7c8cc] to-[#7f9aa2] text-[#26393f] ring-1 ring-[#6f8f9a]/40",
  diamante: "bg-gradient-to-br from-[#dbe9ff] via-[#93b4ea] to-[#4d6fa8] text-white ring-1 ring-[#3d5c91]/40",
  nuevo: "bg-[#eadfd8] text-[#6f5c53]",
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "Sin visitas";

export function MembersTable() {
  const { membersHref } = useStaffScope();
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
        <Link href={`${membersHref}/new`} className="inline-flex items-center gap-2 rounded-full bg-[#b8864b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9e6d3d]">
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

          {filteredMembers.length === 0 && !isSearching ? <EmptyState title="Aún no hay miembros" message="No hay miembros que coincidan con la búsqueda actual." action={{ href: `${membersHref}/new`, label: "Añadir persona" }} /> : null}

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
  const { membersHref } = useStaffScope();
  const identityIsPhone = member.identity.trim().startsWith("+");
  const spent = formatEuros(Math.max(member.moneySpent, 0));

  return (
    <tr className="border-t border-[#eadfd8]">
      <td className="px-5 py-4">
        <Link href={`${membersHref}/${member.id}`} className="font-semibold hover:text-[#9b633e]">{member.name}</Link>
        {/* The number on the member's card. Falls back to the old line for members the
            backfill has not reached — a uuid, which is why the code exists. */}
        <p className="mt-1 text-xs text-[#927e72]">{member.code ?? (identityIsPhone ? member.id : member.identity)}</p>
      </td>
      <td className="px-5 py-4">{member.sex ? sexLabels[member.sex] : "-"}</td>
      <td className="px-5 py-4">{memberAge(member)}</td>
      <td className="px-5 py-4">{identityIsPhone ? member.identity : "-"}</td>
      <td className="px-5 py-4"><span className={cn("rounded-full px-3 py-1.5 text-xs font-bold shadow-sm", tierColors[member.tier.toLowerCase()] ?? "bg-[#eadfd8] text-[#6f5c53]")}>{member.tier}</span></td>
      <td className="px-5 py-4 font-semibold">{formatPoints(member.points)}</td>
      <td className="px-5 py-4 font-semibold">{spent}</td>
      <td className="px-5 py-4"><CalendarDays size={14} className="mr-1 inline text-[#b8864b]" />{formatDate(member.lastVisitedAt)}</td>
      <td className="px-5 py-4"><Link href={`${membersHref}/${member.id}`} className="inline-flex items-center rounded-full border border-[#d9c9bf] px-4 py-2 text-xs font-semibold hover:bg-[#f6eee8]"><Pencil size={14} className="mr-1" />Editar</Link></td>
    </tr>
  );
}

function AudiencesTable({ members }: { members: Member[] }) {
  const queryClient = useQueryClient();
  const scope = useStaffScope();
  // The admin portal names the clinic; /api/staff/clinic only answers a clinic's own session.
  const currentClinic = useCurrentClinic({ enabled: !scope.clinicId });
  const clinicId = scope.clinicId ?? currentClinic.data?.id;

  // Saved audiences live on the backend, so they survive a reload and the whole team sees the
  // same list; the count arrives with them, resolved by the same code path a send uses.
  const audiencesQuery = useQuery({
    queryKey: ["audiences", clinicId],
    enabled: Boolean(clinicId),
    queryFn: () => getAudiences(clinicId ?? "", scope.apiBase),
  });

  const [searchTerm, setSearchTerm] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("all");
  const [draftName, setDraftName] = React.useState("");
  const [draftTier, setDraftTier] = React.useState("all");
  const [draftActiveBono, setDraftActiveBono] = React.useState(false);
  const [draftInactiveDays, setDraftInactiveDays] = React.useState("");
  const [draftSex, setDraftSex] = React.useState("all");
  const [draftAgeMin, setDraftAgeMin] = React.useState("");
  const [draftAgeMax, setDraftAgeMax] = React.useState("");
  const [draftBirthMonth, setDraftBirthMonth] = React.useState("all");
  const [draftJoinedAfter, setDraftJoinedAfter] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const tiers = Array.from(new Set(members.map((member) => member.tier))).sort();
  const ageMin = wholeNumber(draftAgeMin);
  const ageMax = wholeNumber(draftAgeMax);
  const ageRangeInvalid = ageMin !== undefined && ageMax !== undefined && ageMin > ageMax;
  const rows = audiencesQuery.data ?? [];
  const visibleRows = rows.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchesTier = tierFilter === "all" || row.criteria.tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; criteria: NotificationSegmentInput }) =>
      createAudience(clinicId ?? "", input, scope.apiBase),
    onSuccess: async () => {
      setDraftName("");
      setDraftTier("all");
      setDraftActiveBono(false);
      setDraftInactiveDays("");
      setDraftSex("all");
      setDraftAgeMin("");
      setDraftAgeMax("");
      setDraftBirthMonth("all");
      setDraftJoinedAfter("");
      setCreating(false);
      await queryClient.invalidateQueries({ queryKey: ["audiences", clinicId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (audienceId: string) =>
      deleteAudience(clinicId ?? "", audienceId, scope.apiBase),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audiences", clinicId] }),
  });

  function addSegment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();

    if (!name || ageRangeInvalid) return;

    // Only criteria the backend accepts, in its own shape; anything else is left out.
    const inactiveDays = Number(draftInactiveDays);
    const criteria: NotificationSegmentInput = {
      ...(draftTier !== "all" ? { tier: draftTier } : {}),
      ...(draftActiveBono ? { activeBono: true } : {}),
      ...(draftInactiveDays.trim() !== "" && Number.isInteger(inactiveDays) && inactiveDays > 0
        ? { inactiveDays }
        : {}),
      ...(draftSex !== "all" ? { sex: draftSex as NonNullable<Member["sex"]> } : {}),
      ...(ageMin !== undefined ? { ageMin } : {}),
      ...(ageMax !== undefined ? { ageMax } : {}),
      ...(draftBirthMonth !== "all" ? { birthMonth: Number(draftBirthMonth) } : {}),
      ...(draftJoinedAfter ? { joinedAfter: draftJoinedAfter } : {}),
    };

    createMutation.mutate({ name, criteria });
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
        <form onSubmit={addSegment} className="grid gap-3 border-b border-[#eadfd8] bg-[#fffaf6] p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
            <input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Nombre del segmento" className="h-10 rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none" />
            <select value={draftTier} onChange={(event) => setDraftTier(event.target.value)} className="h-10 rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none">
              <option value="all">Todos los niveles</option>
              {tiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
            </select>
            <button type="submit" disabled={createMutation.isPending || ageRangeInvalid} className="rounded-xl bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-sm font-semibold">
              <input type="checkbox" checked={draftActiveBono} onChange={(event) => setDraftActiveBono(event.target.checked)} className="h-4 w-4 accent-[#b8864b]" />
              Con bono activo
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-sm font-semibold">
              <span className="text-[#927e72]">Sin visitas desde (días)</span>
              <input type="number" min={1} step={1} value={draftInactiveDays} onChange={(event) => setDraftInactiveDays(event.target.value)} placeholder="—" className="h-9 w-20 rounded-lg border border-[#ded1c8] px-2 text-sm font-normal outline-none" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={segmentField}>
              <span className="text-[#927e72]">Sexo</span>
              <select value={draftSex} onChange={(event) => setDraftSex(event.target.value)} className={segmentControl}>
                <option value="all">Todos</option>
                {Object.entries(sexLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <fieldset className={segmentField}>
              <legend className="sr-only">Edad</legend>
              <span className="text-[#927e72]">Edad</span>
              <input type="number" min={0} max={120} step={1} value={draftAgeMin} onChange={(event) => setDraftAgeMin(event.target.value)} placeholder="desde" aria-label="Edad desde" className={cn(segmentControl, "w-16")} />
              <span className="text-[#927e72]">–</span>
              <input type="number" min={0} max={120} step={1} value={draftAgeMax} onChange={(event) => setDraftAgeMax(event.target.value)} placeholder="hasta" aria-label="Edad hasta" className={cn(segmentControl, "w-16")} />
            </fieldset>
            <label className={segmentField}>
              <span className="text-[#927e72]">Cumpleaños en</span>
              <select value={draftBirthMonth} onChange={(event) => setDraftBirthMonth(event.target.value)} className={segmentControl}>
                <option value="all">Cualquier mes</option>
                {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </select>
            </label>
            <label className={segmentField}>
              <span className="text-[#927e72]">Alta desde</span>
              <input type="date" value={draftJoinedAfter} onChange={(event) => setDraftJoinedAfter(event.target.value)} className={segmentControl} />
            </label>
          </div>
          {ageRangeInvalid ? <p className="text-sm font-semibold text-[#b94135]">La edad mínima no puede ser mayor que la máxima.</p> : null}
          {createMutation.isError ? <p className="text-sm font-semibold text-[#b94135]">No se pudo guardar el segmento. Inténtalo de nuevo.</p> : null}
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
              <td className="px-5 py-4 text-[#806d63]">{describeCriteria(row.criteria)}</td>
              <td className="px-5 py-4">{audiencesQuery.isFetching ? "..." : row.memberCount}</td>
              <td className="px-5 py-4 text-[#806d63]">{formatUpdatedAt(row.updatedAt)}</td>
              <td className="px-5 py-4">
                <button type="button" onClick={() => removeMutation.mutate(row.id)} disabled={removeMutation.isPending} className="font-semibold text-[#9b633e] disabled:cursor-not-allowed disabled:opacity-60">
                  {removeMutation.isPending && removeMutation.variables === row.id ? "Eliminando..." : "Eliminar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {audiencesQuery.isLoading ? <p className="px-5 py-4 text-sm text-[#927e72]">Cargando segmentos guardados...</p> : null}
      {audiencesQuery.isError ? <p className="px-5 py-4 text-sm font-semibold text-[#b94135]">No se pudieron cargar los segmentos. Revisa la conexión e inténtalo de nuevo.</p> : null}
      {!audiencesQuery.isLoading && !audiencesQuery.isError && visibleRows.length === 0 ? <p className="px-5 py-4 text-sm text-[#927e72]">{rows.length === 0 ? "No hay segmentos guardados para este centro." : "Ningún segmento coincide con la búsqueda actual."}</p> : null}
    </div>
  );
}

const segmentField =
  "flex items-center gap-2 rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-sm font-semibold";
const segmentControl =
  "h-9 min-w-0 rounded-lg border border-[#ded1c8] bg-white px-2 text-sm font-normal outline-none";

/** A whole number typed in a field, or undefined when it is empty or not one. */
const wholeNumber = (value: string): number | undefined => {
  const parsed = Number(value);

  return value.trim() !== "" && Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

/** What a saved audience filters by, in the words the creation form uses. */
const describeCriteria = (criteria: ClinicAudience["criteria"]): string => {
  const parts: string[] = [];

  if (criteria.tier) parts.push(`Nivel · ${criteria.tier}`);
  if (criteria.activeBono) parts.push("Bono activo");
  if (typeof criteria.inactiveDays === "number") parts.push(`Sin visitas ${criteria.inactiveDays} días`);
  if (criteria.sex) parts.push(`Sexo · ${sexLabels[criteria.sex]}`);
  if (criteria.ageMin !== undefined && criteria.ageMax !== undefined) parts.push(`${criteria.ageMin}–${criteria.ageMax} años`);
  else if (criteria.ageMin !== undefined) parts.push(`Desde ${criteria.ageMin} años`);
  else if (criteria.ageMax !== undefined) parts.push(`Hasta ${criteria.ageMax} años`);
  if (criteria.birthMonth) parts.push(`Cumpleaños en ${MONTHS[criteria.birthMonth - 1]}`);
  if (criteria.joinedAfter) parts.push(`Alta desde ${formatUpdatedAt(criteria.joinedAfter)}`);

  return parts.length > 0 ? parts.join(" · ") : "Todos los miembros";
};

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
