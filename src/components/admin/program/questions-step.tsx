"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePreview } from "@/features/onboarding/api/useOnboarding";
import { ApiError } from "@/lib/api-client";
import type {
  Investment,
  MembersBucket,
  Objective,
  Occupancy,
  OnboardingAnswers,
  OnboardingEstimates,
} from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import { formatEuro, formatProgress } from "./format";

/**
 * The six questions, and a preview that follows the answers.
 *
 * The guide asks for the programme to update live as answers change, and for the whole thing to
 * take under five minutes. Ticket and frequency arrive with one option already chosen — the
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
    label: "Más clientas nuevas",
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

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);

    return () => clearTimeout(id);
  }, [value, ms]);

  return debounced;
}

export function QuestionsStep({
  clinicId,
  estimates,
  answers,
  onChange,
  onBack,
  onGenerate,
  generating,
  error,
}: {
  clinicId: string;
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

  const debounced = useDebounced(answers, 500);
  const preview = usePreview(clinicId, debounced);

  const ready = Boolean(answers.members);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-8">
        <div>
          <h3 className="font-serif text-2xl font-semibold">Seis preguntas</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ya hemos estimado el ticket y la frecuencia a partir del catálogo. Confirma o cambia lo
            que no encaje; el programa de la derecha se actualiza solo.
          </p>
        </div>

        <Question
          number={1}
          title="¿Cuánto gasta una clienta en una visita normal?"
          note={`Estimado de tu catálogo: ${formatEuro(estimates.ticketEstimate)}`}
        >
          <Options
            label="Ticket medio"
            value={ticketChosen}
            onSelect={(id) =>
              set("ticket", id === estimates.preselectedTicketBucket ? null : id)
            }
            options={estimates.ticketBuckets.map((b) => ({
              id: b.id,
              label: b.label,
              badge: b.id === estimates.preselectedTicketBucket ? "Estimado" : undefined,
            }))}
          />
        </Question>

        <Question
          number={2}
          title="¿Cada cuánto vienen las clientas habituales?"
          note={`Estimado de tu catálogo: unas ${estimates.visitsEstimate.toLocaleString("es-ES")} visitas al año`}
        >
          <Options
            label="Frecuencia"
            value={freqChosen}
            onSelect={(id) => set("freq", id === estimates.preselectedFreqBucket ? null : id)}
            options={estimates.freqBuckets.map((b) => ({
              id: b.id,
              label: b.label,
              badge: b.id === estimates.preselectedFreqBucket ? "Estimado" : undefined,
            }))}
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
          title="¿Qué parte de lo que gasta una clienta quieres devolverle en premios?"
          note="Calculado a lo que cuestan los premios al centro, no a su precio de venta."
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
          title="¿Cuántas clientas activas tiene el centro al año?"
          note="No cambia los premios ni los niveles. Sirve para dimensionar el centro."
        >
          <Options
            label="Clientas al año"
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

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <LivePreview preview={preview} />
      </aside>
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

function LivePreview({ preview }: { preview: ReturnType<typeof usePreview> }) {
  if (preview.isError) {
    const message =
      preview.error instanceof ApiError && preview.error.detail
        ? preview.error.detail
        : "No se ha podido calcular el programa.";

    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4 text-destructive" /> <span>No se puede montar el programa</span>
        </p>
        <p className="mt-2 text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (!preview.data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> <span>Calculando el programa…</span>
      </div>
    );
  }

  const { program } = preview.data;
  const rewards = program.ladder.filter((m) => m.type === "premio");
  const perks = program.ladder.filter((m) => m.type === "ventaja");

  return (
    <div
      className={cn(
        "grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-opacity",
        preview.isFetching && "opacity-70",
      )}
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a47845]">
          Así quedaría
        </p>
        {preview.isFetching ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null}
      </div>

      <ol className="grid gap-2">
        {program.tiers.map((tier) => (
          <li key={tier.key} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">{tier.label}</span>
            <span className="text-muted-foreground">
              {tier.threshold === 0 ? "al empezar" : `desde ${formatProgress(tier.threshold)}`}
              {tier.minTenureMonths ? ` · ${tier.minTenureMonths} meses` : ""}
            </span>
          </li>
        ))}
      </ol>

      <p className="text-xs leading-5 text-muted-foreground">
        {rewards.length} premios y {perks.length} ventajas hasta Diamante. El primero llega en la
        primera visita.
      </p>

      <ul className="grid gap-1 border-t border-border pt-3 text-sm">
        {rewards.slice(0, 3).map((m) => (
          <li key={m.n} className="flex justify-between gap-3">
            <span className="truncate">{m.reward?.name}</span>
            <span className="shrink-0 text-muted-foreground">{formatProgress(m.threshold)}</span>
          </li>
        ))}
      </ul>

      {program.review.map((note) => (
        <p key={note} role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
          {note}
        </p>
      ))}
      {program.adaptations.map((note) => (
        <p key={note} className="rounded-md bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground">
          {note}
        </p>
      ))}
    </div>
  );
}
