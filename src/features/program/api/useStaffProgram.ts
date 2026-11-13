import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { scopedKey, useStaffScope } from "@/features/members/staff-scope";
import { queryKeys } from "@/lib/query-keys";
import {
  getMemberRewardsOverview,
  getStaffCatalog,
  getStaffProgram,
  recordVisit,
  redeemReward,
  type VisitInput,
} from "@/lib/staff-program-api";

/** The centre's live programme; null means it is still on the older points scheme. */
export function useStaffProgram() {
  const scope = useStaffScope();

  return useQuery({
    queryKey: scopedKey(queryKeys.staffProgram(), scope),
    queryFn: () => getStaffProgram(scope.apiBase),
    // A programme changes when someone activates a new one, not minute to minute.
    staleTime: 60_000,
  });
}

export function useStaffCatalog(enabled = true) {
  const scope = useStaffScope();

  return useQuery({
    queryKey: scopedKey(queryKeys.staffCatalog(), scope),
    queryFn: () => getStaffCatalog(scope.apiBase),
    enabled,
    staleTime: 60_000,
  });
}

/** A member's rewards and whether their next payment earns double points. */
export function useMemberRewards(memberId: string, enabled: boolean) {
  const { apiBase } = useStaffScope();

  return useQuery({
    queryKey: queryKeys.memberRewards(memberId),
    queryFn: () => getMemberRewardsOverview(memberId, apiBase),
    enabled,
  });
}

export function useRecordVisit(memberId: string) {
  const queryClient = useQueryClient();
  const { apiBase } = useStaffScope();

  return useMutation({
    mutationFn: (input: VisitInput) => recordVisit(memberId, input, apiBase),
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
  const { apiBase } = useStaffScope();

  return useMutation({
    mutationFn: ({
      rewardId,
      visitId,
      surpriseItem,
    }: {
      rewardId: string;
      visitId?: string;
      surpriseItem?: string;
    }) => redeemReward(memberId, rewardId, { visitId, surpriseItem }, apiBase),
    onSuccess: () => {
      // The redemption appears in the member's history.
      void queryClient.invalidateQueries({ queryKey: queryKeys.member(memberId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.memberRewards(memberId) });
    },
  });
}
