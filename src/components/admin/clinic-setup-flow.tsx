"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import {
  BillingFields,
  billingDraftFrom,
  type BillingDraft,
} from "@/components/billing/billing-fields";
import { ProgramSetup } from "@/components/admin/program/program-setup";
import { Button } from "@/components/ui/button";
import { usePrograms } from "@/features/onboarding/api/useOnboarding";
import { AutomationsPanel } from "@/features/notifications/components/automations-panel";
import { adminSettingsApi } from "@/features/notifications/settings-api";
import { ApiError, saveClinicBilling } from "@/lib/api-client";

/**
 * Steps 4 to 8 of onboarding, on the draft centre the wizard created (steps 1 to 3).
 *
 * The centre exists but is inactive: no public sign-up page and no notifications until the last
 * step activates it. Each step saves as it goes, so closing the tab loses nothing and the
 * progress shown is what is really done (founders' E2E items 15-17, 19, 38).
 */

const STEPS = [
  { id: "program", label: "Tratamientos y programa" },
  { id: "messages", label: "Mensajes automáticos" },
  { id: "billing", label: "Facturación" },
  { id: "account", label: "Cuenta" },
  { id: "activate", label: "Activar" },
] as const;

/** Steps 1 to 3 (owner, center, card) happened in the wizard before the centre existed. */
const DONE_BEFORE = 3;
const TOTAL_STEPS = DONE_BEFORE + STEPS.length;

export function ClinicSetupFlow({
  clinicId,
  clinicName,
  alreadyActive,
  hasCard,
  accountPanel,
  accountShared,
  initialBilling,
}: {
  clinicId: string;
  clinicName: string;
  alreadyActive: boolean;
  hasCard: boolean;
  /** The credentials block, rendered on the server and passed in. */
  accountPanel: React.ReactNode;
  accountShared: boolean;
  /** The billing details already saved for the centre (empty when none). */
  initialBilling: BillingDraft;
}) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const programs = usePrograms(clinicId);
  const hasLiveProgram = (programs.data ?? []).some(
    (program) => program.status === "ACTIVO",
  );
  const step = STEPS[stepIndex];
  const canContinue = step.id !== "program" || hasLiveProgram;

  const next = () =>
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));

  return (
    <div className="grid gap-6">
      <header className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">
              {alreadyActive ? "Centro activo" : "Borrador, aún no está activo"}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">
              {clinicName}
            </h2>
          </div>
          <span className="text-sm text-[#806d63]">
            Paso {DONE_BEFORE + stepIndex + 1} de {TOTAL_STEPS}
          </span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee6e0]">
          <span
            className="block h-full rounded-full bg-[#201715] transition-all"
            style={{
              width: `${((DONE_BEFORE + stepIndex + 1) / TOTAL_STEPS) * 100}%`,
            }}
          />
        </div>
        <ol className="mt-4 flex flex-wrap gap-2 text-xs">
          {STEPS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setStepIndex(index)}
                aria-current={index === stepIndex ? "step" : undefined}
                className={
                  index === stepIndex
                    ? "rounded-full bg-[#201715] px-3 py-1 font-semibold text-white"
                    : "rounded-full border border-[#ded2cb] px-3 py-1 text-[#806d63]"
                }
              >
                {DONE_BEFORE + index + 1}. {item.label}
              </button>
            </li>
          ))}
        </ol>
      </header>

      {step.id === "program" ? (
        <ProgramSetup clinicId={clinicId} onPublished={next} />
      ) : null}
      {step.id === "messages" ? <MessagesStep clinicId={clinicId} /> : null}
      {step.id === "billing" ? (
        <BillingStep clinicId={clinicId} initial={initialBilling} />
      ) : null}
      {step.id === "account" ? accountPanel : null}
      {step.id === "activate" ? (
        <ActivateStep
          clinicId={clinicId}
          alreadyActive={alreadyActive}
          checks={[
            { label: "Tarjeta diseñada", done: hasCard },
            { label: "Programa activo", done: hasLiveProgram },
            {
              label: "Enlace de acceso enviado al propietario",
              done: accountShared,
              optional: true,
            },
          ]}
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((current) => current - 1)}
        >
          Anterior
        </Button>
        {step.id !== "activate" ? (
          <div className="flex items-center gap-3">
            {!canContinue ? (
              <p className="text-xs text-[#806d63]">
                Activa el programa para continuar.
              </p>
            ) : null}
            <Button
              type="button"
              onClick={next}
              disabled={!canContinue}
              className="bg-[#201715] text-white hover:bg-[#3b2a25]"
            >
              Continuar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The automatic messages. The same panel the centre later uses in its own notification centre,
 * so nothing appears there that was not established here. Anything a message needs that cannot
 * be known yet (the Google review link, the referral reward) is entered here and stays editable.
 * Every change saves on its own, and the step never blocks Continue: events that need a value
 * simply stay off until it is set.
 */
function MessagesStep({ clinicId }: { clinicId: string }) {
  const api = React.useMemo(() => adminSettingsApi(clinicId), [clinicId]);

  return (
    <div className="grid gap-4 rounded-[26px] border border-[#ded2cb] bg-white/78 p-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold">
          Mensajes automáticos
        </h2>
        <p className="mt-1 text-sm text-[#806d63]">
          Mantén o desactiva cada mensaje que el centro envía por sí solo y
          edita su texto. Puedes cambiarlo todo más tarde desde el centro de
          notificaciones.
        </p>
      </div>
      <AutomationsPanel api={api} />
    </div>
  );
}

/**
 * Billing details for invoicing the centre. Optional, so Continue is never blocked, but saved
 * here they appear in the centre's own Settings › Información del centro, where it can edit them.
 */
function BillingStep({
  clinicId,
  initial,
}: {
  clinicId: string;
  initial: BillingDraft;
}) {
  const [draft, setDraft] = React.useState(initial);
  const [saved, setSaved] = React.useState(initial);
  const [state, setState] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [problem, setProblem] = React.useState<string | null>(null);
  const dirty = (Object.keys(draft) as Array<keyof BillingDraft>).some(
    (key) => draft[key] !== saved[key],
  );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("saving");
    setProblem(null);

    try {
      const result = await saveClinicBilling(clinicId, draft);
      const next = billingDraftFrom(result);

      setDraft(next);
      setSaved(next);
      setState("saved");
    } catch (error) {
      setState("error");
      setProblem(
        error instanceof ApiError && error.detail
          ? error.detail
          : "No se pudieron guardar los datos de facturación.",
      );
    }
  };

  return (
    <form
      onSubmit={save}
      className="grid gap-4 rounded-[26px] border border-[#ded2cb] bg-white/78 p-5"
    >
      <div>
        <h2 className="font-serif text-2xl font-semibold">Datos de facturación</h2>
        <p className="mt-1 text-sm text-[#806d63]">
          A quién y dónde se envían las facturas de Voone. Es opcional ahora:
          el centro también puede rellenarlo más tarde desde Ajustes.
        </p>
      </div>
      <BillingFields
        value={draft}
        onChange={(key, next) => {
          setDraft((current) => ({ ...current, [key]: next }));
          setState("idle");
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={state === "saving" || !dirty}
          className="bg-[#201715] text-white hover:bg-[#3b2a25]"
        >
          {state === "saving" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Guardar datos de facturación
        </Button>
        {state === "saved" && !dirty ? (
          <p
            role="status"
            className="flex items-center gap-1 text-sm font-semibold text-[#3d6a48]"
          >
            <Check className="h-4 w-4" /> Guardado
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="text-sm font-semibold text-[#b94135]">
            {problem}
          </p>
        ) : null}
        {dirty && state !== "saving" ? (
          <p className="text-xs text-[#806d63]">Cambios sin guardar.</p>
        ) : null}
      </div>
    </form>
  );
}

function ActivateStep({
  clinicId,
  alreadyActive,
  checks,
}: {
  clinicId: string;
  alreadyActive: boolean;
  checks: Array<{ label: string; done: boolean; optional?: boolean }>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const ready = checks.every((check) => check.done || check.optional);

  const activate = async () => {
    setBusy(true);
    setProblem(null);

    try {
      const response = await fetch(
        `/api/admin/clinics/${encodeURIComponent(clinicId)}/activate`,
        { method: "POST" },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        setProblem(body?.message ?? "No se pudo activar el centro.");
        return;
      }

      router.push(`/admin/clinics/${encodeURIComponent(clinicId)}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-[26px] border border-[#ded2cb] bg-white/78 p-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold">
          {alreadyActive ? "El centro está activo" : "Activar el centro"}
        </h2>
        <p className="mt-1 text-sm text-[#806d63]">
          {alreadyActive
            ? "Los clientes ya pueden registrarse y el centro está operativo."
            : "Al activarlo, se abre la página de registro y el centro puede registrar visitas."}
        </p>
      </div>

      <ul className="grid gap-2 text-sm">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2">
            <Check
              className={
                check.done ? "h-4 w-4 text-[#2f7d57]" : "h-4 w-4 opacity-25"
              }
              aria-hidden
            />
            <span className={check.done ? "" : "text-[#806d63]"}>
              {check.label}
              {!check.done && check.optional
                ? " (pendiente, se puede hacer más tarde)"
                : ""}
            </span>
          </li>
        ))}
      </ul>

      {!alreadyActive ? (
        confirming ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#f4e9df] p-4">
            <p className="text-sm font-semibold">
              ¿Seguro que quieres continuar?
            </p>
            <Button
              type="button"
              onClick={() => void activate()}
              disabled={busy}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <span>Sí, activar</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!ready}
            className="w-fit bg-[#201715] text-white hover:bg-[#3b2a25]"
          >
            Activar centro
          </Button>
        )
      ) : null}

      {problem ? (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
