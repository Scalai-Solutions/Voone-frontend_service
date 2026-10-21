import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { TierKey } from "@/lib/onboarding-api";
import {
  createDraft,
  getCalculator,
  getCatalog,
  getEstimates,
  getProgram,
  getRecalibration,
  importCatalogCsv,
  listPrograms,
  previewProgram,
  publishProgram,
  replaceCatalog,
  setTierBenefits,
  swapMilestone,
  type CalcInput,
  type CatalogInputRow,
  type OnboardingAnswers,
  type SwapChoice,
} from "@/lib/onboarding-api";

/**
 * The onboarding screens' data, as hooks.
 *
 * Reads are cached by clinic; every write invalidates exactly what it can have changed, so a
 * screen never shows a catalogue that no longer matches the estimates beside it.
 */

export function useCatalog(clinicId: string) {
  return useQuery({
    queryKey: queryKeys.onboarding.catalog(clinicId),
    queryFn: () => getCatalog(clinicId),
    // The editor owns the rows while it is open; a background refetch must not overwrite
    // what someone is typing.
    staleTime: Infinity,
  });
}

export function useReplaceCatalog(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: CatalogInputRow[]) => replaceCatalog(clinicId, items),
    onSuccess: (items) => {
      // The cache is what the editor starts from when it is opened again. Left at the rows
      // first loaded, going back a step would show the catalogue as it was before every edit.
      queryClient.setQueryData(queryKeys.onboarding.catalog(clinicId), items);
      // The estimates and clinic treatment list are derived from the catalogue.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.estimates(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.currentClinic(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.treatments() });
    },
  });
}

export function useImportCatalog(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (csv: string) => importCatalogCsv(clinicId, csv),
    onSuccess: (result) => {
      queryClient.setQueryData(
        queryKeys.onboarding.catalog(clinicId),
        result.items,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.estimates(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.currentClinic(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.treatments() });
    },
  });
}

export function useEstimates(clinicId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.onboarding.estimates(clinicId),
    queryFn: () => getEstimates(clinicId),
    enabled,
    retry: false,
  });
}

/**
 * The live preview. Stores nothing, so it can be asked as often as the answers change.
 * The previous result stays on screen while the next loads, which is what stops the preview
 * flashing empty on every click.
 */
export function usePreview(
  clinicId: string,
  answers: OnboardingAnswers | null,
) {
  return useQuery({
    queryKey: queryKeys.onboarding.preview(clinicId, answers),
    queryFn: () => previewProgram(clinicId, answers as OnboardingAnswers),
    enabled: answers !== null,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });
}

/**
 * Five years of what a programme costs and brings in, for the inputs typed.
 *
 * `input` is null until the person has typed something valid, so nothing is asked for a half-typed
 * figure. The previous answer stays on screen while the next one loads, so the chart does not
 * blank on every keystroke. Read-only: it never changes the programme it is computed from.
 */
export function useCalculator(
  clinicId: string,
  programId: string,
  input: Partial<CalcInput> | null,
) {
  return useQuery({
    queryKey: queryKeys.onboarding.calculator(clinicId, programId, input),
    queryFn: () =>
      getCalculator(clinicId, programId, input as Partial<CalcInput>),
    enabled: input !== null,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });
}

export function usePrograms(clinicId: string) {
  return useQuery({
    queryKey: queryKeys.onboarding.programs(clinicId),
    queryFn: () => listPrograms(clinicId),
  });
}

export function useProgram(clinicId: string, programId: string | null) {
  return useQuery({
    queryKey: queryKeys.onboarding.program(clinicId, programId ?? ""),
    queryFn: () => getProgram(clinicId, programId as string),
    enabled: programId !== null,
  });
}

export function useCreateDraft(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: OnboardingAnswers) => createDraft(clinicId, answers),
    onSuccess: (draft) => {
      queryClient.setQueryData(
        queryKeys.onboarding.program(clinicId, draft.id),
        draft,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.programs(clinicId),
      });
    },
  });
}

export function usePublishProgram(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (programId: string) => publishProgram(clinicId, programId),
    onSuccess: (live) => {
      queryClient.setQueryData(
        queryKeys.onboarding.program(clinicId, live.id),
        live,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.programs(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.recalibration(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.currentClinic(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.staffProgram(),
      });
    },
  });
}

export function useSwapMilestone(clinicId: string, programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestone,
      choice,
    }: {
      milestone: number;
      choice: SwapChoice;
    }) => swapMilestone(clinicId, programId, milestone, choice),
    onSuccess: (draft) => {
      queryClient.setQueryData(
        queryKeys.onboarding.program(clinicId, draft.id),
        draft,
      );
    },
  });
}

export function useSetTierBenefits(clinicId: string, programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tier, benefits }: { tier: TierKey; benefits: string[] }) =>
      setTierBenefits(clinicId, programId, tier, benefits),
    onSuccess: (draft) => {
      queryClient.setQueryData(
        queryKeys.onboarding.program(clinicId, draft.id),
        draft,
      );
    },
  });
}

export function useRecalibration(clinicId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.onboarding.recalibration(clinicId),
    queryFn: () => getRecalibration(clinicId),
    enabled,
    retry: false,
  });
}
