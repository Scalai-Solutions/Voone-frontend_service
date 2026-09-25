import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

import { addMemberAsStaff } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type AddMemberInput = Parameters<typeof addMemberAsStaff>[0];
type AddMemberResult = Awaited<ReturnType<typeof addMemberAsStaff>>;

type UseAddMemberOptions = Omit<
  UseMutationOptions<AddMemberResult, Error, AddMemberInput>,
  "mutationFn" | "mutationKey"
>;

export function useAddMember(options?: UseAddMemberOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.addMember(),
    mutationFn: addMemberAsStaff,
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminMembers() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
