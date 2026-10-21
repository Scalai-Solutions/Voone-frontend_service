"use client";

import * as React from "react";
import {
  ArrowRightLeft,
  Check,
  Crown,
  Gift,
  Plus,
  Sparkles,
  Stethoscope,
  TrendingUp,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import type {
  SwapChoice,
  PresentedMilestone,
  PresentedProgram,
  PresentedTier,
  TierKey,
} from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import { formatEuro, formatProgress } from "./format";

/**
 * A programme, as a centre reads it.
 *
 * Built only from the presented programme, which the backend assembles WITHOUT any cost, so this
 * screen cannot show one however it is changed: the guide is explicit that costs and revenue are
 * internal. Voone's own figures are not on this screen at all.
 */

const PERK_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  doble: Sparkles,
  diag: Stethoscope,
  mejora: TrendingUp,
  sorpresa: Gift,
};

const ordinal = (n: number): string =>
  n === 1 || n === 3 ? `${n}.er` : `${n}.º`;

export function ProgramView({
  program,
  onSwap,
  onSetBenefits,
  catalogItems = [],
}: {
  program: PresentedProgram;
  /** The centre's catalogue, offered as "any item" when changing a milestone's reward. */
  catalogItems?: Array<{ externalId: string; name: string; priceEuro: number }>;
  /** Present only while the programme is a draft: an active one cannot be edited. */
  onSwap?: (milestone: number, choice: SwapChoice) => Promise<unknown>;
  /** Present only while the programme is a draft: replaces the benefits the centre wrote for a tier. */
  onSetBenefits?: (tier: TierKey, benefits: string[]) => Promise<unknown>;
}) {
  const bands = [1, 2, 3, 4].map((band) => ({
    band,
    // A band is held while the client sits in the tier BEFORE the one it ends at.
    tier: program.tiers[band - 1],
    milestones: program.ladder.filter((m) => m.band === band),
  }));

  return (
    <div className="grid gap-8">
      {program.review.length > 0 ? (
        <div
          role="alert"
          className="grid gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
        >
          <p className="text-sm font-semibold">
            Hay que resolver esto antes de activar el programa
          </p>
          {program.review.map((note) => (
            <p key={note} className="text-sm leading-6">
              {note}
            </p>
          ))}
        </div>
      ) : null}

      {program.adaptations.length > 0 ? (
        <div className="grid gap-2 rounded-lg bg-secondary/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Cómo se ha adaptado a tu catálogo
          </p>
          {program.adaptations.map((note) => (
            <p key={note} className="text-sm leading-6 text-muted-foreground">
              {note}
            </p>
          ))}
        </div>
      ) : null}

      <dl className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-3">
        <Fact
          label="Ticket medio"
          value={formatEuro(program.estimates.ticket)}
        />
        <Fact
          label="Visitas al año"
          value={program.estimates.visitsPerYear.toLocaleString("es-ES")}
        />
        <Fact
          label="Gasto anual de un cliente"
          value={formatEuro(program.estimates.annualSpend)}
        />
      </dl>

      <section aria-labelledby="tiers-heading" className="grid gap-4">
        <h3 id="tiers-heading" className="font-serif text-2xl font-semibold">
          Los cinco niveles
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {program.tiers.map((tier) => (
            <article
              key={tier.key}
              className="grid content-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="flex items-center gap-2 font-serif text-xl font-semibold">
                  {tier.key === "diamante" ? (
                    <Crown className="h-4 w-4 text-gold" />
                  ) : null}
                  <span>{tier.label}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tier.threshold === 0
                    ? "Desde el primer día"
                    : `Desde ${formatProgress(tier.threshold)} gastados`}
                  {tier.minTenureMonths
                    ? ` y ${tier.minTenureMonths} meses como socia`
                    : ""}
                </p>
              </div>
              <ul className="grid gap-1.5 text-xs leading-5">
                {tier.benefits.map((benefit, index) => {
                  const customIndex =
                    index - (tier.benefits.length - tier.customBenefits.length);

                  return (
                    <li key={`${benefit}-${index}`} className="flex gap-2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                      <span className="min-w-0 flex-1">{benefit}</span>
                      {onSetBenefits && customIndex >= 0 ? (
                        <button
                          type="button"
                          aria-label={`Quitar ${benefit}`}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            void onSetBenefits(
                              tier.key,
                              tier.customBenefits.filter(
                                (_, i) => i !== customIndex,
                              ),
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {onSetBenefits ? (
                <AddBenefit tier={tier} onSetBenefits={onSetBenefits} />
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="ladder-heading" className="grid gap-4">
        <div>
          <h3 id="ladder-heading" className="font-serif text-2xl font-semibold">
            La escalera de premios
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada fila es algo que el cliente consigue.
          </p>
        </div>

        <ColumnHeader>El cliente ha gastado</ColumnHeader>

        {bands.map(({ band, tier, milestones }) => (
          <div
            key={band}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <p className="bg-secondary/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {tier.label}
              {tier.threshold > 0
                ? ` · desde ${formatProgress(tier.threshold)}`
                : ""}
            </p>
            <ol>
              {milestones.map((milestone) => (
                <MilestoneRow
                  key={milestone.n}
                  milestone={milestone}
                  onSwap={onSwap}
                  catalogItems={catalogItems}
                />
              ))}
            </ol>
          </div>
        ))}

        <div className="rounded-lg border border-dashed border-border p-4 text-sm leading-6">
          <p className="font-semibold">Después de Diamante</p>
          <p className="mt-1 text-muted-foreground">
            Por cada {formatProgress(program.recurring.every)} que gasta el
            cliente: {program.recurring.name}.
          </p>
        </div>
      </section>

      <section aria-labelledby="referrals-heading" className="grid gap-4">
        <h3
          id="referrals-heading"
          className="font-serif text-2xl font-semibold"
        >
          Programa de referidos
        </h3>
        <p className="text-sm text-muted-foreground">
          Los premios son para quien recomienda. La persona recomendada no
          recibe ese premio: empieza con{" "}
          {formatProgress(program.welcomeProgress)} ya conseguidos. Su primer
          tratamiento de pago es lo que desbloquea el premio de quien la
          recomendó.
        </p>
        <ColumnHeader>Has generado como mínimo</ColumnHeader>
        <ol className="overflow-hidden rounded-lg border border-border bg-card">
          {program.referrals.map((referral) => (
            <li
              key={referral.n}
              className="flex items-baseline justify-between gap-4 border-t border-border px-4 py-3 text-sm first:border-t-0"
            >
              <span>
                <strong>Al {ordinal(referral.n)} referido:</strong>{" "}
                {referral.name}
              </span>
              <span className="shrink-0 text-right font-semibold">
                {formatProgress(referral.minRevenue)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-label={program.familyAndFriends.title}
        className="rounded-lg border border-border bg-card p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h3
            className={cn(
              "font-serif text-xl font-semibold",
              program.familyAndFriends.comingSoon && "text-muted-foreground",
            )}
          >
            {program.familyAndFriends.title}
          </h3>
          {program.familyAndFriends.comingSoon ? (
            <Badge variant="secondary">Próximamente</Badge>
          ) : null}
        </div>
        {/* Dimmed and inert while it is not available: no actions or inputs belong in here. */}
        <p
          className={cn(
            "mt-2 max-w-2xl text-sm leading-6 text-muted-foreground",
            program.familyAndFriends.comingSoon && "opacity-60",
          )}
        >
          {program.familyAndFriends.description}
        </p>
      </section>
    </div>
  );
}

/** Adds one benefit the centre wrote itself to a tier. Text only: it changes nothing at runtime. */
function AddBenefit({
  tier,
  onSetBenefits,
}: {
  tier: PresentedTier;
  onSetBenefits: (tier: TierKey, benefits: string[]) => Promise<unknown>;
}) {
  const [text, setText] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const full = tier.customBenefits.length >= 6;

  const add = async () => {
    const value = text.trim();

    if (!value) return;

    setProblem(null);

    try {
      await onSetBenefits(tier.key, [...tier.customBenefits, value]);
      setText("");
    } catch (error) {
      setProblem(
        error instanceof ApiError && error.detail
          ? error.detail
          : "No se ha podido añadir.",
      );
    }
  };

  return (
    <div className="grid gap-1">
      <div className="flex gap-1.5">
        <input
          value={text}
          maxLength={80}
          disabled={full}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void add();
            }
          }}
          placeholder={full ? "Máximo 6 propios" : "Añadir un beneficio"}
          aria-label={`Añadir un beneficio a ${tier.label}`}
          className="min-w-0 flex-1 rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7"
          disabled={full || !text.trim()}
          onClick={() => void add()}
          aria-label="Añadir"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {problem ? (
        <p role="alert" className="text-[11px] text-destructive">
          {problem}
        </p>
      ) : null}
    </div>
  );
}

/** A column's title, stated once above the list instead of on every row. */
function ColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="-mb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a47845]">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function MilestoneRow({
  milestone,
  onSwap,
  catalogItems,
}: {
  catalogItems: Array<{ externalId: string; name: string; priceEuro: number }>;
  milestone: PresentedMilestone;
  onSwap?: (milestone: number, choice: SwapChoice) => Promise<unknown>;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);

  if (milestone.type === "nivel") {
    return (
      <li className="flex items-center justify-between gap-4 border-t border-border bg-primary/10 px-4 py-3 text-sm font-semibold first:border-t-0">
        <span className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-gold" />{" "}
          <span>Subes a {milestone.tier?.label}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mes {milestone.month}
          </span>
          {formatProgress(milestone.realSpend)}
        </span>
      </li>
    );
  }

  const reward = milestone.reward;
  const alternatives = reward?.alternatives ?? [];
  const PerkIcon = milestone.perk
    ? (PERK_ICON[milestone.perk.kind] ?? Sparkles)
    : Gift;

  const choose = async (choice: SwapChoice) => {
    if (!onSwap) return;

    setBusy(true);
    setProblem(null);

    try {
      await onSwap(milestone.n, choice);
      setOpen(false);
    } catch (error) {
      setProblem(
        error instanceof ApiError && error.detail
          ? error.detail
          : "No se ha podido cambiar el premio.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="border-t border-border px-4 py-3 text-sm first:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <PerkIcon
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              reward ? "text-gold" : "text-muted-foreground",
            )}
          />
          <div className="min-w-0">
            <p className="font-semibold">
              {reward ? reward.name : milestone.perk?.name}
            </p>
            {reward ? (
              <p className="text-xs text-muted-foreground">
                Premio · mes {milestone.month}
              </p>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                {milestone.perk?.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-right font-semibold">
            {formatProgress(milestone.realSpend)}
          </span>
          {onSwap && (alternatives.length > 0 || catalogItems.length > 0) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />{" "}
              <span>Cambiar</span>
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="mt-3 grid gap-2 rounded-md bg-secondary/50 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Alternativas sugeridas
          </p>
          {alternatives.map((alternative, index) => (
            <div
              key={alternative.name}
              className="flex items-center justify-between gap-3"
            >
              <span>{alternative.name}</span>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => void choose({ alternative: index })}
              >
                Usar este
              </Button>
            </div>
          ))}
          {catalogItems.length > 0 ? (
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              O cualquier artículo del catálogo
              <select
                value=""
                disabled={busy}
                onChange={(event) => {
                  if (event.target.value) void choose({ itemId: event.target.value });
                }}
                className="h-9 rounded-md border border-input bg-card px-2 text-sm font-normal text-foreground"
              >
                <option value="">Elegir…</option>
                {catalogItems.map((item) => (
                  <option key={item.externalId} value={item.externalId}>
                    {item.name} · {item.priceEuro.toLocaleString("es-ES")} €
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {problem ? (
            <p role="alert" className="text-xs text-destructive">
              {problem}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
