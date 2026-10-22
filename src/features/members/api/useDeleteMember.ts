import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteMember } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMember,
    onSuccess: (_result, memberId) => {
      queryClient.removeQueries({ queryKey: queryKeys.member(memberId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members() });
    },
  });
}
