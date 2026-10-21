"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCatalog,
  useCreateDraft,
  useEstimates,
  useProgram,
  usePrograms,
  usePublishProgram,
  useRecalibration,
  useSwapMilestone,
} from "@/features/onboarding/api/useOnboarding";
import { ApiError } from "@/lib/api-client";
import type {
  CatalogRow,
  OnboardingAnswers,
  ProgramListItem,
} from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import { CalculatorSection } from "./calculator-section";
import { CatalogStep } from "./catalog-step";
import { ProgramView } from "./program-view";
import { QuestionsStep } from "./questions-step";

/**
 * A centre going from a price list to an approved loyalty programme.
 *
 * Three screens, as the guide has them: the catalogue, six questions, and the programme that
 * results. Nothing here decides anything about the programme — the engine does, behind an
 * endpoint — so this component's job is to keep the centre oriented: which screen they are on,
 * what is already saved, and what the next safe action is.
 */

const STEPS = ["Catálogo", "Preguntas", "Programa"] as const;

const DEFAULT_ANSWERS: OnboardingAnswers = {
  ticket: null,
  freq: null,
  objective: "equilibrado",
  investment: "equilibrado",
  occupancy: "o2",
};

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof ApiError && error.detail ? error.detail : fallback;

export function ProgramSetup({
  clinicId,
  onPublished,
}: {
  clinicId: string;
  /** Where to go once the programme is live. Defaults to the centre's page. */
  onPublished?: () => void;
}) {
  const programs = usePrograms(clinicId);
  const catalog = useCatalog(clinicId);

  if (programs.isLoading || catalog.isLoading) {
    return (
      <div className="grid gap-4" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (programs.isError || catalog.isError) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
      >
        {messageOf(
          programs.error ?? catalog.error,
          "No se ha podido cargar el programa del centro.",
        )}
      </p>
    );
  }

  const list = programs.data ?? [];
  const hasProgram = list.some(
    (p) => p.status === "ACTIVO" || p.status === "BORRADOR",
  );
  const hasCatalog = (catalog.data?.length ?? 0) > 0;

  // Mounted only now, with the starting screen worked out from what was found ON ARRIVAL. It must
  // not be recomputed as the data changes: the first autosave makes the catalogue non-empty, and
  // a starting screen that followed the data would carry someone off the one they are typing in.
  return (
    <ProgramSetupLoaded
      clinicId={clinicId}
      initialStep={hasProgram ? 2 : hasCatalog ? 1 : 0}
      programs={list}
      catalogRows={catalog.data ?? []}
      onPublished={onPublished}
    />
  );
}

function ProgramSetupLoaded({
  clinicId,
  initialStep,
  programs: list,
  catalogRows,
  onPublished,
}: {
  clinicId: string;
  initialStep: number;
  programs: ProgramListItem[];
  catalogRows: CatalogRow[];
  onPublished?: () => void;
}) {
  const router = useRouter();
  const active = list.find((p) => p.status === "ACTIVO") ?? null;
  const latestDraft =
    [...list]
      .filter((p) => p.status === "BORRADOR")
      .sort((a, b) => b.version - a.version)[0] ?? null;

  // A draft made in this visit wins over one found on arrival.
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const shownId = draftId ?? latestDraft?.id ?? active?.id ?? null;
  const shown = useProgram(clinicId, shownId);

  const [step, setStep] = React.useState<number>(initialStep);
  const [answersOverride, setAnswers] =
    React.useState<OnboardingAnswers | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  const answers = answersOverride ?? shown.data?.answers ?? DEFAULT_ANSWERS;

  const createDraft = useCreateDraft(clinicId);
  const publish = usePublishProgram(clinicId);
  const swap = useSwapMilestone(clinicId, shownId ?? "");

  const estimates = useEstimates(clinicId, step === 1);
  const recalibration = useRecalibration(clinicId, Boolean(active));

  const generate = () => {
    setProblem(null);
    createDraft.mutate(answers, {
      onSuccess: (draft) => {
        setDraftId(draft.id);
        setStep(2);
      },
      onError: (error) =>
        setProblem(messageOf(error, "No se ha podido generar el programa.")),
    });
  };

  const activate = () => {
    if (!shownId) return;

    setProblem(null);
    publish.mutate(shownId, {
      // Straight to the centre: nothing is left to do on this page once the programme is live.
      onSuccess: () =>
        onPublished
          ? onPublished()
          : router.push(`/admin/clinics/${encodeURIComponent(clinicId)}`),
      onError: (error) =>
        setProblem(messageOf(error, "No se ha podido activar el programa.")),
    });
  };

  const program = shown.data;
  const isDraft = program?.status === "BORRADOR";
  const blockedByReview = (program?.program.review.length ?? 0) > 0;

  return (
    <div className="grid gap-8">
      <nav aria-label="Pasos" className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, index) => {
          const reachable = index <= step;

          return (
            <button
              key={label}
              type="button"
              disabled={!reachable}
              aria-current={index === step ? "step" : undefined}
              onClick={() => setStep(index)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                index === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : reachable
                    ? "border-border bg-card hover:bg-secondary/60"
                    : "border-border bg-card text-muted-foreground opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                  index === step ? "bg-primary-foreground/20" : "bg-secondary",
                )}
              >
                {index < step ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {step === 0 ? (
        <CatalogStep
          clinicId={clinicId}
          initial={catalogRows}
          onContinue={() => setStep(1)}
        />
      ) : null}

      {step === 1 ? (
        estimates.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />{" "}
            <span>Estimando el ticket y la frecuencia…</span>
          </div>
        ) : estimates.isError || !estimates.data ? (
          <div
            role="alert"
            className="grid gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
          >
            <p>
              {messageOf(
                estimates.error,
                "No se ha podido estimar a partir del catálogo.",
              )}
            </p>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(0)}
              >
                Volver al catálogo
              </Button>
            </div>
          </div>
        ) : (
          <QuestionsStep
            estimates={estimates.data}
            answers={answers}
            onChange={setAnswers}
            onBack={() => setStep(0)}
            onGenerate={generate}
            generating={createDraft.isPending}
            error={problem}
          />
        )
      ) : null}

      {step === 2 ? (
        <div className="grid gap-6">
          {!shownId || shown.isLoading ? (
            <div className="grid gap-4" aria-busy="true">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : shown.isError || !program ? (
            <p role="alert" className="text-sm text-destructive">
              {messageOf(shown.error, "No se ha podido cargar el programa.")}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-serif text-2xl font-semibold">
                  Programa propuesto
                </h3>
                <Badge
                  variant={
                    program.status === "ACTIVO" ? "default" : "secondary"
                  }
                >
                  <span key={program.status}>
                    {program.status === "ACTIVO" ? "Activo" : "Borrador"} ·
                    versión {program.version}
                  </span>
                </Badge>
              </div>

              {isDraft && active ? (
                <p className="rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
                  Esta es una versión nueva. El programa activo sigue siendo el
                  anterior hasta que actives esta.
                </p>
              ) : null}

              {recalibration.data?.offer && !isDraft ? (
                <div
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm"
                >
                  <p className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Las visitas reales se alejan de lo que se supuso al crear
                      el programa. Puedes revisarlo con los datos de verdad.
                      Nada cambia hasta que lo actives.
                    </span>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Revisar el programa
                  </Button>
                </div>
              ) : null}

              <ProgramView
                program={program.program}
                onSwap={
                  isDraft
                    ? (milestone, alternative) =>
                        swap.mutateAsync({ milestone, alternative })
                    : undefined
                }
              />

              <CalculatorSection clinicId={clinicId} programId={program.id} />

              {problem ? (
                <p role="alert" className="text-sm text-destructive">
                  {problem}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  {isDraft
                    ? "Cambiar las respuestas"
                    : "Crear una versión nueva"}
                </Button>

                {isDraft ? (
                  <div className="flex items-center gap-3">
                    {blockedByReview ? (
                      <p className="text-xs text-muted-foreground">
                        Resuelve los avisos de arriba para activarlo.
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      onClick={activate}
                      disabled={blockedByReview || publish.isPending}
                    >
                      {publish.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      <span>Activar programa</span>
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
