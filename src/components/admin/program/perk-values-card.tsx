"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  usePerkValues,
  useSavePerkValues,
} from "@/features/onboarding/api/useOnboarding";
import { ApiError } from "@/lib/api-client";
import type { CatalogRow, PerkKey, PerkValues } from "@/lib/onboarding-api";
import { PERKS, perkEdits, valueToText } from "./perk-values";

const inputClass =
  "mt-1 h-10 w-28 rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

const EMPTY: Record<PerkKey, string> = { diag: "", mejora: "", sorpresa: "" };

const toTexts = (values: PerkValues): Record<PerkKey, string> => ({
  diag: valueToText(values.diag),
  mejora: valueToText(values.mejora),
  sorpresa: valueToText(values.sorpresa),
});

/**
 * What each perk is worth to a member. A perk adds to the "Ahorro" total on the member's card only
 * when the centre has put a value on it here; left blank it counts nothing.
 */
export function PerkValuesCard({
  clinicId,
  catalog,
}: {
  clinicId: string;
  catalog: CatalogRow[];
}) {
  const values = usePerkValues(clinicId);
  const save = useSavePerkValues(clinicId);
  const [typed, setTyped] = React.useState<Record<PerkKey, string>>(EMPTY);
  const [notice, setNotice] = React.useState<string | null>(null);
  const loadedFor = React.useRef<PerkValues | null>(null);

  // Fill the boxes from what is stored, once per load, so typing is never overwritten by a refetch.
  React.useEffect(() => {
    if (values.data && loadedFor.current !== values.data) {
      loadedFor.current = values.data;
      setTyped(toTexts(values.data));
    }
  }, [values.data]);

  if (!values.data) return null;

  const stored = values.data;
  const priced = catalog.filter((row) => row.priceEuro > 0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);

    const { edits, invalid } = perkEdits(stored, typed);

    if (invalid) {
      setNotice("Escribe un importe en euros, por ejemplo 40 o 25,50.");
      return;
    }

    if (Object.keys(edits).length === 0) {
      setNotice("No hay cambios que guardar.");
      return;
    }

    save.mutate(edits, {
      onSuccess: () => setNotice("Guardado. Cuenta desde el próximo canje."),
      onError: (error) =>
        setNotice(
          error instanceof ApiError && error.detail
            ? error.detail
            : "No se pudo guardar. Inténtalo de nuevo.",
        ),
    });
  };

  return (
    <section
      aria-labelledby="perk-values-heading"
      className="grid gap-4 rounded-lg border border-border bg-card p-5"
    >
      <div>
        <h3
          id="perk-values-heading"
          className="font-serif text-xl font-semibold"
        >
          Valor de las ventajas
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo que ahorra el cliente al canjear cada ventaja, para el total
          «Ahorro» de su tarjeta. Si lo dejas en blanco, esa ventaja no suma.
          Los puntos dobles nunca suman, y lo que ya se ahorró no cambia.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-3">
        {PERKS.map(({ key, label }) => (
          <div
            key={key}
            className="grid items-end gap-2 sm:grid-cols-[1fr_auto_minmax(0,16rem)]"
          >
            <span className="text-sm font-medium">{label}</span>
            <label className="text-xs font-medium text-muted-foreground">
              Valor (€)
              <input
                inputMode="decimal"
                value={typed[key]}
                onChange={(event) => {
                  setNotice(null);
                  setTyped((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }));
                }}
                placeholder="Sin valor"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              O toma el precio de un tratamiento
              <select
                value=""
                onChange={(event) => {
                  const row = priced.find(
                    (item) => item.externalId === event.target.value,
                  );

                  if (!row) return;
                  setNotice(null);
                  setTyped((current) => ({
                    ...current,
                    [key]: valueToText(row.priceEuro),
                  }));
                }}
                className="mt-1 h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
              >
                <option value="">Elegir del catálogo…</option>
                {priced.map((row) => (
                  <option key={row.externalId} value={row.externalId}>
                    {row.name} · {valueToText(row.priceEuro)} €
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            <span>Guardar valores</span>
          </Button>
          {notice ? (
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
