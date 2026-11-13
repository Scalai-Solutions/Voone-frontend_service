import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useStaffScope } from "@/features/members/staff-scope";
import { deleteMember } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useDeleteMember() {
  const queryClient = useQueryClient();
  const { apiBase } = useStaffScope();

  return useMutation({
    mutationFn: (memberId: string) => deleteMember(memberId, apiBase),
    onSuccess: (_result, memberId) => {
      queryClient.removeQueries({ queryKey: queryKeys.member(memberId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members() });
    },
  });
}
