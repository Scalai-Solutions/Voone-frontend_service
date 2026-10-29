"use client";

import * as React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Gift,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import {
  CATEGORY_LABELS,
  SELECTABLE_CATEGORIES,
} from "@/components/admin/program/categories";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  useBonoPlans,
  useCancelMemberBono,
  useMemberBonos,
} from "@/features/bonos/api/useBonos";
import {
  useMemberRewards,
  useRecordVisit,
  useRedeemReward,
  useStaffCatalog,
} from "@/features/program/api/useStaffProgram";
import { ApiError, newIdempotencyKey } from "@/lib/api-client";
import type { CategoryCode } from "@/lib/onboarding-api";
import type { MemberReward, VisitOutcome } from "@/lib/staff-program-api";
import { formatPoints } from "@/lib/points";

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

/** The slider's options, in the order it offers them. */
const POINT_MULTIPLIERS = [2, 3, 5, 10] as const;

interface LineDraft {
  key: number;
  category: CategoryCode | "";
  amount: string;
  /** The catalogue item picked for this line, so the dropdown shows it as chosen. */
  picked: string;
}

/** "12,50" and "12.50" both mean twelve euros fifty; people in Spain type the first. */
const parseAmount = (value: string): number =>
  Number(value.trim().replace(",", "."));

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

export function ProgramVisitPanel({
  memberId,
  onBack,
}: {
  memberId: string;
  /** Where "Volver" goes; defaults to the previous page. */
  onBack?: () => void;
}) {
  const [mode, setMode] = React.useState<"PAYMENT" | "BONO_SESSION">("PAYMENT");
  const [lines, setLines] = React.useState<LineDraft[]>([
    { key: 1, category: "", amount: "", picked: "" },
  ]);
  const nextKey = React.useRef(2);
  const [discounted, setDiscounted] = React.useState("");
  const [packageName, setPackageName] = React.useState("");
  const [packagePrice, setPackagePrice] = React.useState("");
  const [packageSessions, setPackageSessions] = React.useState("");
  /** "", "bono:<id>", "plan:<id>" or "manual" — what the session comes out of. */
  const [bonoChoice, setBonoChoice] = React.useState("");
  /** Only for a plan that starts mid-way, for a client who did sessions elsewhere. */
  const [startAtSession, setStartAtSession] = React.useState("");
  /** Bonus points, optional, in multiples of ten. */
  const [bonusPoints, setBonusPoints] = React.useState("");
  /** The chosen points multiplier: 0 = none, then an index into POINT_MULTIPLIERS. */
  const [multiplierIndex, setMultiplierIndex] = React.useState(0);
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

  const catalog = useStaffCatalog();
  const record = useRecordVisit(memberId);
  const rewards = useMemberRewards(memberId, true);
  const bonoPlans = useBonoPlans();
  const memberBonos = useMemberBonos(memberId, mode === "BONO_SESSION");
  const cancelBono = useCancelMemberBono(memberId);

  const activePlans = (bonoPlans.data ?? []).filter((plan) => plan.active);
  const activeBonos = (memberBonos.data ?? []).filter(
    (bono) => bono.status === "ACTIVE",
  );
  const selectedBono = bonoChoice.startsWith("bono:")
    ? (activeBonos.find((bono) => bono.id === bonoChoice.slice(5)) ?? null)
    : null;

  /**
   * The visit's own points, before any tier multiplier the backend applies: the payment
   * lines, or the bono's price per session. It is what the slider multiplies, so it is
   * recomputed as the staff member types.
   */
  const originalPoints = (() => {
    if (mode === "PAYMENT") {
      const total = lines.reduce((sum, line) => {
        const amount = parseAmount(line.amount);

        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);

      return Math.round(total * 10);
    }

    if (bonoChoice.startsWith("bono:") && selectedBono) {
      return Math.round(selectedBono.pricePerSessionEuro * 10);
    }

    if (bonoChoice.startsWith("plan:")) {
      const plan = activePlans.find((item) => item.id === bonoChoice.slice(5));

      return plan ? Math.round(plan.pricePerSessionEuro * 10) : 0;
    }

    if (bonoChoice === "manual") {
      const price = parseAmount(packagePrice);
      const sessions = Number(packageSessions);

      if (price > 0 && Number.isInteger(sessions) && sessions > 0) {
        return Math.round((price / sessions) * 10);
      }
    }

    return 0;
  })();

  /** The slider's choice; null when it sits on "sin extra". */
  const multiplier =
    multiplierIndex > 0
      ? (POINT_MULTIPLIERS[multiplierIndex - 1] ?? null)
      : null;

  /**
   * The extra the slider grants, DERIVED from the visit's own points so it can never drift
   * from them: change the amount or the bono and the figure follows without anyone retyping
   * it. It is the part ABOVE the original — the visit always awards its own points, so x2
   * means the client ends with double — rounded to the nearest ten, because the ledger
   * only holds whole euros of progress.
   */
  const multipliedBonus =
    multiplier !== null && originalPoints > 0
      ? Math.round((originalPoints * (multiplier - 1)) / 10) * 10
      : null;

  const updateLine = (key: number, patch: Partial<LineDraft>) => {
    setNotice(null);
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const onSuccess = (result: VisitOutcome) => {
      visitKeyRef.current = null;
      setOutcome(result);
      setVisitId(result.visitId);
      storeVisit(memberId, result.visitId);
      setLines([
        { key: nextKey.current++, category: "", amount: "", picked: "" },
      ]);
      setDiscounted("");
      setPackageName("");
      setPackagePrice("");
      setPackageSessions("");
      setBonoChoice("");
      setStartAtSession("");
      setBonusPoints("");
      setMultiplierIndex(0);
    };
    const onError = (error: unknown) =>
      setNotice(
        messageOf(
          error,
          "No se ha podido registrar la visita. Inténtalo de nuevo.",
        ),
      );

    visitKeyRef.current ??= newIdempotencyKey();
    const idempotencyKey = visitKeyRef.current;

    // Bonus points: optional, whole multiples of ten — the ledger holds whole euros.
    // The slider wins while it is chosen; the typed figure is what remains otherwise.
    const bonus =
      multiplier !== null && multipliedBonus !== null
        ? multipliedBonus
        : bonusPoints.trim() === ""
          ? undefined
          : Number(bonusPoints.trim());

    if (
      bonus !== undefined &&
      (!Number.isInteger(bonus) || bonus < 10 || bonus % 10 !== 0)
    ) {
      setNotice(
        "Los puntos extra deben ser múltiplos de 10 (10 puntos = 1 €).",
      );
      return;
    }

    if (mode === "BONO_SESSION") {
      if (bonoChoice.startsWith("bono:")) {
        record.mutate(
          {
            kind: "BONO_SESSION",
            memberBonoId: bonoChoice.slice(5),
            ...(bonus !== undefined ? { bonusPoints: bonus } : {}),
            idempotencyKey,
          },
          { onSuccess, onError },
        );
        return;
      }

      if (bonoChoice.startsWith("plan:")) {
        const start =
          startAtSession.trim() === ""
            ? undefined
            : Number(startAtSession.trim());

        if (start !== undefined && (!Number.isInteger(start) || start < 1)) {
          setNotice("La sesión inicial tiene que ser un número entero.");
          return;
        }

        record.mutate(
          {
            kind: "BONO_SESSION",
            planId: bonoChoice.slice(5),
            ...(start !== undefined ? { startAtSession: start } : {}),
            ...(bonus !== undefined ? { bonusPoints: bonus } : {}),
            idempotencyKey,
          },
          { onSuccess, onError },
        );
        return;
      }

      if (bonoChoice === "manual") {
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
          {
            kind: "BONO_SESSION",
            package: { name: packageName.trim(), priceEuro, sessions },
            ...(bonus !== undefined ? { bonusPoints: bonus } : {}),
            idempotencyKey,
          },
          { onSuccess, onError },
        );
        return;
      }

      setNotice(
        "Elige el bono del cliente o un plan para empezar uno nuevo.",
      );
      return;
    }

    const filled = lines.filter((line) => line.amount.trim() !== "");
    const parsed = filled.map((line) => ({
      amountEuro: parseAmount(line.amount),
      ...(line.category ? { category: line.category } : {}),
    }));

    if (
      parsed.length === 0 ||
      parsed.some(
        (line) => !Number.isFinite(line.amountEuro) || line.amountEuro < 0,
      )
    ) {
      setNotice("Indica lo que ha pagado el cliente, con al menos un importe.");
      return;
    }

    if (!parsed.some((line) => line.amountEuro > 0)) {
      setNotice("El importe pagado tiene que ser mayor que cero.");
      return;
    }

    const discountedProducts =
      discounted.trim() === "" ? undefined : Number(discounted);

    if (
      discountedProducts !== undefined &&
      (!Number.isInteger(discountedProducts) || discountedProducts < 0)
    ) {
      setNotice("Los productos con descuento tienen que ser un número entero.");
      return;
    }

    record.mutate(
      {
        kind: "PAYMENT",
        lines: parsed,
        discountedProducts,
        ...(bonus !== undefined ? { bonusPoints: bonus } : {}),
        idempotencyKey,
      },
      { onSuccess, onError },
    );
  };

  return (
    <div className="grid gap-4">
      <form
        onSubmit={submit}
        className="rounded-lg border border-border bg-background/70 p-4"
      >
        <div className="mb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (onBack ? onBack() : window.history.back())}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Registrar una visita</p>
          <div
            role="group"
            aria-label="Tipo de visita"
            className="flex gap-1 text-xs"
          >
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
              <div
                key={line.key}
                className="grid items-end gap-2 sm:grid-cols-[1fr_110px_auto]"
              >
                <label className="text-xs font-medium text-muted-foreground">
                  Qué se ha pagado
                  {(catalog.data ?? []).length > 0 ? (
                    <Combobox
                      value={line.picked}
                      onChange={(value) => {
                        const item = (catalog.data ?? []).find(
                          (entry) => entry.externalId === value,
                        );

                        if (item) {
                          // The pick fills the line AND stays visible in the dropdown
                          // itself, so the staff member sees what they chose.
                          updateLine(line.key, {
                            category: item.category ?? "",
                            amount: String(item.priceEuro).replace(".", ","),
                            picked: item.externalId,
                          });
                        }
                      }}
                      options={(catalog.data ?? []).map((item) => ({
                        value: item.externalId,
                        label: item.name,
                        hint: `${item.priceEuro.toLocaleString("es-ES")} €`,
                      }))}
                      placeholder="Elegir del catálogo…"
                      emptyMessage="Nada coincide con esa búsqueda."
                    />
                  ) : null}
                  <select
                    value={line.category}
                    onChange={(event) =>
                      updateLine(line.key, {
                        category: event.target.value as CategoryCode | "",
                      })
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
                    onChange={(event) =>
                      updateLine(line.key, { amount: event.target.value })
                    }
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
                    onClick={() =>
                      setLines((current) =>
                        current.filter((item) => item.key !== line.key),
                      )
                    }
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
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    {
                      key: nextKey.current++,
                      category: "",
                      amount: "",
                      picked: "",
                    },
                  ])
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />{" "}
                <span>Añadir otro importe</span>
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
          <div className="mt-3 grid gap-3">
            <label className="text-xs font-medium text-muted-foreground">
              Bono del cliente
              <Combobox
                value={bonoChoice}
                onChange={(value) => {
                  setBonoChoice(value);
                  setNotice(null);
                }}
                options={[
                  ...activeBonos.map((bono) => ({
                    value: `bono:${bono.id}`,
                    label: bono.name,
                    hint: `En curso · sesión ${bono.sessionsUsed + 1} de ${bono.totalSessions} · quedan ${bono.remaining}`,
                  })),
                  ...activePlans.map((plan) => ({
                    value: `plan:${plan.id}`,
                    label: plan.name,
                    hint: `${plan.pricePerSessionEuro.toLocaleString("es-ES")} €/sesión · ${plan.totalSessions} sesiones`,
                  })),
                  {
                    value: "manual",
                    label: "Otro bono",
                    hint: "Precio y sesiones a mano, sin seguimiento",
                  },
                ]}
                placeholder="Elige el bono…"
                emptyMessage="No hay bonos que coincidan."
              />
            </label>

            {selectedBono ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background/70 p-3 text-sm">
                <p>
                  <span className="font-semibold">{selectedBono.name}:</span>{" "}
                  sesión {selectedBono.sessionsUsed + 1} de{" "}
                  {selectedBono.totalSessions} · quedan {selectedBono.remaining}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={cancelBono.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Cancelar este bono? Las sesiones ya registradas se mantienen.",
                      )
                    ) {
                      cancelBono.mutate(selectedBono.id, {
                        onSuccess: () => {
                          setBonoChoice("");
                          setNotice("Bono cancelado.");
                        },
                        onError: (error) =>
                          setNotice(
                            messageOf(
                              error,
                              "No se ha podido cancelar el bono.",
                            ),
                          ),
                      });
                    }
                  }}
                >
                  Cancelar bono
                </Button>
              </div>
            ) : null}

            {bonoChoice.startsWith("plan:") ? (
              <label className="text-xs font-medium text-muted-foreground">
                Empezar en la sesión (si ya hizo algunas en otro sitio)
                <input
                  inputMode="numeric"
                  value={startAtSession}
                  onChange={(event) => {
                    setStartAtSession(event.target.value);
                    setNotice(null);
                  }}
                  placeholder="1"
                  className={`${inputClass} w-24`}
                />
              </label>
            ) : null}

            {bonoChoice === "manual" ? (
              <div className="grid gap-3 sm:grid-cols-2">
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
            ) : null}
          </div>
        )}

        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          Puntos extra (opcional)
          <input
            inputMode="numeric"
            value={
              multiplier !== null && multipliedBonus !== null
                ? String(multipliedBonus)
                : bonusPoints
            }
            onChange={(event) => {
              setBonusPoints(event.target.value);
              setMultiplierIndex(0);
              setNotice(null);
            }}
            placeholder="0"
            className={`${inputClass} w-28`}
          />
          <span className="mt-1 block text-[11px] font-normal leading-4 text-muted-foreground">
            En múltiplos de 10 (10 puntos = 1 €). Se suman al progreso de la
            visita, sin multiplicador de nivel.
          </span>
        </label>

        {originalPoints > 0 ? (
          <div className="mt-2 rounded-md border border-border bg-background/70 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Multiplicar los {formatPoints(originalPoints)} puntos de
              esta visita
            </p>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={multiplierIndex}
              onChange={(event) => {
                setMultiplierIndex(Number(event.target.value));
                setNotice(null);
              }}
              aria-label="Multiplicador de puntos"
              className="mt-2 w-full"
            />
            <div className="mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
              {["sin extra", "x2", "x3", "x5", "x10"].map((label, index) => (
                <span
                  key={label}
                  className={
                    multiplierIndex === index ? "font-bold text-foreground" : ""
                  }
                >
                  {label}
                </span>
              ))}
            </div>
            {multiplier !== null && multipliedBonus !== null ? (
              <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                Se añadirán {formatPoints(multipliedBonus)} puntos
                extra a los {formatPoints(originalPoints)} de la
                visita.
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          type="submit"
          className="mt-3 w-full"
          disabled={record.isPending}
        >
          {record.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          <span>{record.isPending ? "Guardando" : "Registrar visita"}</span>
        </Button>
        {notice ? (
          <p
            role="alert"
            className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {notice}
          </p>
        ) : null}
      </form>

      {outcome ? <VisitResult outcome={outcome} /> : null}

      <RewardsList
        memberId={memberId}
        rewards={rewards.data?.rewards ?? []}
        loading={rewards.isLoading}
        failed={rewards.isError}
        visitId={visitId}
      />
    </div>
  );
}

function VisitResult({ outcome }: { outcome: VisitOutcome }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm"
    >
      <p className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span>
          {outcome.duplicate
            ? "Esta visita ya estaba registrada."
            : "Visita registrada."}
        </span>
      </p>
      <p className="mt-2 text-muted-foreground">
        Suma {formatPoints(outcome.points)} puntos
        {outcome.doubled ? " (puntos dobles)" : ""}. Lleva{" "}
        {formatPoints(outcome.pointsTotal)} puntos en total.
        {outcome.tier ? ` Nivel: ${outcome.tier}.` : ""}
      </p>
      {outcome.bonusPoints > 0 ? (
        <p className="mt-1 text-muted-foreground">
          Incluye {formatPoints(outcome.bonusPoints)} puntos extra.
        </p>
      ) : null}
      {outcome.bono ? (
        <p className="mt-1 text-muted-foreground">
          {outcome.bono.name}: sesión {outcome.bono.session} de{" "}
          {outcome.bono.total}
          {outcome.bono.remaining > 0
            ? ` · le quedan ${outcome.bono.remaining}`
            : " · bono completado"}
          .
        </p>
      ) : null}
      {outcome.issued.length > 0 ? (
        <ul className="mt-2 grid gap-1">
          {outcome.issued.map((reward) => (
            <li key={reward.id} className="flex items-center gap-2 font-medium">
              <Gift className="h-3.5 w-3.5 text-gold" />{" "}
              <span>Nuevo: {reward.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Productos con descuento que le quedan este año:{" "}
        {outcome.discountRemaining}.
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
      <p className="text-sm font-semibold">Premios del cliente</p>
      {!visitId ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Un premio se canjea durante una visita de pago: registra primero la
          visita de hoy.
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Cargando…</p>
      ) : null}
      {failed ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          No se han podido cargar los premios.
        </p>
      ) : null}
      {!loading && !failed && rewards.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Todavía no tiene premios.
        </p>
      ) : null}

      <ul className="mt-3 grid gap-2">
        {rewards.map((reward) => {
          const available = reward.status === "disponible";
          const pool = reward.detail?.pool ?? [];
          const isAutomatic = reward.detail?.perk === "doble";

          return (
            <li
              key={reward.id}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
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
                  <span className="text-xs text-muted-foreground">
                    Se aplica sola en la próxima visita
                  </span>
                ) : null}

                {available && !isAutomatic ? (
                  <div className="flex items-center gap-2">
                    {pool.length > 0 ? (
                      <select
                        aria-label="Regalo sorpresa"
                        value={surprise[reward.id] ?? ""}
                        onChange={(event) =>
                          setSurprise((current) => ({
                            ...current,
                            [reward.id]: event.target.value,
                          }))
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
                            surpriseItem:
                              pool.length > 0
                                ? surprise[reward.id] || undefined
                                : undefined,
                          },
                          {
                            onError: (error) =>
                              setProblem(
                                messageOf(
                                  error,
                                  "No se ha podido canjear el premio.",
                                ),
                              ),
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
