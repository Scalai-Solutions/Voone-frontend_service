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
  Percent,
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
  SwapChoice,
  TextEdits,
  PresentedMilestone,
  PresentedProgram,
  PresentedTier,
  RewardKind,
  TierKey,
  TierRules,
  TierRulesChange,
} from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
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
import {
  MAX_FREE_TEXT,
  MAX_FREE_TEXT_LENGTH,
  buildTierSave,
  dialogDraft,
  type RuleKey,
} from "./tier-rules";
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
  onSetRecurringEvery,
  onSetTierRules,
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
  /** Present only while the programme is a draft: how often the reward after Diamante comes round. */
  onSetRecurringEvery?: (realSpend: number) => Promise<unknown>;
  /**
   * Present only while the programme is a draft: saves a tier's benefits from its edit dialog, the
   * real multiplier, discount and birthday gift and the free text together (visits, the pass and
   * the messages follow them).
   */
  onSetTierRules?: (tier: TierKey, change: TierRulesChange) => Promise<unknown>;
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
                <div className="flex items-start justify-between gap-2">
                  <p className="flex min-h-7 items-center gap-2 font-serif text-xl font-semibold leading-7">
                    {tier.key === "diamante" ? (
                      <Crown className="h-4 w-4 text-gold" />
                    ) : null}
                    <span>{tier.label}</span>
                  </p>
                  {/* An older backend sends no rules: the card is then read only. */}
                  {onSetTierRules && tier.rules ? (
                    <TierEditor
                      tier={tier}
                      rules={tier.rules}
                      catalogItems={catalogItems}
                      onSave={(change) => onSetTierRules(tier.key, change)}
                    />
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tier.threshold === 0
                    ? "Desde el primer día"
                    : `Desde ${formatProgress(tier.threshold)} gastados`}
                  {tier.minTenureMonths
                    ? ` y ${tier.minTenureMonths} meses como miembro`
                    : ""}
                </p>
              </div>
              <TierBenefits tier={tier} />
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
          onSetEvery={onSetRecurringEvery}
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

/** A tier's benefits as clients read them. They change only through the tier's edit dialog. */
function TierBenefits({ tier }: { tier: PresentedTier }) {
  return (
    <ul className="grid gap-1.5 text-xs leading-5">
      {tier.benefits.map((text, index) => (
        <li key={`${index}-${text}`} className="flex items-start gap-2">
          <Check className="mt-1 h-3 w-3 shrink-0 text-success" />
          <span className="min-w-0 flex-1 break-words pt-0.5">{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** What a birthday gift may be: the catalogue, or a free text with its price. */
const BIRTHDAY_KINDS: readonly RewardKind[] = ["tratamiento", "producto", "libre"];

/** The pencil at the top right of a tier card, and the dialog it opens. */
function TierEditor({
  tier,
  rules,
  catalogItems,
  onSave,
}: {
  tier: PresentedTier;
  rules: TierRules;
  catalogItems: CatalogItemOption[];
  onSave: (change: TierRulesChange) => Promise<unknown>;
}) {
  const [open, setOpen] = React.useState(false);
  const button = React.useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={`Editar beneficios de ${tier.label}`}
        title="Editar beneficios"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {/* Mounted on open, so it always starts from the tier as last saved. */}
      {open ? (
        <TierBenefitsDialog
          tier={tier}
          rules={rules}
          catalogItems={catalogItems}
          onSave={onSave}
          onClose={close}
        />
      ) : null}
    </>
  );
}

const HIDDEN_RULE_NOTE =
  "Estaba oculto en la tarjeta, pero tus clientes lo seguían recibiendo. Al guardar volverá a verse.";

/**
 * Everything a tier gives, by category, saved as ONE request: the birthday gift, the cosmetics
 * discount and the points multiplier are one real value each (visits, the pass and the messages
 * follow them); free text is any number of points that only change what the card says. What is
 * saved replaces the tier's whole list, so the card shows exactly what this dialog showed.
 */
function TierBenefitsDialog({
  tier,
  rules,
  catalogItems,
  onSave,
  onClose,
}: {
  tier: PresentedTier;
  rules: TierRules;
  catalogItems: CatalogItemOption[];
  onSave: (change: TierRulesChange) => Promise<unknown>;
  onClose: () => void;
}) {
  const [draft] = React.useState(() => dialogDraft(tier, rules));
  const [multiplier, setMultiplier] = React.useState(draft.multiplier);
  const [discount, setDiscount] = React.useState(draft.discount);
  const [freeText, setFreeText] = React.useState(draft.freeText);
  // Undefined while untouched: an unchanged gift is not sent, so it is never re-priced.
  const [birthday, setBirthday] = React.useState<TierRulesChange["birthday"]>(undefined);
  const [birthdayName, setBirthdayName] = React.useState<string | null>(
    draft.birthday?.name ?? null,
  );
  const [picking, setPicking] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const titleId = React.useId();
  const panel = React.useRef<HTMLDivElement>(null);
  const hidden = (key: RuleKey) =>
    draft.hiddenRules.includes(key) ? HIDDEN_RULE_NOTE : undefined;

  React.useEffect(() => {
    panel.current?.querySelector<HTMLElement>("input, button")?.focus();
  }, []);

  const current = draft.birthday;
  const typedGift = current?.priceEuro !== undefined;
  const giftRow = catalogItems.find((item) => item.externalId === current?.itemId);

  const chooseGift = (choice: PanelChoice) => {
    if ("itemId" in choice) {
      setBirthday(choice);
      setBirthdayName(
        catalogItems.find((item) => item.externalId === choice.itemId)?.name ??
          "Artículo del catálogo",
      );
    } else if (choice.kind === "libre") {
      setBirthday(choice);
      setBirthdayName(choice.name);
    } else {
      return;
    }

    setPicking(false);
  };

  const save = async () => {
    if (busy) return;

    const built = buildTierSave({ multiplier, discount, freeText, birthday });

    if (!built.ok) {
      setProblem(built.problem);
      return;
    }

    setBusy(true);
    setProblem(null);

    try {
      await onSave(built.change);
      onClose();
    } catch (error) {
      // Stays open with what was typed: a refusal must not throw the edit away.
      setProblem(
        error instanceof ApiError && error.detail
          ? error.detail
          : "No se han podido guardar los beneficios. Inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  };

  const valueInput = (
    value: string,
    onChange: (value: string) => void,
    sign: "×" | "%",
    label: string,
  ) => (
    <div className="flex items-baseline gap-1.5">
      {sign === "×" ? (
        <span aria-hidden="true" className="font-serif text-2xl text-muted-foreground">
          ×
        </span>
      ) : null}
      <input
        inputMode="decimal"
        value={value}
        disabled={busy}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="w-24 rounded-xl border border-input bg-background px-3 py-1.5 font-serif text-3xl font-semibold leading-tight outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      />
      {sign === "%" ? (
        <span aria-hidden="true" className="font-serif text-2xl text-muted-foreground">
          %
        </span>
      ) : null}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2d211e]/60 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || busy) return;

          event.preventDefault();

          if (picking) setPicking(false);
          else onClose();
        }}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 pb-4 pt-6">
          <div>
            <h3 id={titleId} className="font-serif text-2xl font-semibold">
              Beneficios de {tier.label}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Los cambios llegan a tus clientes cuando publiques el programa.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            disabled={busy}
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto px-6 py-5">
          <DialogSection
            icon={Gift}
            title="Regalo de cumpleaños"
            hint="Uno por nivel. El mensaje de cumpleaños lo nombra."
            note={hidden("birthday")}
          >
            {picking ? (
              <RewardChoicePanel
                catalogItems={catalogItems}
                kinds={BIRTHDAY_KINDS}
                initialMode={
                  typedGift
                    ? "libre"
                    : giftRow && isProductRow(giftRow)
                      ? "producto"
                      : "tratamiento"
                }
                initialFreeName={typedGift ? current.name : ""}
                busy={busy}
                problem={null}
                onChoose={chooseGift}
                header={
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">Elige el regalo</p>
                    <button
                      type="button"
                      onClick={() => setPicking(false)}
                      className="text-xs underline underline-offset-2 hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                }
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    !birthdayName && "text-muted-foreground",
                  )}
                >
                  {birthdayName ?? "Sin regalo"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setPicking(true)}
                >
                  {birthdayName ? "Cambiar regalo" : "Elegir regalo"}
                </Button>
                {birthdayName ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      setBirthday(null);
                      setBirthdayName(null);
                    }}
                  >
                    Quitar regalo
                  </Button>
                ) : null}
              </div>
            )}
          </DialogSection>

          <DialogSection
            icon={Percent}
            title="Descuento en cosmética"
            hint="En los productos de cosmética, con el límite anual del programa. 0 es sin descuento."
            note={hidden("discount")}
          >
            {valueInput(discount, setDiscount, "%", "Descuento en cosmética (%)")}
          </DialogSection>

          <DialogSection
            icon={TrendingUp}
            title="Multiplicador de puntos"
            hint="Cuánto progreso suma cada euro gastado. ×1 es sin multiplicador."
            note={hidden("mult")}
          >
            {valueInput(multiplier, setMultiplier, "×", "Multiplicador de puntos")}
          </DialogSection>

          <DialogSection
            icon={PenLine}
            title="Texto libre"
            hint="Se muestra en la tarjeta tal cual. No cambia ninguna regla del programa."
          >
            <div className="grid gap-2">
              {freeText.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin puntos de texto libre.
                </p>
              ) : null}
              {freeText.map((text, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={text}
                    maxLength={MAX_FREE_TEXT_LENGTH}
                    disabled={busy}
                    onChange={(event) =>
                      setFreeText((list) =>
                        list.map((item, i) => (i === index ? event.target.value : item)),
                      )
                    }
                    aria-label={`Punto ${index + 1} de texto libre`}
                    className="h-9"
                  />
                  <button
                    type="button"
                    aria-label={`Quitar el punto ${index + 1}`}
                    title="Quitar"
                    disabled={busy}
                    onClick={() =>
                      setFreeText((list) => list.filter((_, i) => i !== index))
                    }
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy || freeText.length >= MAX_FREE_TEXT}
                  onClick={() => setFreeText((list) => [...list, ""])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {freeText.length >= MAX_FREE_TEXT
                    ? `Máximo ${MAX_FREE_TEXT} puntos`
                    : "Añadir punto"}
                </Button>
              </div>
            </div>
          </DialogSection>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
          {problem ? (
            <p role="alert" className="mr-auto basis-full text-sm text-destructive sm:basis-auto">
              {problem}
            </p>
          ) : null}
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? "Guardando…" : "Guardar beneficios"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** One category of the tier dialog: its icon and name, what it does, then its control. */
function DialogSection({
  icon: SectionIcon,
  title,
  hint,
  note,
  children,
}: {
  icon: Icon;
  title: string;
  hint: string;
  /** Something the admin must know about the value as it stands, e.g. it was hidden. */
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-gold">
          <SectionIcon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
          {note ? (
            <p className="mt-1 text-xs leading-5 text-[#a47845]">{note}</p>
          ) : null}
        </div>
      </div>
      <div className="pl-11">{children}</div>
    </section>
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
  kinds,
}: {
  catalogItems: CatalogItemOption[];
  /**
   * Only these options, in a layout narrow enough for a tier card (the birthday gift). Absent: all
   * five, laid out for a ladder row.
   */
  kinds?: readonly RewardKind[];
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
        className={cn(
          "grid gap-2",
          kinds ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-5",
        )}
      >
        {REWARD_KINDS.filter(
          (option) => !kinds || kinds.includes(option.kind),
        ).map((option) => {
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
          <div
            className={cn("grid gap-2", !kinds && "sm:grid-cols-[1fr_9rem]")}
          >
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
  onSetEvery,
  texts,
  catalogItems,
}: {
  recurring: PresentedProgram["recurring"];
  onSwap?: (choice: PanelChoice) => Promise<unknown>;
  onSetEvery?: (realSpend: number) => Promise<unknown>;
  texts?: TextsEditing;
  catalogItems: CatalogItemOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [editingEvery, setEditingEvery] = React.useState(false);
  const [everyText, setEveryText] = React.useState("");
  const [everyBusy, setEveryBusy] = React.useState(false);
  const [everyProblem, setEveryProblem] = React.useState<string | null>(null);
  const kind = rewardKindOf(recurring);
  const KindIcon = REWARD_ICON[kind];

  const startEvery = () => {
    setEveryText(String(recurring.every));
    setEveryProblem(null);
    setOpen(false);
    setEditingEvery(true);
  };

  const saveEvery = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!onSetEvery) return;

    const parsed = parseSpend(everyText, undefined);

    if (!parsed.ok) {
      setEveryProblem(parsed.problem);

      return;
    }

    if (parsed.realSpend === recurring.every) {
      setEditingEvery(false);

      return;
    }

    setEveryBusy(true);
    setEveryProblem(null);

    try {
      await onSetEvery(parsed.realSpend);
      setEditingEvery(false);
    } catch (error) {
      setEveryProblem(swapRefusalMessage(error, "No se ha podido cambiar el gasto."));
    } finally {
      setEveryBusy(false);
    }
  };

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
            <p className="flex items-center gap-1">
              <span>{`Por cada ${formatProgress(recurring.every)} que gasta el cliente:`}</span>
              {onSetEvery ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Cambiar cada cuánto gasto se consigue el premio de después de Diamante"
                  aria-expanded={editingEvery}
                  disabled={everyBusy}
                  onClick={() => (editingEvery ? setEditingEvery(false) : startEvery())}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
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
              setEditingEvery(false);
              setOpen((current) => !current);
            }}
          >
            <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />{" "}
            <span>Cambiar</span>
          </Button>
        ) : null}
      </div>

      {editingEvery ? (
        <form
          onSubmit={(event) => void saveEvery(event)}
          className="mt-3 grid gap-2 rounded-md bg-secondary/50 p-3"
        >
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Por cada (€) que gasta el cliente
              <Input
                inputMode="numeric"
                autoFocus
                value={everyText}
                disabled={everyBusy}
                onChange={(event) => setEveryText(event.target.value)}
                className="h-9 w-32 font-normal text-foreground"
              />
            </label>
            <Button type="submit" size="sm" disabled={everyBusy}>
              <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              <span>Guardar</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={everyBusy}
              onClick={() => setEditingEvery(false)}
            >
              <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              <span>Cancelar</span>
            </Button>
          </div>
          {everyProblem ? (
            <p role="alert" className="text-xs text-destructive">
              <span>{everyProblem}</span>
            </p>
          ) : null}
        </form>
      ) : null}

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
