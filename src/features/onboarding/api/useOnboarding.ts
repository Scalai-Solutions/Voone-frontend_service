import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createDraft,
  getCatalog,
  getEstimates,
  getProgram,
  getRecalibration,
  importCatalogCsv,
  listPrograms,
  previewProgram,
  publishProgram,
  replaceCatalog,
  swapMilestone,
  type CatalogInputRow,
  type OnboardingAnswers,
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
      // The estimates are derived from the catalogue, so they are stale the moment it moves.
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.estimates(clinicId) });
    },
  });
}

export function useImportCatalog(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (csv: string) => importCatalogCsv(clinicId, csv),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.onboarding.catalog(clinicId), result.items);
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.estimates(clinicId) });
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
export function usePreview(clinicId: string, answers: OnboardingAnswers | null) {
  return useQuery({
    queryKey: queryKeys.onboarding.preview(clinicId, answers),
    queryFn: () => previewProgram(clinicId, answers as OnboardingAnswers),
    enabled: answers !== null,
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
      queryClient.setQueryData(queryKeys.onboarding.program(clinicId, draft.id), draft);
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.programs(clinicId) });
    },
  });
}

export function usePublishProgram(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (programId: string) => publishProgram(clinicId, programId),
    onSuccess: (live) => {
      queryClient.setQueryData(queryKeys.onboarding.program(clinicId, live.id), live);
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.programs(clinicId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.recalibration(clinicId) });
    },
  });
}

export function useSwapMilestone(clinicId: string, programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestone, alternative }: { milestone: number; alternative: number }) =>
      swapMilestone(clinicId, programId, milestone, alternative),
    onSuccess: (draft) => {
      queryClient.setQueryData(queryKeys.onboarding.program(clinicId, draft.id), draft);
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
