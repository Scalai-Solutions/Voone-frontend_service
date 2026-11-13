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
  PenLine,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  RewardKind,
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
import {
  FREE_REWARD_MAX_NAME,
  REWARD_KINDS,
  isProductRow,
  parseFreeReward,
  parseSpend,
  rewardKindOf,
  spendRangeLabel,
} from "./reward-kinds";
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

type Icon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/**
 * One icon per kind of reward, on the row and in the "Cambiar" panel alike, so a reward always
 * shows what it is. Double points and a surprise look the same whether the engine placed them as
 * a perk or the admin chose them for a reward.
 */
const REWARD_ICON: Record<RewardKind, Icon> = {
  tratamiento: Sparkles,
  producto: ShoppingBag,
  doble: Zap,
  sorpresa: Gift,
  libre: PenLine,
};

const PERK_ICON: Record<string, Icon> = {
  doble: REWARD_ICON.doble,
  sorpresa: REWARD_ICON.sorpresa,
  diag: Stethoscope,
  mejora: TrendingUp,
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
  onSetThreshold,
  onAddMilestone,
  onRemoveMilestone,
  onSwapRecurring,
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
  /** Present only while the programme is a draft: moves the spend of a reward, perk or tier step. */
  onSetThreshold?: (milestone: number, realSpend: number) => Promise<unknown>;
  /** Present only while the programme is a draft: adds a reward to a tier band at a spend. */
  onAddMilestone?: (band: number, realSpend: number, choice: PanelChoice) => Promise<unknown>;
  /** Present only while the programme is a draft: removes a reward or perk from the ladder. */
  onRemoveMilestone?: (milestone: number) => Promise<unknown>;
  /** Present only while the programme is a draft: changes what the reward after Diamante is. */
  onSwapRecurring?: (choice: PanelChoice) => Promise<unknown>;
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
          por referido con el lápiz. En cada premio, «Cambiar» elige qué se
          regala, el lápiz junto al importe cambia el gasto con el que se
          consigue (también el de cada subida de nivel) y la papelera lo quita;
          «Añadir» suma un premio al nivel. Los cambios en los textos se aplican
          a los premios que se emitan a partir de la publicación; los ya
          emitidos conservan su texto.
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
          <Band
            key={band}
            band={band}
            tier={tier}
            milestones={milestones}
            onSwap={onSwap}
            onSetThreshold={onSetThreshold}
            onAddMilestone={onAddMilestone}
            onRemoveMilestone={onRemoveMilestone}
            texts={texts}
            catalogItems={catalogItems}
          />
        ))}

        <RecurringReward
          recurring={program.recurring}
          onSwap={onSwapRecurring}
          texts={texts}
          catalogItems={catalogItems}
        />
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

/** What the "Cambiar" panel can choose: everything but an engine alternative. */
type PanelChoice = Exclude<SwapChoice, { alternative: number }>;

/** One tier band of the ladder: its rows, and the "Añadir" form for a new reward. */
function Band({
  band,
  tier,
  milestones,
  onSwap,
  onSetThreshold,
  onAddMilestone,
  onRemoveMilestone,
  texts,
  catalogItems,
}: {
  band: number;
  tier: PresentedTier;
  milestones: PresentedMilestone[];
  onSwap?: (milestone: number, choice: SwapChoice) => Promise<unknown>;
  onSetThreshold?: (milestone: number, realSpend: number) => Promise<unknown>;
  onAddMilestone?: (band: number, realSpend: number, choice: PanelChoice) => Promise<unknown>;
  onRemoveMilestone?: (milestone: number) => Promise<unknown>;
  texts?: TextsEditing;
  catalogItems: CatalogItemOption[];
}) {
  const [adding, setAdding] = React.useState(false);
  const [spendText, setSpendText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const range = tier.addRange;

  const add = async (choice: PanelChoice) => {
    if (!onAddMilestone) return;

    // The spend is asked first, so a catalogue pick never adds a reward at a spend left blank.
    const spend = parseSpend(spendText, range);

    if (!spend.ok) {
      setProblem(spend.problem);

      return;
    }

    setBusy(true);
    setProblem(null);

    try {
      await onAddMilestone(band, spend.realSpend, choice);
      setAdding(false);
      setSpendText("");
    } catch (error) {
      setProblem(swapRefusalMessage(error, "No se ha podido añadir el premio."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 bg-secondary/60 px-4 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>
            {tier.threshold > 0
              ? `${tier.label} · desde ${formatProgress(tier.threshold)}`
              : tier.label}
          </span>
        </p>
        {onAddMilestone && range ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            aria-expanded={adding}
            aria-label={`Añadir un premio a ${tier.label}`}
            onClick={() => {
              setProblem(null);
              setAdding((current) => !current);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
            <span>Añadir</span>
          </Button>
        ) : null}
      </div>
      <ol>
        {milestones.map((milestone) => (
          <MilestoneRow
            key={milestone.n}
            milestone={milestone}
            onSwap={onSwap}
            onSetThreshold={onSetThreshold}
            onRemoveMilestone={onRemoveMilestone}
            texts={texts}
            catalogItems={catalogItems}
          />
        ))}
      </ol>
      {adding && range ? (
        <div className="border-t border-border px-4 py-3">
          <RewardChoicePanel
            catalogItems={catalogItems}
            initialMode="tratamiento"
            busy={busy}
            problem={problem}
            onChoose={(choice) => void add(choice)}
            header={
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                <span>El cliente ha gastado (€)</span>
                <Input
                  inputMode="numeric"
                  autoFocus
                  value={spendText}
                  disabled={busy}
                  onChange={(event) => setSpendText(event.target.value)}
                  className="h-9 w-32 font-normal text-foreground"
                />
                <span className="font-normal">
                  <span>{`${spendRangeLabel(range)}. Después elige qué se regala.`}</span>
                </span>
              </label>
            }
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * The five things a reward can be, as one panel: the "Cambiar" of a row and the "Añadir" of a band
 * both use it. It keeps which option is open and the free text being typed; the parent saves.
 */
function RewardChoicePanel({
  catalogItems,
  initialMode,
  currentKind,
  initialFreeName = "",
  busy,
  problem,
  onChoose,
  header,
}: {
  catalogItems: CatalogItemOption[];
  initialMode: RewardKind;
  /** What the row is now; absent when adding. Says "already" instead of offering it again. */
  currentKind?: RewardKind;
  initialFreeName?: string;
  busy: boolean;
  problem: string | null;
  onChoose: (choice: PanelChoice) => void;
  header?: React.ReactNode;
}) {
  const [mode, setMode] = React.useState<RewardKind>(initialMode);
  const [freeName, setFreeName] = React.useState(initialFreeName);
  const [freePrice, setFreePrice] = React.useState("");
  const [localProblem, setLocalProblem] = React.useState<string | null>(null);

  // Only what the backend would accept; the rest is counted, not listed.
  const giftable = giftableItems(catalogItems);
  const treatmentOptions = catalogPickerItems(
    giftable.filter((row) => !isProductRow(row)),
  );
  const productOptions = catalogPickerItems(giftable.filter(isProductRow));
  const hiddenNote = hiddenItemsNote(catalogItems);
  const shownProblem = localProblem ?? problem;

  const choose = (choice: PanelChoice) => {
    setLocalProblem(null);
    onChoose(choice);
  };

  const saveFree = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = parseFreeReward(freeName, freePrice);

    if (!parsed.ok) {
      setLocalProblem(parsed.problem);

      return;
    }

    choose({ kind: "libre", name: parsed.name, priceEuro: parsed.priceEuro });
  };

  const catalogPicker = (
    options: ReturnType<typeof catalogPickerItems>,
    none: string,
  ) =>
    catalogItems.length === 0 ? (
      <p className="text-xs text-muted-foreground">
        El catálogo del centro todavía no tiene artículos.
      </p>
    ) : options.length > 0 ? (
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        Elige del catálogo
        <SearchPicker
          // Always empty: choosing saves at once and the list stays as it was.
          value=""
          disabled={busy}
          onChange={(value) => {
            if (value) choose({ itemId: value });
          }}
          items={options}
          placeholder="Elegir…"
          className="font-normal text-foreground"
        />
      </label>
    ) : (
      <p className="text-xs text-muted-foreground">{none}</p>
    );

  return (
    <div className="grid gap-3 rounded-md bg-secondary/50 p-3">
      {header}
      <div
        role="group"
        aria-label="Qué se regala"
        className="grid grid-cols-2 gap-2 sm:grid-cols-5"
      >
        {REWARD_KINDS.map((option) => {
          const OptionIcon = REWARD_ICON[option.kind];
          const selected = mode === option.kind;

          return (
            <button
              key={option.kind}
              type="button"
              aria-pressed={selected}
              disabled={busy}
              onClick={() => {
                setMode(option.kind);
                setLocalProblem(null);
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border bg-card px-2 py-2 text-center text-xs font-semibold leading-tight transition-colors disabled:opacity-50",
                selected
                  ? "border-primary text-foreground ring-1 ring-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <OptionIcon
                aria-hidden
                className={cn("h-4 w-4", selected ? "text-gold" : "")}
              />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {mode === "tratamiento"
        ? catalogPicker(
            treatmentOptions,
            "Ningún tratamiento del catálogo puede ser premio todavía.",
          )
        : null}

      {mode === "producto"
        ? catalogPicker(
            productOptions,
            "Ningún producto del catálogo puede ser premio todavía.",
          )
        : null}

      {mode === "doble" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-xs leading-5 text-muted-foreground">
            El cliente suma el doble de puntos en su siguiente visita de pago.
            Se aplica sola: no hay que canjearla en recepción.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={busy || currentKind === "doble"}
            onClick={() => choose({ kind: "doble" })}
          >
            <span key={currentKind === "doble" ? "ya" : "usar"}>
              {currentKind === "doble"
                ? "Ya son puntos dobles"
                : "Usar puntos dobles"}
            </span>
          </Button>
        </div>
      ) : null}

      {mode === "sorpresa" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-xs leading-5 text-muted-foreground">
            Al canjearlo, recepción elige el regalo entre cualquier artículo del
            catálogo que pueda ser premio.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => choose({ kind: "sorpresa" })}
          >
            <span key={currentKind === "sorpresa" ? "actualizar" : "usar"}>
              {currentKind === "sorpresa"
                ? "Actualizar con el catálogo de hoy"
                : "Usar premio sorpresa"}
            </span>
          </Button>
        </div>
      ) : null}

      {mode === "libre" ? (
        <form onSubmit={saveFree} className="grid gap-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_9rem]">
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Qué se regala
              <Input
                value={freeName}
                maxLength={FREE_REWARD_MAX_NAME}
                disabled={busy}
                placeholder="Ej.: Manicura de regalo"
                onChange={(event) => setFreeName(event.target.value)}
                className="h-9 font-normal text-foreground"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Precio (€)
              <Input
                inputMode="decimal"
                value={freePrice}
                disabled={busy}
                placeholder="0,00"
                onChange={(event) => setFreePrice(event.target.value)}
                className="h-9 font-normal text-foreground"
              />
            </label>
          </div>
          <div>
            <Button type="submit" size="sm" disabled={busy}>
              Guardar
            </Button>
          </div>
        </form>
      ) : null}

      {hiddenNote && (mode === "tratamiento" || mode === "producto") ? (
        <p className="text-xs text-muted-foreground">{hiddenNote}</p>
      ) : null}
      {shownProblem ? (
        <p role="alert" className="text-xs text-destructive">
          <span>{shownProblem}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * The reward that repeats after Diamante: its name (the text pencil), and on a draft "Cambiar", the
 * same five options as a ladder reward.
 */
function RecurringReward({
  recurring,
  onSwap,
  texts,
  catalogItems,
}: {
  recurring: PresentedProgram["recurring"];
  onSwap?: (choice: PanelChoice) => Promise<unknown>;
  texts?: TextsEditing;
  catalogItems: CatalogItemOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const kind = rewardKindOf(recurring);
  const KindIcon = REWARD_ICON[kind];

  const choose = async (choice: PanelChoice) => {
    if (!onSwap) return;

    setBusy(true);
    setProblem(null);

    try {
      await onSwap(choice);
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
    <div className="rounded-lg border border-dashed border-border p-4 text-sm leading-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">Después de Diamante</p>
          <div className="mt-1 grid gap-1 text-muted-foreground">
            <p>
              <span>{`Por cada ${formatProgress(recurring.every)} que gasta el cliente:`}</span>
            </p>
            <p className="flex items-start gap-2">
              <KindIcon
                aria-hidden
                className="mt-1 h-4 w-4 shrink-0 text-gold"
              />
              <EditableText
                value={recurring.name}
                label="el premio de después de Diamante"
                maxLength={MAX_TEXT_LENGTH}
                build={recurringLabelEdit}
                editing={texts}
                restorable
                className="font-semibold text-foreground"
              />
            </p>
            {recurring.description ? (
              <p className="text-xs leading-5">
                <span>{recurring.description}</span>
              </p>
            ) : null}
          </div>
        </div>
        {onSwap ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            aria-expanded={open}
            onClick={() => {
              setProblem(null);
              setOpen((current) => !current);
            }}
          >
            <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />{" "}
            <span>Cambiar</span>
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-3">
          <RewardChoicePanel
            catalogItems={catalogItems}
            initialMode={kind}
            currentKind={recurring.kind ? kind : undefined}
            initialFreeName={kind === "libre" ? recurring.name : ""}
            busy={busy}
            problem={problem}
            onChoose={(choice) => void choose(choice)}
          />
        </div>
      ) : null}
    </div>
  );
}

function MilestoneRow({
  milestone,
  onSwap,
  onSetThreshold,
  onRemoveMilestone,
  texts,
  catalogItems,
}: {
  catalogItems: CatalogItemOption[];
  milestone: PresentedMilestone;
  onSwap?: (milestone: number, choice: SwapChoice) => Promise<unknown>;
  onSetThreshold?: (milestone: number, realSpend: number) => Promise<unknown>;
  onRemoveMilestone?: (milestone: number) => Promise<unknown>;
  texts?: TextsEditing;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [editingSpend, setEditingSpend] = React.useState(false);
  const [spendText, setSpendText] = React.useState("");
  const [spendBusy, setSpendBusy] = React.useState(false);
  const [spendProblem, setSpendProblem] = React.useState<string | null>(null);

  const reward = milestone.reward;
  const kind = rewardKindOf(reward);
  const valueLabel = reward ? rewardValueLabel(milestone) : null;
  const RowIcon: Icon = reward
    ? REWARD_ICON[kind]
    : milestone.perk
      ? (PERK_ICON[milestone.perk.kind] ?? Gift)
      : Gift;
  const range = milestone.spendRange;
  // Every row with room may move, tier steps included; an older backend sends no range for one.
  const canMoveSpend = Boolean(onSetThreshold && range);
  const isStep = milestone.type === "nivel";
  const perkKind = milestone.perk?.kind;
  // Opens on what the row is now. A perk opens on double points or the surprise when it is one.
  const initialMode: RewardKind = reward
    ? kind
    : perkKind === "doble" || perkKind === "sorpresa"
      ? perkKind
      : "tratamiento";

  const togglePanel = () => {
    setProblem(null);
    setEditingSpend(false);
    setOpen((current) => !current);
  };

  const choose = async (choice: PanelChoice) => {
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

  const remove = async () => {
    if (!onRemoveMilestone) return;

    const name = reward?.name ?? milestone.perk?.name ?? "este hito";

    if (!window.confirm(`¿Quitar «${name}» de la escalera?`)) return;

    setBusy(true);
    setProblem(null);

    try {
      await onRemoveMilestone(milestone.n);
    } catch (error) {
      setProblem(swapRefusalMessage(error, "No se ha podido quitar el hito."));
      setBusy(false);
    }
  };

  const startSpend = () => {
    setSpendText(String(milestone.realSpend));
    setSpendProblem(null);
    setOpen(false);
    setEditingSpend(true);
  };

  const saveSpend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!onSetThreshold) return;

    const parsed = parseSpend(spendText, range);

    if (!parsed.ok) {
      setSpendProblem(parsed.problem);

      return;
    }

    if (parsed.realSpend === milestone.realSpend) {
      setEditingSpend(false);

      return;
    }

    setSpendBusy(true);
    setSpendProblem(null);

    try {
      await onSetThreshold(milestone.n, parsed.realSpend);
      setEditingSpend(false);
    } catch (error) {
      setSpendProblem(
        swapRefusalMessage(error, "No se ha podido cambiar el gasto."),
      );
    } finally {
      setSpendBusy(false);
    }
  };

  const spendButton = canMoveSpend ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      aria-label={
        isStep
          ? `Cambiar el gasto con el que se sube a ${milestone.tier?.label ?? "este nivel"}`
          : "Cambiar el gasto con el que se consigue"
      }
      aria-expanded={editingSpend}
      disabled={spendBusy}
      onClick={() => (editingSpend ? setEditingSpend(false) : startSpend())}
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden />
    </Button>
  ) : null;

  const spendForm =
    editingSpend && range ? (
      <form
        onSubmit={(event) => void saveSpend(event)}
        className="mt-3 grid gap-2 rounded-md bg-secondary/50 p-3"
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            El cliente ha gastado (€)
            <Input
              inputMode="numeric"
              autoFocus
              value={spendText}
              disabled={spendBusy}
              onChange={(event) => setSpendText(event.target.value)}
              className="h-9 w-32 font-normal text-foreground"
            />
          </label>
          <Button type="submit" size="sm" disabled={spendBusy}>
            <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            <span>Guardar</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={spendBusy}
            onClick={() => setEditingSpend(false)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            <span>Cancelar</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <span>
            {isStep
              ? `${spendRangeLabel(range)}. Las demás filas conservan su gasto.`
              : `${spendRangeLabel(range)}: tiene que quedar entre las filas de arriba y de abajo.`}
          </span>
        </p>
        {spendProblem ? (
          <p role="alert" className="text-xs text-destructive">
            <span>{spendProblem}</span>
          </p>
        ) : null}
      </form>
    ) : null;

  if (isStep) {
    return (
      <li className="border-t border-border bg-primary/10 px-4 py-3 text-sm font-semibold first:border-t-0">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" />{" "}
            <span>Subes a {milestone.tier?.label}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-right">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mes {milestone.month}
              </span>
              <span>{formatProgress(milestone.realSpend)}</span>
            </span>
            {spendButton}
          </div>
        </div>
        <div className="font-normal">{spendForm}</div>
      </li>
    );
  }

  return (
    <li className="border-t border-border px-4 py-3 text-sm first:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <RowIcon
            aria-hidden
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
              <>
                {/*
                  Every piece of text that can change or disappear is its own element, never a
                  bare text node: Chrome's page translation swaps text nodes for <font> wrappers,
                  and React then fails with "removeChild: not a child" when one goes away (the
                  value line does when a reward becomes double points), taking the page down.
                */}
                <p className="text-xs text-muted-foreground">
                  <span>{`Premio · mes ${milestone.month}`}</span>
                  {valueLabel ? <span>{` · ${valueLabel}`}</span> : null}
                </p>
                {reward.description ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {reward.description}
                  </p>
                ) : null}
              </>
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

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-right font-semibold">
            <span>{formatProgress(milestone.realSpend)}</span>
          </span>
          {spendButton}
          {offersSwap({
            hasReward: Boolean(reward),
            hasPerk: Boolean(milestone.perk),
            canSwap: Boolean(onSwap),
          }) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={open}
              onClick={togglePanel}
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />{" "}
              <span>Cambiar</span>
            </Button>
          ) : null}
          {onRemoveMilestone ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Quitar de la escalera"
              disabled={busy}
              onClick={() => void remove()}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      {spendForm}

      {open ? (
        <div className="mt-3">
          <RewardChoicePanel
            catalogItems={catalogItems}
            initialMode={initialMode}
            currentKind={reward ? kind : undefined}
            initialFreeName={kind === "libre" && reward ? reward.name : ""}
            busy={busy}
            problem={problem}
            onChoose={(choice) => void choose(choice)}
          />
        </div>
      ) : problem ? (
        // A refused removal, when the panel is closed.
        <p role="alert" className="mt-2 text-xs text-destructive">
          <span>{problem}</span>
        </p>
      ) : null}
    </li>
  );
}
