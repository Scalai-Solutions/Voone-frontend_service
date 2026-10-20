"use client";

import * as React from "react";
import { ArrowLeft, CheckCircle2, Gift, Loader2, Plus, Trash2 } from "lucide-react";

import { CATEGORY_LABELS, SELECTABLE_CATEGORIES } from "@/components/admin/program/categories";
import { formatProgress } from "@/components/admin/program/format";
import { Button } from "@/components/ui/button";
import {
  useMemberRewards,
  useRecordVisit,
  useRedeemReward,
} from "@/features/program/api/useStaffProgram";
import { ApiError, newIdempotencyKey } from "@/lib/api-client";
import type { CategoryCode } from "@/lib/onboarding-api";
import type { MemberReward, VisitOutcome } from "@/lib/staff-program-api";

/**
 * Recording a visit and redeeming rewards, for a centre that has a loyalty programme.
 *
 * This replaces "add points by hand" for those centres: progress is paid euros, so the only
 * honest input is what the client paid. A reward can only be redeemed in a visit, so the screen
 * keeps hold of the visit just recorded and offers redemption against it — the backend then
 * checks that it is the same client, centre and day.
 */

const inputClass =
  "mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

interface LineDraft {
  key: number;
  category: CategoryCode | "";
  amount: string;
}

/** "12,50" and "12.50" both mean twelve euros fifty; people in Spain type the first. */
const parseAmount = (value: string): number => Number(value.trim().replace(",", "."));

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof ApiError && error.detail ? error.detail : fallback;

/**
 * The visit a reward is redeemed against, remembered for this browser tab so a reload between
 * recording the payment and redeeming does not strand it. Only an id: the backend still checks
 * it is the same client, centre and day, so a stale one is refused with a clear message.
 * Storage can be unavailable (private windows, blocked site data), so every access is guarded.
 */
const visitStorageKey = (memberId: string) => `voone-visit:${memberId}`;

const readStoredVisit = (memberId: string): string | null => {
  try {
    return window.sessionStorage.getItem(visitStorageKey(memberId));
  } catch {
    return null;
  }
};

const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);

  return () => window.removeEventListener("storage", onChange);
};

const storeVisit = (memberId: string, visitId: string) => {
  try {
    window.sessionStorage.setItem(visitStorageKey(memberId), visitId);
  } catch {
    // Redemption then works only until the page is reloaded, which is the previous behaviour.
  }
};

export function ProgramVisitPanel({ memberId }: { memberId: string }) {
  const [mode, setMode] = React.useState<"PAYMENT" | "BONO_SESSION">("PAYMENT");
  const [lines, setLines] = React.useState<LineDraft[]>([{ key: 1, category: "", amount: "" }]);
  const nextKey = React.useRef(2);
  const [discounted, setDiscounted] = React.useState("");
  const [packageName, setPackageName] = React.useState("");
  const [packagePrice, setPackagePrice] = React.useState("");
  const [packageSessions, setPackageSessions] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<VisitOutcome | null>(null);
  const [recordedVisitId, setVisitId] = React.useState<string | null>(null);

  // A store read, not state: the server render has no storage, so the server snapshot is null and
  // the client reads the real value after hydrating, without a mismatch.
  const storedVisitId = React.useSyncExternalStore(
    subscribeToStorage,
    () => readStoredVisit(memberId),
    () => null,
  );
  const visitId = recordedVisitId ?? storedVisitId;

  // Minted once per attempt and kept across retries: a double tap at reception must not pay the
  // client twice. Retired once the visit lands, so the next visit is a new one.
  const visitKeyRef = React.useRef<string | null>(null);

  const record = useRecordVisit(memberId);
  const rewards = useMemberRewards(memberId, true);

  const updateLine = (key: number, patch: Partial<LineDraft>) => {
    setNotice(null);
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const onSuccess = (result: VisitOutcome) => {
      visitKeyRef.current = null;
      setOutcome(result);
      setVisitId(result.visitId);
      storeVisit(memberId, result.visitId);
      setLines([{ key: nextKey.current++, category: "", amount: "" }]);
      setDiscounted("");
      setPackageName("");
      setPackagePrice("");
      setPackageSessions("");
    };
    const onError = (error: unknown) =>
      setNotice(messageOf(error, "No se ha podido registrar la visita. Inténtalo de nuevo."));

    visitKeyRef.current ??= newIdempotencyKey();
    const idempotencyKey = visitKeyRef.current;

    if (mode === "BONO_SESSION") {
      const priceEuro = parseAmount(packagePrice);
      const sessions = Number(packageSessions);

      if (!packageName.trim()) {
        setNotice("Indica el nombre del bono.");
        return;
      }

      if (!(priceEuro > 0) || !Number.isInteger(sessions) || sessions < 1) {
        setNotice("Indica el precio del bono y cuántas sesiones tiene.");
        return;
      }

      record.mutate(
        { kind: "BONO_SESSION", package: { name: packageName.trim(), priceEuro, sessions }, idempotencyKey },
        { onSuccess, onError },
      );
      return;
    }

    const filled = lines.filter((line) => line.amount.trim() !== "");
    const parsed = filled.map((line) => ({
      amountEuro: parseAmount(line.amount),
      ...(line.category ? { category: line.category } : {}),
    }));

    if (parsed.length === 0 || parsed.some((line) => !Number.isFinite(line.amountEuro) || line.amountEuro < 0)) {
      setNotice("Indica lo que ha pagado la clienta, con al menos un importe.");
      return;
    }

    if (!parsed.some((line) => line.amountEuro > 0)) {
      setNotice("El importe pagado tiene que ser mayor que cero.");
      return;
    }

    const discountedProducts = discounted.trim() === "" ? undefined : Number(discounted);

    if (discountedProducts !== undefined && (!Number.isInteger(discountedProducts) || discountedProducts < 0)) {
      setNotice("Los productos con descuento tienen que ser un número entero.");
      return;
    }

    record.mutate(
      { kind: "PAYMENT", lines: parsed, discountedProducts, idempotencyKey },
      { onSuccess, onError },
    );
  };

  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="rounded-lg border border-border bg-background/70 p-4">
        <div className="mb-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Registrar una visita</p>
          <div role="group" aria-label="Tipo de visita" className="flex gap-1 text-xs">
            {(
              [
                ["PAYMENT", "Pago"],
                ["BONO_SESSION", "Sesión de bono"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setNotice(null);
                }}
                className={
                  mode === value
                    ? "rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground"
                    : "rounded-full border border-border px-3 py-1 text-muted-foreground"
                }
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "PAYMENT" ? (
          <div className="mt-3 grid gap-3">
            {lines.map((line) => (
              <div key={line.key} className="grid items-end gap-2 sm:grid-cols-[1fr_110px_auto]">
                <label className="text-xs font-medium text-muted-foreground">
                  Qué se ha pagado
                  <select
                    value={line.category}
                    onChange={(event) =>
                      updateLine(line.key, { category: event.target.value as CategoryCode | "" })
                    }
                    className={inputClass}
                  >
                    <option value="">Sin categoría</option>
                    {SELECTABLE_CATEGORIES.map((code) => (
                      <option key={code} value={code}>
                        {CATEGORY_LABELS[code]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Importe (€)
                  <input
                    inputMode="decimal"
                    value={line.amount}
                    onChange={(event) => updateLine(line.key, { amount: event.target.value })}
                    placeholder="0,00"
                    className={inputClass}
                  />
                </label>
                {lines.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar esta línea"
                    onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((current) => [...current, { key: nextKey.current++, category: "", amount: "" }])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> <span>Añadir otro importe</span>
              </Button>
              <label className="text-xs font-medium text-muted-foreground">
                Productos con descuento de nivel
                <input
                  inputMode="numeric"
                  value={discounted}
                  onChange={(event) => {
                    setDiscounted(event.target.value);
                    setNotice(null);
                  }}
                  placeholder="0"
                  className={`${inputClass} w-24`}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
              Nombre del bono
              <input
                value={packageName}
                onChange={(event) => {
                  setPackageName(event.target.value);
                  setNotice(null);
                }}
                placeholder="Bono facial 5 sesiones"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Precio del bono (€)
              <input
                inputMode="decimal"
                value={packagePrice}
                onChange={(event) => {
                  setPackagePrice(event.target.value);
                  setNotice(null);
                }}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Sesiones del bono
              <input
                inputMode="numeric"
                value={packageSessions}
                onChange={(event) => {
                  setPackageSessions(event.target.value);
                  setNotice(null);
                }}
                className={inputClass}
              />
            </label>
          </div>
        )}

        <Button type="submit" className="mt-3 w-full" disabled={record.isPending}>
          {record.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          <span>{record.isPending ? "Guardando" : "Registrar visita"}</span>
        </Button>
        {notice ? (
          <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {notice}
          </p>
        ) : null}
      </form>

      {outcome ? <VisitResult outcome={outcome} /> : null}

      <RewardsList
        memberId={memberId}
        rewards={rewards.data ?? []}
        loading={rewards.isLoading}
        failed={rewards.isError}
        visitId={visitId}
      />
    </div>
  );
}

function VisitResult({ outcome }: { outcome: VisitOutcome }) {
  return (
    <div role="status" className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span>
          {outcome.duplicate ? "Esta visita ya estaba registrada." : "Visita registrada."}
        </span>
      </p>
      <p className="mt-2 text-muted-foreground">
        Suma {formatProgress(outcome.progress)} de progreso{outcome.doubled ? " (puntos dobles)" : ""}.
        Lleva {formatProgress(outcome.lifetimeAfter)} en total.
        {outcome.tier ? ` Nivel: ${outcome.tier}.` : ""}
      </p>
      {outcome.issued.length > 0 ? (
        <ul className="mt-2 grid gap-1">
          {outcome.issued.map((reward) => (
            <li key={reward.id} className="flex items-center gap-2 font-medium">
              <Gift className="h-3.5 w-3.5 text-gold" /> <span>Nuevo: {reward.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Productos con descuento que le quedan este año: {outcome.discountRemaining}.
      </p>
    </div>
  );
}

function RewardsList({
  memberId,
  rewards,
  loading,
  failed,
  visitId,
}: {
  memberId: string;
  rewards: MemberReward[];
  loading: boolean;
  failed: boolean;
  visitId: string | null;
}) {
  const redeem = useRedeemReward(memberId);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [surprise, setSurprise] = React.useState<Record<string, string>>({});

  return (
    <section className="rounded-lg border border-border bg-background/70 p-4">
      <p className="text-sm font-semibold">Premios de la clienta</p>
      {!visitId ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Un premio se canjea durante una visita de pago: registra primero la visita de hoy.
        </p>
      ) : null}

      {loading ? <p className="mt-3 text-sm text-muted-foreground">Cargando…</p> : null}
      {failed ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          No se han podido cargar los premios.
        </p>
      ) : null}
      {!loading && !failed && rewards.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Todavía no tiene premios.</p>
      ) : null}

      <ul className="mt-3 grid gap-2">
        {rewards.map((reward) => {
          const available = reward.status === "disponible";
          const pool = reward.detail?.pool ?? [];
          const isAutomatic = reward.detail?.perk === "doble";

          return (
            <li key={reward.id} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{reward.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {reward.status === "canjeado"
                      ? `Canjeado${reward.surpriseItem ? `: ${reward.surpriseItem}` : ""}`
                      : reward.status === "caducado"
                        ? "Caducado"
                        : `Caduca el ${new Date(reward.expiresAt).toLocaleDateString("es-ES")}`}
                  </p>
                </div>

                {available && isAutomatic ? (
                  <span className="text-xs text-muted-foreground">Se aplica sola en la próxima visita</span>
                ) : null}

                {available && !isAutomatic ? (
                  <div className="flex items-center gap-2">
                    {pool.length > 0 ? (
                      <select
                        aria-label="Regalo sorpresa"
                        value={surprise[reward.id] ?? ""}
                        onChange={(event) =>
                          setSurprise((current) => ({ ...current, [reward.id]: event.target.value }))
                        }
                        className="h-9 rounded-md border border-input bg-card px-2 text-xs"
                      >
                        <option value="">Elige el regalo</option>
                        {pool.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name ?? item.id}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      disabled={!visitId || redeem.isPending}
                      onClick={() => {
                        if (!visitId) return;

                        setProblem(null);
                        redeem.mutate(
                          {
                            rewardId: reward.id,
                            visitId,
                            surpriseItem: pool.length > 0 ? surprise[reward.id] || undefined : undefined,
                          },
                          {
                            onError: (error) =>
                              setProblem(messageOf(error, "No se ha podido canjear el premio.")),
                          },
                        );
                      }}
                    >
                      <span>Canjear</span>
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {problem ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {problem}
        </p>
      ) : null}
    </section>
  );
}
