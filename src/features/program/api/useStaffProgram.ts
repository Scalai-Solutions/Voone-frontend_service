import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  getMemberRewards,
  getStaffCatalog,
  getStaffProgram,
  recordVisit,
  redeemReward,
  type VisitInput,
} from "@/lib/staff-program-api";

/** The centre's live programme; null means it is still on the older points scheme. */
export function useStaffProgram() {
  return useQuery({
    queryKey: queryKeys.staffProgram(),
    queryFn: getStaffProgram,
    // A programme changes when someone activates a new one, not minute to minute.
    staleTime: 60_000,
  });
}

export function useStaffCatalog() {
  return useQuery({
    queryKey: queryKeys.staffCatalog(),
    queryFn: getStaffCatalog,
    staleTime: 60_000,
  });
}

export function useMemberRewards(memberId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.memberRewards(memberId),
    queryFn: () => getMemberRewards(memberId),
    enabled,
  });
}

export function useRecordVisit(memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VisitInput) => recordVisit(memberId, input),
    onSuccess: () => {
      // A visit changes progress, tier, history and possibly issues rewards.
      void queryClient.invalidateQueries({ queryKey: queryKeys.member(memberId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.memberRewards(memberId) });
    },
  });
}

export function useRedeemReward(memberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rewardId,
      visitId,
      surpriseItem,
    }: {
      rewardId: string;
      visitId: string;
      surpriseItem?: string;
    }) => redeemReward(memberId, rewardId, { visitId, surpriseItem }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.memberRewards(memberId) });
    },
  });
}
