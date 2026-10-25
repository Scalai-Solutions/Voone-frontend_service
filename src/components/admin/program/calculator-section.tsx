"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { useCalculator } from "@/features/onboarding/api/useOnboarding";
import { ApiError } from "@/lib/api-client";
import type { CalcInput, CalcResult, CalcYear, TierKey } from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import { formatEuro } from "./format";

/**
 * Five years of what the programme costs and what it brings in.
 *
 * It always reads the programme shown above it and never changes it: the ticket typed here only
 * changes how much the simulated clients spend, and so how fast they climb a ladder that stays as
 * displayed. To change the programme itself, the ticket and visits in the questions are edited.
 *
 * The model runs on the server, which holds what every reward costs the centre. Those figures
 * never reach this screen — only yearly totals do — so there is no per-gift value here, by design.
 */

const LIMITS = { clients: { min: 10, max: 5000 }, ticket: { min: 10, max: 1000 } } as const;

const TIERS: Array<{ key: TierKey; label: string; color: string }> = [
  { key: "bronce", label: "Bronce", color: "#b08d6e" },
  { key: "plata", label: "Plata", color: "#a9a9b3" },
  { key: "oro", label: "Oro", color: "#c9a14a" },
  { key: "platino", label: "Platino", color: "#6f8f9a" },
  { key: "diamante", label: "Diamante", color: "#4d6fa8" },
];

const ASSUMPTIONS = [
  "Durante el primer año los clientes se incorporan poco a poco, hasta llegar al número indicado. Desde el segundo año, cada cliente que se va se sustituye por una nueva, y siempre empiezan en Bronce.",
  "El 52% de los nuevos clientes repiten (gastan ticket × visitas al año) y el 48% son ocasionales (gastan 1,3 veces el ticket al año).",
  "Cada año siguen el 75% de los que repiten y el 50% de las ocasionales.",
  "El nivel de cada cliente sale de lo que lleva gastado de verdad desde que entró.",
  "Premios y ventajas se cuentan el mes en que se alcanzan, a lo que cuestan al centro, y solo se canjea el 75%.",
  "Un 10% de los canjes trae una visita de pago que no habría existido. Los que repiten gastan un 5% más. Un 5% de clientes nuevos al año llega por recomendación.",
  "Estos porcentajes son estimaciones de los fundadores, no datos medidos. Se ajustarán con los primeros centros.",
];

const parse = (text: string): number => Number(text.trim().replace(",", "."));

const compact = (value: number): string =>
  Math.abs(value) >= 1000
    ? `${(value / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} k`
    : Math.round(value).toLocaleString("es-ES");

const signed = (value: number): string =>
  `${value >= 0 ? "+" : "−"}${formatEuro(Math.abs(Math.round(value)))}`;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);

    return () => clearTimeout(id);
  }, [value, ms]);

  return debounced;
}

export function CalculatorSection({
  clinicId,
  programId,
}: {
  clinicId: string;
  programId: string;
}) {
  // Null means "not edited": the server answers with the programme's own defaults.
  const [clientsText, setClientsText] = React.useState<string | null>(null);
  const [ticketText, setTicketText] = React.useState<string | null>(null);

  const clients = clientsText === null ? undefined : parse(clientsText);
  const ticket = ticketText === null ? undefined : parse(ticketText);

  const clientsProblem =
    clients !== undefined &&
    (!Number.isFinite(clients) || clients < LIMITS.clients.min || clients > LIMITS.clients.max)
      ? `Entre ${LIMITS.clients.min} y ${LIMITS.clients.max.toLocaleString("es-ES")}.`
      : null;
  const ticketProblem =
    ticket !== undefined &&
    (!Number.isFinite(ticket) || ticket < LIMITS.ticket.min || ticket > LIMITS.ticket.max)
      ? `Entre ${LIMITS.ticket.min} y ${LIMITS.ticket.max.toLocaleString("es-ES")} €.`
      : null;

  // Asked for only when both figures are valid, and after a short pause, so a half-typed "1" on
  // the way to "150" never reaches the server.
  const input = React.useMemo<Partial<CalcInput> | null>(() => {
    if (clientsProblem || ticketProblem) return null;

    return {
      ...(clients !== undefined ? { clients: Math.round(clients) } : {}),
      ...(ticket !== undefined ? { ticket } : {}),
    };
  }, [clients, ticket, clientsProblem, ticketProblem]);

  const settled = useDebounced(input, 300);
  const query = useCalculator(clinicId, programId, settled);
  const result = query.data;

  return (
    <section aria-labelledby="calc-heading" className="grid gap-5 border-t border-border pt-8">
      <div>
        <h3 id="calc-heading" className="font-serif text-2xl font-semibold">
          Lo que el programa cuesta y lo que genera
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Año a año, durante cinco años, con el programa tal y como está arriba. Cambia las dos
          cifras para ver otro caso; el programa no cambia.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Field
          label="Clientes en el programa"
          value={clientsText ?? (result ? String(result.input.clients) : "")}
          suggested={result?.defaults.clients}
          problem={clientsProblem}
          onChange={setClientsText}
          onReset={() => setClientsText(null)}
          edited={clientsText !== null}
        />
        <Field
          label="Ticket medio (€)"
          value={ticketText ?? (result ? String(result.input.ticket) : "")}
          suggested={result?.defaults.ticket}
          problem={ticketProblem}
          onChange={setTicketText}
          onReset={() => setTicketText(null)}
          edited={ticketText !== null}
        />
        {query.isFetching ? (
          <Loader2 className="mt-8 h-4 w-4 animate-spin text-muted-foreground" aria-label="Calculando" />
        ) : null}
      </div>

      {query.isError ? (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />{" "}
          <span>
            {query.error instanceof ApiError && query.error.detail
              ? query.error.detail
              : "No se ha podido calcular."}
          </span>
        </p>
      ) : null}

      {result ? (
        <div
          // Re-created for each fresh answer: see the live preview for why text is not patched.
          key={query.dataUpdatedAt}
          className={cn("grid gap-6 transition-opacity", query.isFetching && "opacity-70")}
        >
          <YearsChart years={result.years} />
          <TierBars years={result.years} />
          <YearsTable result={result} />
        </div>
      ) : query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> <span>Calculando…</span>
        </div>
      ) : null}

      <details className="rounded-lg border border-border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Cómo se calcula</summary>
        <ul className="mt-3 grid gap-2 leading-6 text-muted-foreground">
          {ASSUMPTIONS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      <p className="text-xs leading-5 text-muted-foreground">
        Estimación. Lo que se genera es facturación extra; no descuenta lo que cuesta hacer los
        tratamientos.
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  suggested,
  problem,
  edited,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  suggested: number | undefined;
  problem: string | null;
  edited: boolean;
  onChange: (text: string) => void;
  onReset: () => void;
}) {
  const id = React.useId();

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        aria-invalid={problem ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-32 rounded-md border bg-card px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring",
          problem ? "border-destructive" : "border-input",
        )}
      />
      {problem ? (
        <p role="alert" className="text-xs text-destructive">
          {problem}
        </p>
      ) : edited && suggested !== undefined ? (
        <button
          type="button"
          onClick={onReset}
          className="text-left text-xs font-semibold underline underline-offset-4"
        >
          Volver a {suggested.toLocaleString("es-ES")}
        </button>
      ) : suggested !== undefined ? (
        <p className="text-xs text-muted-foreground">Según el programa</p>
      ) : null}
    </div>
  );
}

/** Generates against costs per year, as bars, with the net per year as a line. */
function YearsChart({ years }: { years: CalcYear[] }) {
  const W = 640;
  const H = 260;
  const pad = { l: 56, r: 16, t: 16, b: 44 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const top = Math.max(1, ...years.flatMap((y) => [y.generates.total, y.costs.total]));
  // A round ceiling, so the gridlines land on numbers a person would say.
  const step = Math.pow(10, Math.floor(Math.log10(top)));
  const max = Math.ceil(top / step) * step;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const group = innerW / years.length;
  const bar = Math.min(34, group / 3);

  const net = years.map((yr, i) => `${pad.l + group * i + group / 2},${y(Math.max(0, yr.net))}`);

  return (
    <figure className="grid gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Lo que genera, lo que cuesta y el resultado de cada uno de los cinco años. En el año 5 genera ${formatEuro(Math.round(years[4].generates.total))} y cuesta ${formatEuro(Math.round(years[4].costs.total))}.`}
        className="h-auto w-full max-w-3xl"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              strokeOpacity={t === 0 ? 0.4 : 0.1}
            />
            <text
              x={pad.l - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              fill="currentColor"
              fillOpacity={0.6}
            >
              {compact(t)}
            </text>
          </g>
        ))}

        {years.map((yr, i) => {
          const cx = pad.l + group * i + group / 2;

          return (
            <g key={yr.year}>
              <rect
                x={cx - bar - 2}
                y={y(yr.generates.total)}
                width={bar}
                height={y(0) - y(yr.generates.total)}
                fill="#b98a4f"
                rx={2}
              />
              <rect
                x={cx + 2}
                y={y(yr.costs.total)}
                width={bar}
                height={y(0) - y(yr.costs.total)}
                fill="#8c7870"
                fillOpacity={0.55}
                rx={2}
              />
              <text x={cx} y={H - 22} textAnchor="middle" fontSize="12" fill="currentColor">
                Año {yr.year}
              </text>
            </g>
          );
        })}

        <polyline points={net.join(" ")} fill="none" stroke="#2f7d57" strokeWidth={2} />
        {years.map((yr, i) => (
          <circle
            key={yr.year}
            cx={pad.l + group * i + group / 2}
            cy={y(Math.max(0, yr.net))}
            r={i === years.length - 1 ? 4.5 : 3}
            fill="#2f7d57"
          />
        ))}
      </svg>

      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <Key color="#b98a4f" label="Lo que genera" />
        <Key color="#8c7870" label="Lo que cuesta" />
        <Key color="#2f7d57" label="Resultado del año" line />
        <span>Euros por año.</span>
      </figcaption>
    </figure>
  );
}

function Key({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={line ? "h-0.5 w-4" : "h-2.5 w-2.5 rounded-sm"}
        style={{ background: color }}
      />
      <span>{label}</span>
    </span>
  );
}

/** How many clients are in each tier at the end of each year, so the climb is visible. */
function TierBars({ years }: { years: CalcYear[] }) {
  return (
    <figure className="grid gap-3">
      <p className="text-sm font-semibold">Clientes por nivel al final de cada año</p>
      <div className="grid gap-2">
        {years.map((year) => {
          const total = TIERS.reduce((sum, t) => sum + year.byTier[t.key], 0) || 1;

          return (
            <div key={year.year} className="flex items-center gap-3 text-xs">
              <span className="w-12 shrink-0 text-muted-foreground">Año {year.year}</span>
              <div
                className="flex h-5 flex-1 overflow-hidden rounded-sm bg-secondary"
                role="img"
                aria-label={`Año ${year.year}: ${TIERS.map((t) => `${Math.round(year.byTier[t.key])} en ${t.label}`).join(", ")}`}
              >
                {TIERS.map((t) => (
                  <span
                    key={t.key}
                    style={{ width: `${(year.byTier[t.key] / total) * 100}%`, background: t.color }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {TIERS.map((t) => (
          <Key key={t.key} color={t.color} label={t.label} />
        ))}
      </figcaption>
    </figure>
  );
}

function YearsTable({ result }: { result: CalcResult }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[520px] text-sm tabular-nums">
        <caption className="sr-only">Resultado de cada año</caption>
        <thead>
          <tr className="bg-secondary/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-2">Año</th>
            <th scope="col" className="px-4 py-2 text-right">Clientes (media)</th>
            <th scope="col" className="px-4 py-2 text-right">Genera</th>
            <th scope="col" className="px-4 py-2 text-right">Cuesta</th>
            <th scope="col" className="px-4 py-2 text-right">Resultado</th>
            <th scope="col" className="px-4 py-2 text-right">Acumulado</th>
          </tr>
        </thead>
        <tbody>
          {result.years.map((y) => (
            <tr key={y.year} className="border-t border-border">
              <th scope="row" className="px-4 py-2 text-left font-semibold">{y.year}</th>
              <td className="px-4 py-2 text-right">{Math.round(y.avgMembers).toLocaleString("es-ES")}</td>
              <td className="px-4 py-2 text-right">{formatEuro(Math.round(y.generates.total))}</td>
              <td className="px-4 py-2 text-right">{formatEuro(Math.round(y.costs.total))}</td>
              <td className={cn("px-4 py-2 text-right font-semibold", y.net < 0 ? "text-destructive" : "text-success")}>
                {signed(y.net)}
              </td>
              <td className="px-4 py-2 text-right text-muted-foreground">{signed(y.cumulativeNet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
