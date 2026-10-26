import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTreatment,
  deleteTreatment,
  getTreatmentCatalogue,
  getTreatmentCategories,
  updateTreatment,
  type CreateTreatmentInput,
  type UpdateTreatmentInput,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

/** The centre's treatments and whether it prices from the catalogue. */
export function useTreatmentCatalogue() {
  return useQuery({
    queryKey: queryKeys.treatmentCatalogue(),
    queryFn: getTreatmentCatalogue,
  });
}

/** Only needed (and only fetched) when the centre uses the catalogue. */
export function useTreatmentCategories(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.treatmentCategories(),
    queryFn: getTreatmentCategories,
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * After any write, refresh the list, the clinic summary and the treatments the visit screens read.
 * Also runs after a failed write: a 404 means the list is stale and should reload.
 */
function useRefreshTreatments() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.treatmentCatalogue() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currentClinic() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments() }),
      // The visit form of a programme centre reads its own catalogue.
      queryClient.invalidateQueries({ queryKey: queryKeys.staffCatalog() }),
    ]);
}

export function useCreateTreatment() {
  const refresh = useRefreshTreatments();

  return useMutation({
    mutationFn: (input: CreateTreatmentInput) => createTreatment(input),
    onSuccess: () => refresh(),
  });
}

export function useUpdateTreatment() {
  const refresh = useRefreshTreatments();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTreatmentInput }) =>
      updateTreatment(id, input),
    onSuccess: () => refresh(),
    onError: () => refresh(),
  });
}

export function useDeleteTreatment() {
  const refresh = useRefreshTreatments();

  return useMutation({
    mutationFn: (id: string) => deleteTreatment(id),
    onSuccess: () => refresh(),
    onError: () => refresh(),
  });
}
