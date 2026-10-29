import { redirect } from "next/navigation";
import { BarChart3, Crown, Gift, PiggyBank, ReceiptText, Sparkles, Trophy, UsersRound } from "lucide-react";

import { ApiError, type DashboardOverview, type Member } from "@/lib/api-client";
import { fetchDashboardOverview } from "@/lib/dashboard-overview-server";
import {
  formatMoneySpentTotal,
  formatRevenueThisMonth,
  formatRewardsRedeemedThisMonth,
  topClientRows,
} from "@/lib/dashboard-overview";
import { formatCount } from "@/lib/money";
import { formatPoints } from "@/lib/points";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";
import { staffFetch } from "@/lib/staff-api";
import { monthKeyIn, monthNameEs } from "@/lib/month-label";
import { cn } from "@/lib/utils";

const ageRanges = [
  { label: "18-24", min: 18, max: 24 },
  { label: "25-34", min: 25, max: 34 },
  { label: "35-44", min: 35, max: 44 },
  { label: "45-54", min: 45, max: 54 },
  { label: "55+", min: 55, max: Number.POSITIVE_INFINITY },
];

const tierStyles: Record<string, string> = {
  Diamond: "bg-[#d9e5ef] text-[#30465d]",
  Gold: "bg-[#f2d09a] text-[#68451f]",
  Silver: "bg-[#d8d8d4] text-[#4d4e4a]",
  Nuevo: "bg-[#eadfd8] text-[#6f5c53]",
};

async function getMetricsMembers(session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>): Promise<Member[]> {
  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(session.clinicSlug)}/members`,
    { method: "GET" },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone staff request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<Member[]>;
}

export default async function MetricsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, PERMISSIONS.membersManage)) {
    redirect("/dashboard");
  }

  // Money, rewards redeemed and the month's top clients come from the backend's own totals, not
  // from the members list (which is not the whole base and carries only a few history rows).
  const [members, overview] = await Promise.all([
    getMetricsMembers(session),
    session.clinicId ? fetchDashboardOverview(session.clinicId) : Promise.resolve(null),
  ]);
  const metrics = buildMetrics(members);
  const topClients = topClientRows(overview);
  const topClientsAvailable = Array.isArray(overview?.topClientsThisMonth);

  return (
    <section className="space-y-7 text-[#2e2421]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Analítica de fidelización</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">Métricas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#927e72]">Una vista general de miembros, niveles, gasto, recompensas y clientes con mayor actividad.</p>
        </div>
        <div className="rounded-full border border-[#d9c9bf] bg-white/75 px-4 py-2 text-sm font-semibold text-[#754b36]">
          Actualizado hoy
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersRound} eyebrow="Miembros" value={formatCount(metrics.totalMembers)} detail={`${metrics.activeWalletMembers} con Wallet activo`} tone="dark" />
        <MetricCard icon={Crown} eyebrow="Niveles" value={metrics.totalTiers.toString()} detail={`${metrics.leadingTier?.tier ?? "Sin nivel"} lidera la base`} />
        <MetricCard icon={PiggyBank} eyebrow="Dinero gastado" value={formatMoneySpentTotal(overview)} detail={moneySpentDetail(overview)} />
        <MetricCard icon={Gift} eyebrow="Canjes este mes" value={formatRewardsRedeemedThisMonth(overview)} detail="Recompensas entregadas en el mes" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Distribución</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Miembros por rango de edad</h2>
              </div>
              <BarChart3 className="h-5 w-5 text-[#b8864b]" />
            </div>
            <div className="mt-5 space-y-4">
              {metrics.membersByAge.map((range) => <ProgressRow key={range.label} label={range.label} value={range.count} total={metrics.totalMembers} />)}
            </div>
          </section>

          <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Niveles</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Miembros por tier</h2>
              </div>
              <Sparkles className="h-5 w-5 text-[#b8864b]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {metrics.membersByTier.map((tier) => (
                <div key={tier.tier} className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", tierStyles[tier.tier] ?? "bg-[#eadfd8] text-[#6f5c53]")}>{tier.tier}</span>
                    <span className="font-serif text-3xl font-semibold">{tier.count}</span>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-[#eadfd8]">
                    <div className="h-full rounded-full bg-[#b8864b]" style={{ width: `${percentage(tier.count, metrics.totalMembers)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-[#927e72]">{percentage(tier.count, metrics.totalMembers)}% de la base</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <RankingCard
            title="Top clientes este mes"
            eyebrow={monthNameEs(metrics.monthKey) ?? "Este mes"}
            icon={Trophy}
            rows={topClients.map((row) => ({ id: row.memberId, name: row.name, detail: "Visitas pagadas este mes", value: row.amount }))}
            emptyText={topClientsAvailable ? "Sin actividad este mes" : "—"}
          />
          <RankingCard
            title="Top clientes all-time"
            eyebrow="Histórico"
            icon={ReceiptText}
            rows={metrics.topClientsAllTime.map((item) => ({ id: item.member.id, name: item.member.name, detail: item.member.tier, value: `${formatPoints(item.score)} pts` }))}
            emptyText="Sin clientes todavía"
          />
        </aside>
      </div>
    </section>
  );
}

function memberAge(member: Member) {
  if (member.birthDate) {
    const today = new Date();
    const date = new Date(`${member.birthDate}T00:00:00.000Z`);
    let age = today.getFullYear() - date.getUTCFullYear();
    const birthdayThisYear = new Date(Date.UTC(today.getFullYear(), date.getUTCMonth(), date.getUTCDate()));

    if (today.getTime() < birthdayThisYear.getTime()) age -= 1;

    return age;
  }

  return member.birthYear ? new Date().getFullYear() - member.birthYear : null;
}

function buildMetrics(members: Member[]) {
  // The month the backend counts "this month" in: the Madrid calendar month.
  const monthKey = monthKeyIn("Europe/Madrid");
  const activeWalletMembers = members.filter((member) => Object.values(member.walletStatus).includes("added")).length;
  const membersByTier = countBy(members.map((member) => member.tier)).map(([tier, count]) => ({ tier, count }));

  return {
    monthKey,
    totalMembers: members.length,
    totalTiers: membersByTier.length,
    activeWalletMembers,
    leadingTier: membersByTier[0],
    membersByTier,
    membersByAge: ageRanges.map((range) => ({
      label: range.label,
      count: members.filter((member) => {
        const age = memberAge(member);
        return typeof age === "number" && age >= range.min && age <= range.max;
      }).length,
    })),
    // Ranked by current points balance (what the members list carries), shown in points.
    topClientsAllTime: rankMembers(members, (member) => member.points),
  };
}

function moneySpentDetail(overview: DashboardOverview | null) {
  const month = formatRevenueThisMonth(overview);

  return month === "—" ? "Total de visitas pagadas" : `Total de visitas pagadas · ${month} este mes`;
}

function countBy(values: string[]) {
  const counts = values.reduce<Map<string, number>>((items, value) => items.set(value, (items.get(value) ?? 0) + 1), new Map());

  return Array.from(counts.entries()).sort((first, second) => second[1] - first[1]);
}

function rankMembers(members: Member[], scoreForMember: (member: Member) => number) {
  return members
    .map((member) => ({ member, score: scoreForMember(member) }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}

function percentage(value: number, total: number) {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}

function MetricCard({ icon: Icon, eyebrow, value, detail, tone = "light" }: { icon: React.ComponentType<{ className?: string }>; eyebrow: string; value: string; detail: string; tone?: "dark" | "light" }) {
  return (
    <section className={cn("rounded-3xl p-5", tone === "dark" ? "bg-[#2d211e] text-white" : "border border-[#e2d5cc] bg-white/80 text-[#2e2421]")}>
      <div className="flex items-center justify-between gap-4">
        <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", tone === "dark" ? "text-[#dcb17b]" : "text-[#b7874a]")}>{eyebrow}</p>
        <Icon className={cn("h-5 w-5", tone === "dark" ? "text-[#dcb17b]" : "text-[#b8864b]")} />
      </div>
      <p className="mt-4 font-serif text-4xl font-semibold">{value}</p>
      <p className={cn("mt-2 text-sm", tone === "dark" ? "text-[#c9b7ad]" : "text-[#927e72]")}>{detail}</p>
    </section>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const width = percentage(value, total);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-[#806d63]">{value} miembros</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#eadfd8]">
        <div className="h-full rounded-full bg-[#9c7651]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function RankingCard({ title, eyebrow, icon: Icon, rows, emptyText }: { title: string; eyebrow: string; icon: React.ComponentType<{ className?: string }>; rows: Array<{ id: string; name: string; detail: string; value: string }>; emptyText: string }) {
  return (
    <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{eyebrow}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-[#b8864b]" />
      </div>
      <div className="mt-5 space-y-3">
        {rows.length ? rows.map((row, index) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{index + 1}. {row.name}</p>
              <p className="mt-1 text-xs text-[#927e72]">{row.detail}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-bold text-[#805637]">{row.value}</span>
          </div>
        )) : <p className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3 text-sm text-[#806d63]">{emptyText}</p>}
      </div>
    </section>
  );
}
