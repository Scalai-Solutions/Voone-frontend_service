"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  BonoPlanRow,
  CreateBonoPlanInput,
  UpdateBonoPlanInput,
} from "@/lib/bono-api";

/**
 * The bono plans editor, presentational: the same table for the admin onboarding flow and
 * the centre's own treatments editor. The two screens differ only in where the data comes
 * from, so the data arrives as a store and this component never fetches.
 *
 * Prices are per session, in euros, with up to two decimals. The pack total is derived and
 * shown read-only — what defines the plan is the per-session figure and the count.
 */

export interface BonoPlansStore {
  plans: BonoPlanRow[];
  /** Any of the three writes in flight; the buttons all disable on it. */
  pending: boolean;
  error: string | null;
  create: (input: CreateBonoPlanInput) => void;
  update: (id: string, patch: UpdateBonoPlanInput) => void;
  remove: (id: string) => void;
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

/** "39,90" and "39.90" both mean thirty-nine euros ninety; people in Spain type the first. */
const parsePrice = (raw: string): number | null => {
  const value = Number(raw.trim().replace(",", "."));

  if (!Number.isFinite(value) || value <= 0) return null;
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) return null;

  return value;
};

export function BonoPlansEditor({ store }: { store: BonoPlansStore }) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [sessions, setSessions] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);

  const priceValue = parsePrice(price);
  const sessionsValue = Number(sessions.trim());
  // The price typed IS the pack's total; the per-session figure is the split of it.
  const total = priceValue;
  const perSession =
    priceValue !== null && Number.isInteger(sessionsValue) && sessionsValue > 0
      ? Math.round((priceValue / sessionsValue) * 100) / 100
      : null;

  const add = () => {
    setProblem(null);

    if (!name.trim()) {
      setProblem("Escribe el nombre del bono.");

      return;
    }

    if (priceValue === null) {
      setProblem("El precio del bono debe ser un número, por ejemplo 199,50.");

      return;
    }

    if (
      !Number.isInteger(sessionsValue) ||
      sessionsValue < 1 ||
      sessionsValue > 100
    ) {
      setProblem("El bono tiene entre 1 y 100 sesiones.");

      return;
    }

    store.create({
      name: name.trim(),
      priceEuro: priceValue,
      totalSessions: sessionsValue,
    });
    setName("");
    setPrice("");
    setSessions("");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold">Bonos de sesiones</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Packs de tratamiento que la clienta paga por adelantado y consume en
        varias visitas. El precio se reparte entre las sesiones: cada visita
        suma su parte como progreso.
      </p>

      {store.plans.length > 0 ? (
        <ul className="mt-3 divide-y divide-border rounded-md border border-border">
          {store.plans.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {plan.name}
                  {plan.active ? "" : " (retirado)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.pricePerSessionEuro.toLocaleString("es-ES")} €/sesión ·{" "}
                  {plan.totalSessions} sesiones ·{" "}
                  {plan.totalEuro.toLocaleString("es-ES")} € en total ·{" "}
                  {plan.issuedCount === 0
                    ? "todavía sin clientas"
                    : `${plan.issuedCount} clienta${plan.issuedCount === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={plan.active}
                    disabled={store.pending}
                    onChange={(event) =>
                      store.update(plan.id, { active: event.target.checked })
                    }
                    aria-label={`Activar ${plan.name}`}
                    className="h-4 w-4"
                  />
                  Activo
                </label>
                <button
                  type="button"
                  disabled={store.pending}
                  onClick={() => store.remove(plan.id)}
                  aria-label={`Quitar ${plan.name}`}
                  className="text-muted-foreground transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Todavía no hay bonos definidos.
        </p>
      )}

      <div className="mt-3 grid items-end gap-2 sm:grid-cols-[1fr_110px_90px_auto]">
        <label className="text-xs font-medium text-muted-foreground">
          Nombre
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setProblem(null);
            }}
            placeholder="Bono facial"
            className={inputClass}
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Precio del bono (€)
          <input
            inputMode="decimal"
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
              setProblem(null);
            }}
            placeholder="199,50"
            className={inputClass}
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Sesiones
          <input
            inputMode="numeric"
            value={sessions}
            onChange={(event) => {
              setSessions(event.target.value);
              setProblem(null);
            }}
            placeholder="5"
            className={inputClass}
          />
        </label>
        <Button
          type="button"
          size="sm"
          disabled={store.pending}
          onClick={add}
          className="h-10"
        >
          {store.pending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          <span>
            Añadir
            {total !== null
              ? ` (${total.toLocaleString("es-ES")} €${perSession !== null ? ` · ${perSession.toLocaleString("es-ES")} €/sesión` : ""})`
              : ""}
          </span>
        </Button>
      </div>

      {problem ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {problem}
        </p>
      ) : null}
      {store.error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {store.error}
        </p>
      ) : null}
    </div>
  );
}
