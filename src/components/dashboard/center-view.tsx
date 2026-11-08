"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { useOpenRequestCount } from "@/features/change-requests/api/useChangeRequests";
import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import { useStaffProgram } from "@/features/program/api/useStaffProgram";
import { RequestIconButton } from "@/components/ui/request-icon-button";
import { ChangeRequestPanel } from "@/components/dashboard/change-request-panel";
import { useRestoreFocus } from "@/components/dashboard/use-restore-focus";
import { TreatmentsEditor } from "@/components/dashboard/treatments-editor";
import type { RequestContext } from "@/lib/change-request-form";
import type { MilestoneRewardsInput, TierRewardInput } from "@/lib/api-client";
import type { PresentedProgram } from "@/lib/onboarding-api";
import { formatEuros, formatProgress } from "@/lib/euros";
import { toPoints } from "@/lib/points";
import { cn } from "@/lib/utils";

interface CenterViewProps {
  /** Opens My Center and the Tarjeta Wallet tab (the clinic-edit permission). */
  canEdit: boolean;
  /** May ask Voone for changes to services, rewards and levels: the owner or a manager. */
  canRequest: boolean;
}

type CenterTab = "tratamientos" | "recompensas" | "niveles" | "referidos" | "tarjeta";

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
  /**
   * What a change request about this row points at: the ladder step (rewards) or the tier key
   * (levels). Absent on rows that are not part of a live programme, which cannot be requested.
   */
  milestone?: number;
  tier?: string;
  /** The referral step number (referrals). */
  referral?: number;
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
        ...(Number.isInteger(step.n) && step.n >= 1 ? { milestone: step.n } : {}),
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
      tier: tier.key,
    };
  });
}

const ordinal = (n: number): string => (n === 1 || n === 3 ? `${n}.er` : `${n}.º`);

/** The referral ladder: what the referrer earns at each referral, and the revenue it brings at least. */
function programReferralRows(program: PresentedProgram): SetupItem[] {
  return program.referrals.map((referral) => ({
    id: `program-referral-${referral.n}`,
    name: `Al ${ordinal(referral.n)} referido`,
    detail: referral.name,
    value: formatProgress(referral.minRevenue),
    referral: referral.n,
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
      value: `${formatNumber(milestone.pointsToNextMilestone)} puntos · ${formatEuros(milestone.pointsToNextMilestone / 10)}`,
    },
    {
      id: "points-conversion",
      name: "Conversión de puntos",
      detail: `Por cada ${formatEuros(milestone.priceAmount)}`,
      value: `${formatNumber(milestone.pointsAwarded)} puntos`,
    },
  ];
}

export function CenterView({ canEdit, canRequest }: CenterViewProps) {
  const currentClinic = useCurrentClinic();
  const clinic = currentClinic.data;
  const [tab, setTab] = React.useState<CenterTab>("tratamientos");
  // A centre with a live programme reads its rewards and levels from it; a 404 (null) means it is still
  // on the card design's own figures, which stay as the fallback.
  const staffProgram = useStaffProgram();
  const liveProgram = staffProgram.data?.program ?? null;
  const rewardRowsFromClinic = React.useMemo(() => liveProgram ? programRewardRows(liveProgram) : toRewardRows(clinic?.template?.tierRewards), [liveProgram, clinic?.template?.tierRewards]);
  const tierRowsFromClinic = React.useMemo(() => liveProgram ? programTierRows(liveProgram) : toTierRows(clinic?.template?.milestoneRewards), [liveProgram, clinic?.template?.milestoneRewards]);
  const referralRows = React.useMemo(() => (liveProgram ? programReferralRows(liveProgram) : []), [liveProgram]);
  const referralRowsKey = React.useMemo(() => rowsKey(referralRows), [referralRows]);
  const openRequests = useOpenRequestCount(canRequest);
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

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[#e2d5cc] bg-white/60 p-1">
        <button type="button" onClick={() => setTab("tratamientos")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "tratamientos" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Tratamientos</button>
        <button type="button" onClick={() => setTab("recompensas")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "recompensas" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Recompensas</button>
        <button type="button" onClick={() => setTab("niveles")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "niveles" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Niveles</button>
        <button type="button" onClick={() => setTab("referidos")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "referidos" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Referidos</button>
        {canEdit && clinic?.template?.id ? <button type="button" onClick={() => setTab("tarjeta")} className={cn("rounded-xl px-4 py-3 text-sm font-semibold transition", tab === "tarjeta" ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}>Tarjeta Wallet</button> : null}
      </div>
      {canRequest ? (
        <Link href="/dashboard/requests" className="inline-flex items-center gap-2 rounded-2xl border border-[#e2d5cc] bg-white/60 px-4 py-3 text-sm font-semibold text-[#806b60] transition hover:bg-[#f4e9df]">
          Mis solicitudes
          {openRequests.data ? <span className="rounded-full bg-[#b8864b] px-2 py-0.5 text-xs font-bold text-white" aria-label={`${openRequests.data} abiertas`}>{openRequests.data}</span> : null}
        </Link>
      ) : null}
      </div>

      {tab === "tratamientos" ? <TreatmentsEditor canEdit={canEdit} canRequest={canRequest} /> : null}
      {tab === "recompensas" ? (programFailed ? <ProgramLoadError /> : <SetupList key={`rewards-${rewardRowsKey}`} title="Recompensas" description="Premios y beneficios de tu programa de fidelización. Para cambiarlos, solicita un cambio." requestKind="reward" nameLabel="Premio o ventaja" valueLabel="Total gastado por el cliente" initialRows={rewardRowsFromClinic} canRequest={canRequest} isLoading={currentClinic.isPending || programLoading} />) : null}
      {tab === "niveles" ? (programFailed ? <ProgramLoadError /> : <SetupList key={`tiers-${tierRowsKey}`} title="Niveles" description="Niveles del programa y requisitos de acceso. Para cambiarlos, solicita un cambio." requestKind="level" nameLabel="Nivel" valueLabel={liveProgram ? "Puntos" : "Requisito (gasto · puntos)"} secondValueLabel={liveProgram ? "Total gastado" : undefined} initialRows={tierRowsFromClinic} canRequest={canRequest} isLoading={currentClinic.isPending || programLoading} />) : null}

      {tab === "referidos" ? (programFailed ? <ProgramLoadError /> : <SetupList key={`referrals-${referralRowsKey}`} title="Programa de referidos" description="Premios para quien recomienda tu centro, que se desbloquean con el primer tratamiento de pago de la persona recomendada. Para cambiarlos, solicita un cambio." requestKind="referral" nameLabel="Referido y premio" valueLabel="Ingresos generados (mín.)" initialRows={referralRows} canRequest={canRequest} isLoading={currentClinic.isPending || programLoading} />) : null}

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
  return rows.map((row) => `${row.id}:${row.name}:${row.detail}:${row.value}:${row.secondValue ?? ""}:${row.milestone ?? ""}:${row.tier ?? ""}:${row.referral ?? ""}`).join("|") || "empty";
}

function SetupList({ title, description, requestKind, nameLabel, valueLabel, secondValueLabel, initialRows, canRequest, isLoading }: { title: string; description: string; requestKind: "reward" | "level" | "referral"; nameLabel: string; valueLabel: string; secondValueLabel?: string; initialRows: SetupItem[]; canRequest: boolean; isLoading: boolean }) {
  const rows = initialRows;
  // "general" (the button at the top), a row id, or null. One request panel is open at a time.
  const [requesting, setRequesting] = React.useState<string | null>(null);
  const focus = useRestoreFocus();
  const open = (id: string, event: React.MouseEvent<HTMLElement>) => {
    focus.remember(event.currentTarget);
    setRequesting(id);
  };
  const close = () => {
    setRequesting(null);
    focus.restore();
  };
  // Referrals have no ticket type of their own, so they go as "other" with the step named.
  const rowContext = (row: SetupItem): RequestContext =>
    requestKind === "reward"
      ? { kind: "reward", milestone: row.milestone, label: row.name, detail: row.detail }
      : requestKind === "level"
        ? { kind: "level", tier: row.tier, label: row.name, detail: row.detail }
        : { kind: "other", title: `Cambio en el referido: ${row.name}`, label: row.name, detail: row.detail };
  const generalContext: RequestContext =
    requestKind === "reward"
      ? { kind: "reward" }
      : requestKind === "level"
        ? { kind: "level" }
        : { kind: "other", title: "Cambio en el programa de referidos", label: "Programa de referidos" };

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-[#e2d5cc] bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd8] p-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[#927e72]">{description}</p>
        </div>
        {canRequest ? <button type="button" onClick={(event) => open("general", event)} className="rounded-full bg-[#b8864b] px-4 py-2 text-sm font-semibold text-white"><Plus size={15} className="mr-1 inline" />Solicitar un cambio</button> : null}
      </div>

      {canRequest && requesting === "general" ? (
        <div className="border-b border-[#eadfd8]">
          <ChangeRequestPanel key="general" context={generalContext} onClose={close} />
        </div>
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

      {rows.length > 0 ? rows.map((row) => {
        // Only rows of a live programme point at something a ticket can name.
        const requestable = canRequest && (requestKind === "reward" ? row.milestone !== undefined : requestKind === "level" ? row.tier !== undefined : row.referral !== undefined);

        return (
          <div key={row.id} className="border-b border-[#eadfd8] last:border-0">
            <div className={cn(
              "grid items-center gap-3 px-5 py-4",
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
                  <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                    <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{row.secondValue ?? "—"}</span>
                    {requestable ? <RequestIconButton kind="edit" subject={row.name} onClick={(event) => open(row.id, event)} /> : null}
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                  <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{row.value}</span>
                  {requestable ? <RequestIconButton kind="edit" subject={row.name} onClick={(event) => open(row.id, event)} /> : null}
                </div>
              )}
            </div>
            {requestable && requesting === row.id ? (
              <div className="border-t border-[#eadfd8]">
                <ChangeRequestPanel key={row.id} context={rowContext(row)} onClose={close} />
              </div>
            ) : null}
          </div>
        );
      }) : <p className="px-5 py-4 text-sm text-[#927e72]">{isLoading ? "Cargando datos guardados durante el onboarding..." : "No hay datos guardados para esta sección."}</p>}
    </div>
  );
}
