import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api-client";
import type { BonoPlansStore } from "@/components/shared/bono-plans-editor";
import {
  cancelMemberBono,
  createBonoPlan,
  deleteBonoPlan,
  getBonoPlans,
  getMemberBonos,
  updateBonoPlan,
  type CreateBonoPlanInput,
  type UpdateBonoPlanInput,
} from "@/lib/bono-api";

/**
 * The bono screens' data, as hooks. Plans change when the owner edits them, not minute to
 * minute; a member's bonos change as sessions are recorded, so the visit panel refetches
 * after each visit.
 */

export function useBonoPlans() {
  return useQuery({
    queryKey: queryKeys.bonoPlans(),
    queryFn: getBonoPlans,
    staleTime: 60_000,
  });
}

export function useMemberBonos(memberId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.memberBonos(memberId),
    queryFn: () => getMemberBonos(memberId),
    enabled,
  });
}

export function useCreateBonoPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBonoPlanInput) => createBonoPlan(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bonoPlans() });
    },
  });
}

export function useUpdateBonoPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBonoPlanInput }) =>
      updateBonoPlan(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bonoPlans() });
    },
  });
}

export function useDeleteBonoPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBonoPlan(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bonoPlans() });
    },
  });
}

export function useCancelMemberBono(memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bonoId: string) => cancelMemberBono(memberId, bonoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.memberBonos(memberId) });
    },
  });
}

/**
 * The shared editor's store over the centre's own routes: what the dashboard's treatments
 * editor passes to BonoPlansEditor. The backend's Spanish validation copy is the error the
 * editor shows; anything else gets the generic line.
 */
export function useStaffBonoPlansStore(): BonoPlansStore {
  const plans = useBonoPlans();
  const create = useCreateBonoPlan();
  const update = useUpdateBonoPlan();
  const remove = useDeleteBonoPlan();
  const failure = create.error ?? update.error ?? remove.error;

  return {
    plans: plans.data ?? [],
    pending: create.isPending || update.isPending || remove.isPending,
    error:
      failure instanceof ApiError && failure.detail
        ? failure.detail
        : failure
          ? "No se pudo guardar el bono. Inténtalo de nuevo."
          : null,
    create: (input) => create.mutate(input),
    update: (id, patch) => update.mutate({ id, patch }),
    remove: (id) => remove.mutate(id),
  };
}
