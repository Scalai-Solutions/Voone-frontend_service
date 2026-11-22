import { redirect } from "next/navigation";
import { BarChart3, Gift, PiggyBank, ReceiptText, Sparkles, Trophy, UsersRound, WalletCards, Coins, TrendingUp } from "lucide-react";

import { ClinicLinkQrCard } from "@/components/admin/clinic-link-qr-card";
import { MetricCard, ProgressRow, RankingCard, TierTile } from "@/components/shared/metrics-kit";
import { PageHeader } from "@/components/shared/page-kit";
import {
  getAdminClinic,
  getAdminClinicMembers,
  getAdminClinicOpenRequests,
  getAdminClinicOverview,
  getAdminClinicPrograms,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { getClinicClubUrl, getClinicSignupUrl } from "@/lib/app-url";
import {
  formatMoneySpentTotal,
  formatPointsIssuedThisMonth,
  formatRevenueThisMonth,
  formatRewardsRedeemedThisMonth,
  topClientRows,
} from "@/lib/dashboard-overview";
import { buildMetrics } from "@/lib/member-metrics";
import { MISSING, formatCount } from "@/lib/money";
import { monthKeyIn, monthNameEs } from "@/lib/month-label";
import { formatPoints } from "@/lib/points";

/**
 * "Analítica del centro": one clinic's figures and its two public links, for Voone admins.
 *
 * The figures are the clinic's own (the same overview and members list its metrics page reads),
 * and every block degrades to "—" on its own when its call fails. The links are the clinic's
 * sign-up page and its club page (benefits, prize ladder, referrals), keyed by the clinic UUID
 * like the posters printed from the clinic dashboard.
 */
export default async function ClinicAnalyticsPage({ params }: PageProps<"/admin/clinics/[clinicId]/analitica">) {
  const { clinicId } = await params;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });

  const [signupUrl, clubUrl, overview, members, programs, openRequests] = await Promise.all([
    getClinicSignupUrl(clinic.id),
    getClinicClubUrl(clinic.id),
    getAdminClinicOverview(clinic.id),
    getAdminClinicMembers(clinic),
    getAdminClinicPrograms(clinic.id).catch(() => null),
    getAdminClinicOpenRequests(clinic.id),
  ]);

  const metrics = members ? buildMetrics(members) : null;
  const activeProgram = programs?.find((program) => program.status === "ACTIVO");
  const topClients = topClientRows(overview);
  const topClientsAvailable = Array.isArray(overview?.topClientsThisMonth);
  const monthLabel = monthNameEs(metrics?.monthKey ?? monthKeyIn("Europe/Madrid")) ?? "Este mes";
  const inactiveNotice = clinic.isActive ? null : "El centro aún no está activo: el enlace no funcionará hasta activarlo.";
  const clubNotice = inactiveNotice ?? (programs && !activeProgram ? "Sin programa activo: la página del club no se mostrará hasta publicar uno." : null);
  const back = { href: `/admin/clinics/${encodeURIComponent(clinic.id)}`, label: "Volver al centro" };

  return (
    <div className="space-y-7 text-[#2e2421]">
      <PageHeader
        eyebrow={`Analítica · ${clinic.name}`}
        title="Analítica del centro"
        description="Métricas del programa de fidelización y los enlaces públicos del centro, con sus códigos QR."
        action={back}
      />

      <section className="space-y-4">
        <SectionTitle eyebrow="Enlaces públicos" title="Enlaces y códigos QR" />
        <div className="grid gap-4 lg:grid-cols-2">
          <ClinicLinkQrCard target="signup" title="Registro de clientes" url={signupUrl} notice={inactiveNotice} />
          <ClinicLinkQrCard target="club" title="Catálogo de premios" url={clubUrl} notice={clubNotice} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle eyebrow="Indicadores" title="Métricas generales" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard icon={UsersRound} eyebrow="Miembros" value={formatCount(overview?.activeMembers ?? clinic.members)} detail={metrics ? `${formatCount(metrics.activeWalletMembers)} con Wallet activo` : "Miembros activos del centro"} tone="dark" />
          <MetricCard icon={WalletCards} eyebrow="Pases en Wallet" value={formatCount(overview?.walletAdds)} detail="Tarjetas añadidas a Apple o Google Wallet" />
          <MetricCard icon={Coins} eyebrow="Puntos este mes" value={formatPointsIssuedThisMonth(overview)} detail={`Puntos emitidos en ${monthLabel.toLowerCase()}`} />
          <MetricCard icon={TrendingUp} eyebrow="Ingresos este mes" value={formatRevenueThisMonth(overview)} detail="Pagado en visitas este mes" />
          <MetricCard icon={PiggyBank} eyebrow="Dinero gastado" value={formatMoneySpentTotal(overview)} detail="Total pagado por los clientes" />
          <MetricCard icon={Gift} eyebrow="Canjes este mes" value={formatRewardsRedeemedThisMonth(overview)} detail="Recompensas entregadas en el mes" />
        </div>
        {overview === null ? <Notice>No se pudieron cargar las métricas del centro. Las cifras se muestran como «{MISSING}».</Notice> : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          {metrics ? (
            <>
              <Panel eyebrow="Niveles" title="Miembros por nivel" icon={Sparkles}>
                {metrics.membersByTier.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {metrics.membersByTier.map((tier) => <TierTile key={tier.tier} tier={tier.tier} count={tier.count} total={metrics.totalMembers} />)}
                  </div>
                ) : <Notice>Sin miembros todavía.</Notice>}
              </Panel>
              <Panel eyebrow="Distribución" title="Miembros por rango de edad" icon={BarChart3}>
                <div className="space-y-4">
                  {metrics.membersByAge.map((range) => <ProgressRow key={range.label} label={range.label} value={range.count} total={metrics.totalMembers} />)}
                </div>
              </Panel>
            </>
          ) : (
            <Notice>{clinic.isActive ? "No se pudo cargar la lista de miembros para los desgloses por nivel y edad." : "Los desgloses por nivel y edad estarán disponibles cuando el centro esté activo."}</Notice>
          )}

          <Panel eyebrow="Resumen" title="Datos del centro" icon={ReceiptText}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact label="Estado" value={clinic.status === "active" ? "Activo" : clinic.isActive ? "En configuración" : "Borrador, no publicado"} />
              <Fact label="Programa activo" value={programs === null ? MISSING : activeProgram ? `Versión ${activeProgram.version}` : "Sin programa activo"} />
              <Fact label="Tratamientos" value={formatCount((clinic.treatments ?? []).length)} />
              <Fact label="Solicitudes abiertas" value={openRequests === null ? MISSING : `${openRequests.count}${openRequests.more ? "+" : ""}`} />
              <Fact label="Niveles con miembros" value={metrics ? formatCount(metrics.totalTiers) : MISSING} />
              <Fact label="Nivel con más miembros" value={metrics?.leadingTier?.tier ?? MISSING} />
            </div>
          </Panel>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <RankingCard
            title="Top clientes este mes"
            eyebrow={monthLabel}
            icon={Trophy}
            rows={topClients.map((row) => ({ id: row.memberId, name: row.name, detail: "Visitas pagadas este mes", value: row.amount }))}
            emptyText={topClientsAvailable ? "Sin actividad este mes" : MISSING}
          />
          <RankingCard
            title="Top clientes all-time"
            eyebrow="Histórico"
            icon={ReceiptText}
            rows={(metrics?.topClientsAllTime ?? []).map((item) => ({ id: item.member.id, name: item.member.name, detail: item.member.tier, value: `${formatPoints(item.score)} pts` }))}
            emptyText={metrics ? "Sin clientes todavía" : MISSING}
          />
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-3xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Panel({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{eyebrow}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-[#b8864b]" />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3">
      <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#a47845]">{label}</span>
      <span className="mt-1 block text-sm font-semibold">{value}</span>
    </p>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-[#e4d8d1] bg-[#fffaf6]/70 px-4 py-3 text-sm text-[#806d63]">{children}</p>;
}
