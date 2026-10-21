"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  Investment,
  MembersBucket,
  Objective,
  Occupancy,
  OnboardingAnswers,
  OnboardingEstimates,
} from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import { formatEuro } from "./format";

/**
 * The six questions.
 *
 * The guide asks for the whole thing to take under five minutes. Ticket and frequency arrive with one option already chosen — the
 * engine's own estimate from the catalogue — so the common case is to confirm rather than to
 * answer.
 */

const OBJECTIVES: Array<{ id: Objective; label: string; sub: string }> = [
  {
    id: "equilibrado",
    label: "Equilibrado",
    sub: "Reparte el presupuesto para que vuelvan y gasten algo más.",
  },
  {
    id: "mas_visitas",
    label: "Más visitas",
    sub: "Premios más fáciles de alcanzar, para que vengan con más frecuencia.",
  },
  {
    id: "mas_gasto",
    label: "Más gasto",
    sub: "Da más peso a los niveles altos, para que inviertan más en cada visita.",
  },
  {
    id: "mas_clientes_nuevos",
    label: "Más clientes nuevos",
    sub: "Premia más a quien recomienda el centro.",
  },
];

const INVESTMENTS: Array<{ id: Investment; label: string; sub: string }> = [
  { id: "conservador", label: "Conservador · 4%", sub: "Premios más ajustados." },
  { id: "equilibrado", label: "Equilibrado · 5%", sub: "Recomendado para empezar." },
  { id: "generoso", label: "Generoso · 6%", sub: "Premios más vistosos." },
];

const OCCUPANCIES: Array<{ id: Occupancy; label: string; sub: string }> = [
  { id: "o1", label: "Menos del 50%", sub: "Hay mucho hueco que llenar" },
  { id: "o2", label: "50 a 70%", sub: "Ocupación media" },
  { id: "o3", label: "70 a 85%", sub: "Bastante llena" },
  { id: "o4", label: "Más del 85%", sub: "Agenda casi completa" },
];

const MEMBERS: Array<{ id: MembersBucket; label: string }> = [
  { id: "m1", label: "Menos de 150" },
  { id: "m2", label: "150 a 400" },
  { id: "m3", label: "400 a 800" },
  { id: "m4", label: "Más de 800" },
];

export function QuestionsStep({
  estimates,
  answers,
  onChange,
  onBack,
  onGenerate,
  generating,
  error,
}: {
  estimates: OnboardingEstimates;
  answers: OnboardingAnswers;
  onChange: (next: OnboardingAnswers) => void;
  onBack: () => void;
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}) {
  const set = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) =>
    onChange({ ...answers, [key]: value });

  // The estimate is the default: no answer means "use it", and choosing the estimated bucket is
  // stored as no answer so the engine keeps its exact figure rather than the bucket's midpoint.
  const ticketChosen = answers.ticket ?? estimates.preselectedTicketBucket;
  const freqChosen = answers.freq ?? estimates.preselectedFreqBucket;

  // What the programme is actually built from, and what to show in the number boxes. The exact
  // figure wins; otherwise it is the chosen chip's value, or the recommendation. This mirrors the
  // engine's own precedence so the box never says one thing while the programme uses another.
  const recommendedTicket = Math.round(estimates.ticketEstimate);
  const recommendedVisits = estimates.visitsEstimate;
  const bucketTicket =
    estimates.ticketBuckets.find((b) => b.id === answers.ticket)?.value ?? recommendedTicket;
  const ticketNow =
    answers.ticketValue ??
    (answers.ticket && answers.ticket !== estimates.preselectedTicketBucket
      ? bucketTicket
      : recommendedTicket);
  const visitsNow = answers.visitsValue ?? visitsFromBucket(answers.freq, estimates) ?? recommendedVisits;

  const ready = Boolean(answers.members);

  return (
    <div className="grid max-w-3xl gap-8">
      <div className="grid gap-8">
        <div>
          <h3 className="font-serif text-2xl font-semibold">Seis preguntas</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ya hemos estimado el ticket y la frecuencia a partir del catálogo. Confirma o cambia lo
            que no encaje.
          </p>
        </div>

        <Question
          number={1}
          title="¿Cuánto gasta un cliente en una visita normal?"
          note={`Recomendado según tu catálogo: ${formatEuro(estimates.ticketEstimate)}. Puedes escribir tu cifra exacta: el programa entero se rehace con ella.`}
        >
          <Options
            label="Ticket medio"
            value={answers.ticketValue != null ? "" : ticketChosen}
            // A chip is a quick pick: it replaces any exact figure typed before it.
            onSelect={(id) =>
              onChange({
                ...answers,
                ticket: id === estimates.preselectedTicketBucket ? null : id,
                ticketValue: null,
              })
            }
            options={estimates.ticketBuckets.map((b) => ({
              id: b.id,
              label: b.label,
              badge: b.id === estimates.preselectedTicketBucket ? "Recomendado" : undefined,
            }))}
          />
          <NumberField
            label="Ticket medio exacto (€)"
            unit="€"
            value={ticketNow}
            recommended={recommendedTicket}
            min={estimates.limits.ticket.min}
            max={estimates.limits.ticket.max}
            integer
            onCommit={(n) =>
              onChange({ ...answers, ticket: null, ticketValue: n === recommendedTicket ? null : n })
            }
            onReset={() => onChange({ ...answers, ticket: null, ticketValue: null })}
          />
        </Question>

        <Question
          number={2}
          title="¿Cada cuánto vienen los clientes habituales?"
          note={`Recomendado según tu catálogo: unas ${estimates.visitsEstimate.toLocaleString("es-ES")} visitas al año. Puedes escribir tu cifra exacta.`}
        >
          <Options
            label="Frecuencia"
            value={answers.visitsValue != null ? "" : freqChosen}
            onSelect={(id) =>
              onChange({
                ...answers,
                freq: id === estimates.preselectedFreqBucket ? null : id,
                visitsValue: null,
              })
            }
            options={estimates.freqBuckets.map((b) => ({
              id: b.id,
              label: b.label,
              badge: b.id === estimates.preselectedFreqBucket ? "Recomendado" : undefined,
            }))}
          />
          <NumberField
            label="Visitas medias al año por cliente"
            unit="visitas"
            value={visitsNow}
            recommended={recommendedVisits}
            min={estimates.limits.visits.min}
            max={estimates.limits.visits.max}
            onCommit={(n) =>
              onChange({ ...answers, freq: null, visitsValue: n === recommendedVisits ? null : n })
            }
            onReset={() => onChange({ ...answers, freq: null, visitsValue: null })}
          />
        </Question>

        <Question number={3} title="¿Qué quieres conseguir con el programa?">
          <Options
            label="Objetivo"
            value={answers.objective}
            onSelect={(id) => set("objective", id as Objective)}
            options={OBJECTIVES}
          />
        </Question>

        <Question
          number={4}
          title="¿Qué parte de lo que gasta un cliente quieres devolverle en premios?"
          note="Por cada 100 € que gasta un cliente, si eliges 5 %, 5 € van a sus premios. Se calcula sobre lo que cuestan los premios al centro, no sobre su precio de venta."
        >
          <Options
            label="Inversión"
            value={answers.investment}
            onSelect={(id) => set("investment", id as Investment)}
            options={INVESTMENTS}
          />
        </Question>

        <Question
          number={5}
          title="¿Cómo de llena está la agenda?"
          note="Regalar tiempo de cabina cuesta más cuando la agenda está llena."
        >
          <Options
            label="Ocupación"
            value={answers.occupancy}
            onSelect={(id) => set("occupancy", id as Occupancy)}
            options={OCCUPANCIES}
          />
        </Question>

        <Question
          number={6}
          title="¿Cuántos clientes activos tiene el centro al año?"
          note="No cambia los premios ni los niveles. Sirve para dimensionar el centro."
        >
          <Options
            label="Clientes al año"
            value={answers.members ?? ""}
            onSelect={(id) => set("members", id as MembersBucket)}
            options={MEMBERS}
          />
        </Question>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button type="button" variant="outline" onClick={onBack}>
            Volver al catálogo
          </Button>
          <div className="flex items-center gap-3">
            {!ready ? (
              <p className="text-xs text-muted-foreground">Responde la pregunta 6 para continuar.</p>
            ) : null}
            <Button type="button" onClick={onGenerate} disabled={!ready || generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <span>Ver el programa completo</span>
            </Button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

    </div>
  );
}

/** The visits a frequency chip stands for, as the engine computes them (52 weeks over the gap). */
const FREQ_WEEKS: Record<string, number> = { f1: 3, f2: 4.3, f3: 7, f4: 10.8, f5: 21.7 };

const visitsFromBucket = (
  freq: string | null | undefined,
  estimates: OnboardingEstimates,
): number | null =>
  freq && freq !== estimates.preselectedFreqBucket && FREQ_WEEKS[freq]
    ? Math.round((52 / FREQ_WEEKS[freq]) * 10) / 10
    : null;

/** People in Spain type 5,1 as readily as 5.1. */
const parseNumber = (text: string): number => Number(text.trim().replace(",", "."));

/**
 * An exact figure the centre can type, shown beside the quick-pick chips.
 *
 * The number is the source of truth; the chips are shortcuts into it. A figure is only passed on
 * once it is valid, and an invalid one shows its reason where it is typed and changes nothing —
 * a half-typed "6" on the way to "65" must not rebuild the programme around 6. The recommendation
 * is always shown, with a way back to it.
 */
function NumberField({
  label,
  unit,
  value,
  recommended,
  min,
  max,
  integer = false,
  onCommit,
  onReset,
}: {
  label: string;
  unit: string;
  /** What the programme is built from right now. */
  value: number;
  recommended: number;
  min: number;
  max: number;
  integer?: boolean;
  onCommit: (value: number) => void;
  onReset: () => void;
}) {
  // Null while the person is not typing, so the box follows the programme (a chip, a reset).
  const [text, setText] = React.useState<string | null>(null);
  const id = React.useId();
  const shown = text ?? String(value).replace(".", ",");

  const range = `Entre ${min.toLocaleString("es-ES")} y ${max.toLocaleString("es-ES")}`;

  const problem = React.useMemo((): string | null => {
    if (text === null) return null;

    const n = parseNumber(text);

    if (text.trim() === "" || !Number.isFinite(n)) return "Escribe un número.";
    if (integer && !Number.isInteger(n)) return "Tiene que ser un número entero.";
    if (n < min || n > max) return `${range}.`;

    return null;
  }, [text, integer, min, max, range]);

  const differs = value !== recommended;

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor={id} className="grid gap-1 text-xs font-medium text-muted-foreground">
          <span>{label}</span>
          <span className="flex items-center gap-2">
            <input
              id={id}
              inputMode="decimal"
              value={shown}
              aria-invalid={problem ? true : undefined}
              aria-describedby={`${id}-hint`}
              onChange={(event) => {
                const next = event.target.value;
                const n = parseNumber(next);

                setText(next);

                // Passed on only when valid; one decimal is all a visits figure can mean.
                const valid =
                  next.trim() !== "" &&
                  Number.isFinite(n) &&
                  n >= min &&
                  n <= max &&
                  (!integer || Number.isInteger(n));

                if (valid) onCommit(integer ? n : Math.round(n * 10) / 10);
              }}
              onBlur={() => {
                if (!problem) setText(null);
              }}
              className={cn(
                "h-10 w-28 rounded-md border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring",
                problem ? "border-destructive" : "border-input",
              )}
            />
            <span className="text-muted-foreground">{unit}</span>
          </span>
        </label>

        <p id={`${id}-hint`} className="pb-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Recomendado
          </span>{" "}
          <span>{String(recommended).replace(".", ",")}</span>
          {differs || text !== null ? (
            <>
              {" · "}
              <button
                type="button"
                className="font-semibold text-foreground underline underline-offset-4"
                onClick={() => {
                  setText(null);
                  onReset();
                }}
              >
                Volver a lo recomendado
              </button>
            </>
          ) : null}
        </p>
      </div>

      {problem ? (
        <p role="alert" className="text-xs text-destructive">
          {problem} No se rehace el programa hasta que sea válido.
        </p>
      ) : null}
    </div>
  );
}

function Question({
  number,
  title,
  note,
  children,
}: {
  number: number;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h4 className="text-base font-semibold">
          <span className="mr-2 text-[#a47845]">{number}.</span>
          {title}
        </h4>
        {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Options({
  label,
  value,
  onSelect,
  options,
}: {
  label: string;
  value: string;
  onSelect: (id: string) => void;
  options: Array<{ id: string; label: string; sub?: string; badge?: string }>;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const checked = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onSelect(option.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              checked
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-secondary/50",
            )}
          >
            <span className="flex items-center justify-between gap-2 text-sm font-semibold">
              {option.label}
              {option.badge ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {option.badge}
                </span>
              ) : null}
            </span>
            {option.sub ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">{option.sub}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
