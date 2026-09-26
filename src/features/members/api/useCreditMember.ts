import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

import { creditMember, type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type CreditMemberInput = {
  memberId: string;
  points: number;
  label: string;
  referralCode?: string;
  /**
   * Stable across retries of the same credit. Required rather than optional so a call
   * site cannot omit it and silently lose the double-credit guard.
   */
  idempotencyKey: string;
};

type UseCreditMemberOptions = Omit<
  UseMutationOptions<Member, Error, CreditMemberInput>,
  "mutationFn" | "mutationKey"
>;

export function useCreditMember(options?: UseCreditMemberOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.creditMember(),
    mutationFn: ({ memberId, points, label, referralCode, idempotencyKey }) =>
      creditMember(memberId, points, label, { idempotencyKey, referralCode }),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.member(variables.memberId) });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
