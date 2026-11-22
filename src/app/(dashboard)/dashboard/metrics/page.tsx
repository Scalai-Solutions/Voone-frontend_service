import { redirect } from "next/navigation";
import { BarChart3, Crown, Gift, PiggyBank, ReceiptText, Sparkles, Trophy, UsersRound } from "lucide-react";

import { ApiError, type Member } from "@/lib/api-client";
import { fetchDashboardOverview } from "@/lib/dashboard-overview-server";
import {
  formatMoneySpentTotal,
  formatRewardsRedeemedThisMonth,
  topClientRows,
} from "@/lib/dashboard-overview";
import { formatCount } from "@/lib/money";
import { formatPoints } from "@/lib/points";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";
import { staffFetch } from "@/lib/staff-api";
import { buildMetrics } from "@/lib/member-metrics";
import { monthNameEs } from "@/lib/month-label";
import { MetricCard, ProgressRow, RankingCard, TierTile } from "@/components/shared/metrics-kit";

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
        <MetricCard icon={PiggyBank} eyebrow="Dinero gastado" value={formatMoneySpentTotal(overview)} detail="Total pagado por tus clientes" />
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
              {metrics.membersByTier.map((tier) => <TierTile key={tier.tier} tier={tier.tier} count={tier.count} total={metrics.totalMembers} />)}
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
