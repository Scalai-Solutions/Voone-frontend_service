import { BarChart3, Crown, Gift, PiggyBank, ReceiptText, Sparkles, Trophy, UsersRound } from "lucide-react";

import { getMembers, type Member } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const memberProfiles: Record<string, { age: number; city: string }> = {
  "MEM-1048": { age: 29, city: "Madrid" },
  "MEM-2033": { age: 34, city: "Valencia" },
  "MEM-3110": { age: 41, city: "Barcelona" },
};

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

export default async function MetricsPage() {
  const members = await getMembers();
  const metrics = buildMetrics(members);

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
        <MetricCard icon={UsersRound} eyebrow="Miembros" value={metrics.totalMembers.toLocaleString("es-ES")} detail={`${metrics.activeWalletMembers} con Wallet activo`} tone="dark" />
        <MetricCard icon={Crown} eyebrow="Niveles" value={metrics.totalTiers.toString()} detail={`${metrics.leadingTier?.tier ?? "Sin nivel"} lidera la base`} />
        <MetricCard icon={PiggyBank} eyebrow="Dinero gastado" value={formatCurrency(metrics.totalSpent)} detail={`${formatCurrency(metrics.monthlySpent)} este mes`} />
        <MetricCard icon={Gift} eyebrow="Rewards redeemed" value={metrics.rewardsRedeemed.toString()} detail={`${metrics.monthlyRewardsRedeemed} canjes este mes`} />
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
          <RankingCard title="Top clientes este mes" eyebrow="Septiembre" icon={Trophy} members={metrics.topClientsThisMonth} emptyText="Sin actividad este mes" />
          <RankingCard title="Top clientes all-time" eyebrow="Histórico" icon={ReceiptText} members={metrics.topClientsAllTime} emptyText="Sin clientes todavía" />
        </aside>
      </div>
    </section>
  );
}

function buildMetrics(members: Member[]) {
  const latestHistoryDate = members.flatMap((member) => member.history.map((item) => item.date)).sort().at(-1);
  const monthKey = latestHistoryDate?.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const activeWalletMembers = members.filter((member) => Object.values(member.walletStatus).includes("added")).length;
  const totalSpent = members.reduce((total, member) => total + member.points, 0);
  const monthlySpent = members.reduce((total, member) => total + pointsForMonth(member, monthKey), 0);
  const rewardsRedeemed = members.reduce((total, member) => total + member.history.filter((item) => item.points < 0).length, 0);
  const monthlyRewardsRedeemed = members.reduce((total, member) => total + member.history.filter((item) => item.date.startsWith(monthKey) && item.points < 0).length, 0);
  const membersByTier = countBy(members.map((member) => member.tier)).map(([tier, count]) => ({ tier, count }));

  return {
    totalMembers: members.length,
    totalTiers: membersByTier.length,
    activeWalletMembers,
    totalSpent,
    monthlySpent,
    rewardsRedeemed,
    monthlyRewardsRedeemed,
    leadingTier: membersByTier[0],
    membersByTier,
    membersByAge: ageRanges.map((range) => ({
      label: range.label,
      count: members.filter((member) => {
        const age = memberProfiles[member.id]?.age;
        return typeof age === "number" && age >= range.min && age <= range.max;
      }).length,
    })),
    topClientsThisMonth: rankMembers(members, (member) => pointsForMonth(member, monthKey)),
    topClientsAllTime: rankMembers(members, (member) => member.points),
  };
}

function countBy(values: string[]) {
  const counts = values.reduce<Map<string, number>>((items, value) => items.set(value, (items.get(value) ?? 0) + 1), new Map());

  return Array.from(counts.entries()).sort((first, second) => second[1] - first[1]);
}

function pointsForMonth(member: Member, monthKey: string) {
  return member.history.filter((item) => item.date.startsWith(monthKey)).reduce((total, item) => total + Math.max(item.points, 0), 0);
}

function rankMembers(members: Member[], scoreForMember: (member: Member) => number) {
  return members
    .map((member) => ({ member, score: scoreForMember(member), city: memberProfiles[member.id]?.city ?? "Madrid" }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}

function percentage(value: number, total: number) {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
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

function RankingCard({ title, eyebrow, icon: Icon, members, emptyText }: { title: string; eyebrow: string; icon: React.ComponentType<{ className?: string }>; members: ReturnType<typeof rankMembers>; emptyText: string }) {
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
        {members.length ? members.map((item, index) => (
          <div key={item.member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{index + 1}. {item.member.name}</p>
              <p className="mt-1 text-xs text-[#927e72]">{item.member.tier} · {item.city}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-bold text-[#805637]">{formatCurrency(item.score)}</span>
          </div>
        )) : <p className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3 text-sm text-[#806d63]">{emptyText}</p>}
      </div>
    </section>
  );
}