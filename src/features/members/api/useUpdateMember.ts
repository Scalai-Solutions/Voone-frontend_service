import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useStaffScope } from "@/features/members/staff-scope";
import { queryKeys } from "@/lib/query-keys";
import {
  updateMember,
  type Member,
  type UpdateMemberInput,
} from "@/lib/api-client";

/**
 * Editing a member's own details. The updated summary is written straight into the member
 * query so the page reflects the change without a refetch, and the list is invalidated
 * because the table shows name and phone too.
 */
export function useUpdateMember(memberId: string) {
  const queryClient = useQueryClient();
  const { apiBase } = useStaffScope();

  return useMutation({
    mutationFn: (patch: UpdateMemberInput) =>
      updateMember(memberId, patch, apiBase),
    onSuccess: (updated: Member) => {
      queryClient.setQueryData<Member>(queryKeys.member(memberId), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.members() });
    },
  });
}
