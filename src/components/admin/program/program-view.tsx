"use client";

import * as React from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gift,
  Info,
  Pencil,
  Plus,
  Sparkles,
  Stethoscope,
  TrendingUp,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchPicker } from "@/components/ui/search-picker";
import { ApiError } from "@/lib/api-client";
import type {
  BenefitLine,
  BenefitOverrideEntry,
  SwapChoice,
  TextEdits,
  PresentedMilestone,
  PresentedProgram,
  PresentedTier,
  TierKey,
} from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import {
  LAST_LINE_NOTE,
  MAX_OVERRIDE_LENGTH,
  OVERRIDE_WARNING,
  customIndexOf,
  editLineOverride,
  hideLineOverride,
  isLastVisible,
  restoreLineOverride,
  showLineOverride,
  tierLines,
} from "./benefit-overrides";
import { MAX_BENEFIT_LENGTH, MAX_BENEFITS, replaceBenefit } from "./benefits";
import { EditableText, type TextsEditing } from "./editable-text";
import { formatEuros, formatProgress } from "@/lib/euros";
import { giftableItems, hiddenItemsNote } from "./giftable-items";
import { catalogPickerItems } from "./picker-items";
import { infoNotes, rewardValueLabel } from "./reward-value";
import { offersSwap } from "./swap-offer";
import { swapRefusalMessage } from "./swap-refusal";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TEXT_LENGTH,
  perkDescriptionEdit,
  perkNameEdit,
  recurringLabelEdit,
  referralTextEdit,
  rewardLabelEdit,
} from "./texts";

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

/** A catalogue row as the reward picker needs it. `giftable` comes from the backend. */
type CatalogItemOption = {
  externalId: string;
  name: string;
  priceEuro: number;
  giftable?: boolean;
  category?: string | null;
  isProduct?: boolean;
};

export function ProgramView({
  program,
  onSwap,
  onSetBenefits,
  onSetBenefitOverrides,
  onSetTexts,
  catalogItems = [],
}: {
  program: PresentedProgram;
  /** The centre's catalogue, offered as "any item" when changing a milestone's reward. */
  catalogItems?: CatalogItemOption[];
  /** Present only while the programme is a draft: an active one cannot be edited. */
  onSwap?: (milestone: number, choice: SwapChoice) => Promise<unknown>;
  /** Present only while the programme is a draft: replaces the benefits the centre wrote for a tier. */
  onSetBenefits?: (tier: TierKey, benefits: string[]) => Promise<unknown>;
  /**
   * Present only while the programme is a draft: changes the words of, or hides, the lines the
   * engine generates for a tier. Display only: the real benefit does not change.
   */
  onSetBenefitOverrides?: (
    tier: TierKey,
    overrides: BenefitOverrideEntry[],
  ) => Promise<unknown>;
  /** Present only while the programme is a draft: edits the words of referrals, perks and rewards. */
  onSetTexts?: (edits: TextEdits) => Promise<unknown>;
}) {
  const [textsBusy, setTextsBusy] = React.useState(false);
  // One text save at a time, screen-wide: each one rewrites the same draft.
  const texts: TextsEditing | undefined = onSetTexts
    ? {
        busy: textsBusy,
        save: async (edits) => {
          if (textsBusy) return;

          setTextsBusy(true);

          try {
            await onSetTexts(edits);
          } finally {
            setTextsBusy(false);
          }
        },
      }
    : undefined;
  const bands = [1, 2, 3, 4].map((band) => ({
    band,
    // A band is held while the client sits in the tier BEFORE the one it ends at.
    tier: program.tiers[band - 1],
    milestones: program.ladder.filter((m) => m.band === band),
  }));

  const notes = infoNotes(program);

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

      {notes.length > 0 ? (
        // Information, not a problem: calm styling, never an alert, and it never blocks anything.
        <div
          role="note"
          className="flex items-start gap-2 rounded-lg bg-secondary/60 p-4 text-sm leading-6 text-muted-foreground"
        >
          <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="grid gap-1">
            {notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
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

      {texts ? (
        <p className="rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
          Puedes cambiar los textos de los premios, las ventajas y los premios
          por referido con el lápiz. Los umbrales y los artículos no se pueden
          editar aquí. Los cambios en los textos se aplican a los premios que se
          emitan a partir de la publicación; los ya emitidos conservan su texto.
        </p>
      ) : null}

      <dl className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-3">
        <Fact
          label="Ticket medio"
          value={formatEuros(program.estimates.ticket)}
        />
        <Fact
          label="Visitas al año"
          value={program.estimates.visitsPerYear.toLocaleString("es-ES")}
        />
        <Fact
          label="Gasto anual de un cliente"
          value={formatEuros(program.estimates.annualSpend)}
        />
      </dl>

      <section aria-labelledby="tiers-heading" className="grid gap-4">
        <TierScroller title="Los cinco niveles">
          {program.tiers.map((tier) => (
            <article
              key={tier.key}
              className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4"
            >
              {/* Room for two lines of threshold, so every card's list starts at the same height. */}
              <div className="min-h-[4.5rem]">
                <p className="flex min-h-7 items-center gap-2 font-serif text-xl font-semibold leading-7">
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
                    ? ` y ${tier.minTenureMonths} meses como miembro`
                    : ""}
                </p>
              </div>
              <TierBenefits
                tier={tier}
                onSetBenefits={onSetBenefits}
                onSetBenefitOverrides={onSetBenefitOverrides}
              />
            </article>
          ))}
        </TierScroller>
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
                  texts={texts}
                  catalogItems={catalogItems}
                />
              ))}
            </ol>
          </div>
        ))}

        <div className="rounded-lg border border-dashed border-border p-4 text-sm leading-6">
          <p className="font-semibold">Después de Diamante</p>
          {texts ? (
            <div className="mt-1 grid gap-1 text-muted-foreground">
              <p>
                Por cada {formatProgress(program.recurring.every)} que gasta el
                cliente:
              </p>
              <EditableText
                value={program.recurring.name}
                label="el premio de después de Diamante"
                maxLength={MAX_TEXT_LENGTH}
                build={recurringLabelEdit}
                editing={texts}
                restorable
                className="font-semibold text-foreground"
              />
            </div>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Por cada {formatProgress(program.recurring.every)} que gasta el
              cliente: {program.recurring.name}.
            </p>
          )}
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
          {program.referrals.map((referral, index) => (
            <li
              key={referral.n}
              className="flex items-baseline justify-between gap-4 border-t border-border px-4 py-3 text-sm first:border-t-0"
            >
              <span className="min-w-0">
                <strong>Al {ordinal(referral.n)} referido:</strong>{" "}
                <EditableText
                  value={referral.name}
                  label={`el premio del ${ordinal(referral.n)} referido`}
                  maxLength={MAX_TEXT_LENGTH}
                  build={(text) => referralTextEdit(index, text ?? "")}
                  editing={texts}
                />
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

/**
 * A tier's benefit lines. The lines the engine generates and the ones the centre wrote are edited
 * and removed the same way, with one difference in what a change does:
 *
 * - A line the centre wrote is part of its own list: every change sends the tier's WHOLE list of
 *   custom benefits (the benefits route), so one save at a time.
 * - A generated line is DISPLAY ONLY: the change is an override of its words or of its visibility
 *   (the benefit-overrides route), the real discount, multiplier or perk keep working, and the
 *   screen says so before it saves. A hidden line stays listed, muted, so it can be shown again;
 *   an edited one is marked and can be restored.
 *
 * An older backend sends no `benefitLines`: the card then renders as it always did, with only the
 * centre's own lines changeable.
 */
/**
 * The tiers side by side in a snapping row, starting at the left edge with Bronce. Five columns at
 * once left each card too narrow for its edit and remove buttons, so the row scrolls; the arrows
 * step one card at a time.
 */
function TierScroller({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);
  const cards = React.Children.toArray(children);

  const updateEdges = React.useCallback(() => {
    const row = ref.current;
    if (!row) return;

    // A pixel of slack: fractional scroll positions never quite reach the end.
    setAtStart(row.scrollLeft <= 1);
    setAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 1);
  }, []);

  // The row may already fit (wide screen), so both arrows start from the real layout.
  React.useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const step = (direction: 1 | -1) => {
    const row = ref.current;
    const card = row?.children[0] as HTMLElement | undefined;
    if (!row || !card) return;

    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    // No behavior given: the row's own scroll-behavior applies, so reduced motion jumps.
    row.scrollBy({ left: direction * (card.offsetWidth + gap) });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 id="tiers-heading" className="font-serif text-2xl font-semibold">
          {title}
        </h3>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={atStart}
            onClick={() => step(-1)}
            aria-label="Nivel anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={atEnd}
            onClick={() => step(1)}
            aria-label="Nivel siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={ref}
        role="region"
        aria-label={title}
        tabIndex={0}
        onScroll={updateEdges}
        // Starts at the left edge, Bronce first, so no blank space sits before the cards.
        className="relative flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-3 outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:scroll-smooth"
      >
        {cards.map((card, index) => (
          <div key={index} className="w-72 shrink-0 snap-start">
            {card}
          </div>
        ))}
      </div>
    </>
  );
}

function TierBenefits({
  tier,
  onSetBenefits,
  onSetBenefitOverrides,
}: {
  tier: PresentedTier;
  onSetBenefits?: (tier: TierKey, benefits: string[]) => Promise<unknown>;
  onSetBenefitOverrides?: (
    tier: TierKey,
    overrides: BenefitOverrideEntry[],
  ) => Promise<unknown>;
}) {
  const { lines, overridable } = tierLines(tier);
  const canOverride = overridable && Boolean(onSetBenefitOverrides);
  const isDraft = Boolean(onSetBenefits || onSetBenefitOverrides);
  // On a programme that cannot be edited, only what clients actually read is listed.
  const listed = isDraft ? lines : lines.filter((line) => !line.hidden);
  const [active, setActive] = React.useState<{
    key: string;
    mode: "edit" | "hide";
  } | null>(null);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    setProblem(null);

    try {
      await action();
      return true;
    } catch (error) {
      setProblem(
        error instanceof ApiError && error.detail ? error.detail : failure,
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveCustom = (benefits: string[], failure: string) =>
    onSetBenefits
      ? run(() => onSetBenefits(tier.key, benefits), failure)
      : Promise.resolve(false);

  const saveOverride = (entry: BenefitOverrideEntry, failure: string) =>
    onSetBenefitOverrides
      ? run(() => onSetBenefitOverrides(tier.key, [entry]), failure)
      : Promise.resolve(false);

  const startEditing = (line: BenefitLine) => {
    setProblem(null);
    setDraft(line.text);
    setActive({ key: line.key, mode: "edit" });
  };

  const startHiding = (line: BenefitLine) => {
    setProblem(null);
    setActive({ key: line.key, mode: "hide" });
  };

  const cancel = () => {
    setActive(null);
    setProblem(null);
  };

  const confirmEditing = async (line: BenefitLine) => {
    if (busy) return;

    const customIndex = customIndexOf(line.key);
    let saved = false;

    if (line.kind === "custom") {
      if (customIndex === null) return;

      const edit = replaceBenefit(tier.customBenefits, customIndex, draft);

      if (!edit.ok) {
        setProblem(edit.error);
        return;
      }

      // Nothing changed: close without a request.
      if (edit.benefits[customIndex] === tier.customBenefits[customIndex]) {
        cancel();
        return;
      }

      saved = await saveCustom(
        edit.benefits,
        "No se ha podido guardar el cambio.",
      );
    } else {
      const edit = editLineOverride(line, draft);

      if (!edit.ok) {
        setProblem(edit.error);
        return;
      }

      // Nothing changed: close without a request.
      if (draft.trim() === line.text) {
        cancel();
        return;
      }

      saved = await saveOverride(
        edit.entry,
        "No se ha podido guardar el cambio.",
      );
    }

    if (saved) setActive(null);
  };

  const removeCustom = (line: BenefitLine) => {
    const customIndex = customIndexOf(line.key);

    if (busy || customIndex === null) return;

    void saveCustom(
      tier.customBenefits.filter((_, i) => i !== customIndex),
      "No se ha podido quitar.",
    ).then((saved) => {
      if (saved) setActive(null);
    });
  };

  const hideGenerated = async (line: BenefitLine) => {
    if (busy) return;

    if (await saveOverride(hideLineOverride(line), "No se ha podido quitar.")) {
      setActive(null);
    }
  };

  const undo = (entry: BenefitOverrideEntry) => {
    if (busy) return;

    void saveOverride(entry, "No se ha podido guardar el cambio.");
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      <ul className="grid gap-1.5 text-xs leading-5">
        {listed.map((line) => {
          const editable =
            line.kind === "custom"
              ? Boolean(onSetBenefits) && customIndexOf(line.key) !== null
              : canOverride;
          const isActive = editable && active?.key === line.key;

          if (isActive && active?.mode === "edit") {
            return (
              <li key={line.key} className="grid gap-1">
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={draft}
                    maxLength={
                      line.kind === "custom"
                        ? MAX_BENEFIT_LENGTH
                        : MAX_OVERRIDE_LENGTH
                    }
                    disabled={busy}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void confirmEditing(line);
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        cancel();
                      }
                    }}
                    aria-label={`Editar ${line.text}`}
                    className="min-w-0 flex-1 rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 shrink-0"
                    disabled={busy || !draft.trim()}
                    onClick={() => void confirmEditing(line)}
                    aria-label="Guardar cambio"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 shrink-0"
                    disabled={busy}
                    onClick={cancel}
                    aria-label="Cancelar"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {line.kind === "generated" ? (
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    {OVERRIDE_WARNING}
                  </p>
                ) : null}
              </li>
            );
          }

          if (isActive && active?.mode === "hide") {
            return (
              <li key={line.key} className="grid gap-1.5">
                <span>{line.text}</span>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  {OVERRIDE_WARNING}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    autoFocus
                    disabled={busy}
                    onClick={() => void hideGenerated(line)}
                  >
                    Quitar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={busy}
                    onClick={cancel}
                  >
                    Cancelar
                  </Button>
                </div>
              </li>
            );
          }

          return (
            <li
              key={line.key}
              className="flex flex-wrap items-start gap-x-2 gap-y-0.5"
            >
              <Check
                className={cn(
                  "mt-1 h-3 w-3 shrink-0",
                  line.hidden ? "text-muted-foreground" : "text-success",
                )}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 break-words pt-0.5",
                  line.hidden && "text-muted-foreground line-through",
                )}
              >
                {line.text}
                {line.hidden ? (
                  <span className="sr-only"> (oculto)</span>
                ) : null}
                {line.edited ? (
                  <span className="sr-only"> (editado)</span>
                ) : null}
              </span>
              {editable && !line.hidden ? (
                <span className="-mr-1 flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    aria-label={`Editar ${line.text}`}
                    title="Editar"
                    disabled={busy}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    onClick={() => startEditing(line)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Quitar ${line.text}`}
                    disabled={busy || isLastVisible(lines, line)}
                    title={
                      isLastVisible(lines, line) ? LAST_LINE_NOTE : "Quitar"
                    }
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    onClick={() =>
                      line.kind === "custom"
                        ? removeCustom(line)
                        : startHiding(line)
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : null}
              {line.edited ? (
                <span className="basis-full pl-5 text-[11px] leading-4 text-muted-foreground">
                  Original: {line.original}
                </span>
              ) : null}
              {editable && line.kind === "generated" ? (
                <span className="flex basis-full flex-wrap items-center gap-x-2 pl-5 text-[11px] text-muted-foreground">
                  {line.edited ? (
                    <Badge variant="secondary" aria-hidden="true">
                      editado
                    </Badge>
                  ) : null}
                  {line.edited ? (
                    <button
                      type="button"
                      aria-label={`Restaurar: ${line.original}`}
                      disabled={busy}
                      className="underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                      onClick={() => undo(restoreLineOverride(line))}
                    >
                      Restaurar
                    </button>
                  ) : null}
                  {line.hidden ? (
                    <button
                      type="button"
                      aria-label={`Mostrar de nuevo: ${line.original}`}
                      disabled={busy}
                      className="underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                      onClick={() => undo(showLineOverride(line))}
                    >
                      Mostrar de nuevo
                    </button>
                  ) : null}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {isDraft && listed.some((line) => isLastVisible(lines, line)) ? (
        <p className="text-[11px] leading-4 text-muted-foreground">
          {LAST_LINE_NOTE} Muestra otra línea o añade una propia para poder
          quitar esta.
        </p>
      ) : null}
      {problem ? (
        <p role="alert" className="text-[11px] text-destructive">
          {problem}
        </p>
      ) : null}
      {onSetBenefits ? (
        // Pinned to the foot of the card, so the input sits on the same line in every tier.
        <div className="mt-auto">
          <AddBenefit
            tier={tier}
            onSetBenefits={onSetBenefits}
            disabled={busy}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Adds one benefit the centre wrote itself to a tier. Text only: it changes nothing at runtime. */
function AddBenefit({
  tier,
  onSetBenefits,
  disabled = false,
}: {
  tier: PresentedTier;
  onSetBenefits: (tier: TierKey, benefits: string[]) => Promise<unknown>;
  /** While another change to this tier is being saved. */
  disabled?: boolean;
}) {
  const [text, setText] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const full = tier.customBenefits.length >= MAX_BENEFITS;

  const add = async () => {
    const value = text.trim();

    if (!value || disabled) return;

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
          disabled={full || disabled}
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
          disabled={full || disabled || !text.trim()}
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
  texts,
  catalogItems,
}: {
  catalogItems: CatalogItemOption[];
  milestone: PresentedMilestone;
  onSwap?: (milestone: number, choice: SwapChoice) => Promise<unknown>;
  texts?: TextsEditing;
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
  const valueLabel = reward ? rewardValueLabel(milestone) : null;
  const alternatives = reward?.alternatives ?? [];
  const PerkIcon = milestone.perk
    ? (PERK_ICON[milestone.perk.kind] ?? Sparkles)
    : Gift;

  // Only what the backend would accept; the rest is counted, not listed.
  const giftable = giftableItems(catalogItems);
  const giftableOptions = catalogPickerItems(giftable);
  const hiddenNote = hiddenItemsNote(catalogItems);

  const choose = async (choice: SwapChoice) => {
    if (!onSwap) return;

    setBusy(true);
    setProblem(null);

    try {
      await onSwap(milestone.n, choice);
      setOpen(false);
    } catch (error) {
      setProblem(
        swapRefusalMessage(error, "No se ha podido cambiar el premio."),
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
              {reward ? (
                <EditableText
                  value={reward.name}
                  label="el título del premio"
                  maxLength={MAX_TEXT_LENGTH}
                  build={(text) => rewardLabelEdit(milestone.n, text)}
                  editing={texts}
                  restorable
                />
              ) : milestone.perk ? (
                <EditableText
                  value={milestone.perk.name}
                  label="el nombre de la ventaja"
                  maxLength={MAX_TEXT_LENGTH}
                  build={(text) => perkNameEdit(milestone.n, text ?? "")}
                  editing={texts}
                />
              ) : null}
            </p>
            {reward ? (
              <p className="text-xs text-muted-foreground">
                Premio · mes {milestone.month}
                {valueLabel ? ` · ${valueLabel}` : ""}
              </p>
            ) : milestone.perk ? (
              <p className="text-xs leading-5 text-muted-foreground">
                <EditableText
                  value={milestone.perk.description}
                  label="la descripción de la ventaja"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  build={(text) => perkDescriptionEdit(milestone.n, text ?? "")}
                  editing={texts}
                />
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-right font-semibold">
            {formatProgress(milestone.realSpend)}
          </span>
          {offersSwap({
            hasReward: Boolean(reward),
            canSwap: Boolean(onSwap),
            alternatives: alternatives.length,
            catalogItems: catalogItems.length,
          }) ? (
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
            giftable.length > 0 ? (
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                O cualquier artículo del catálogo
                <SearchPicker
                  // Always empty: choosing swaps the reward at once and the list stays as it was.
                  value=""
                  disabled={busy}
                  onChange={(value) => {
                    if (value) void choose({ itemId: value });
                  }}
                  items={giftableOptions}
                  placeholder="Elegir…"
                  className="font-normal text-foreground"
                />
              </label>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ningún artículo del catálogo puede ser premio todavía.
              </p>
            )
          ) : null}
          {hiddenNote ? (
            <p className="text-xs text-muted-foreground">{hiddenNote}</p>
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
