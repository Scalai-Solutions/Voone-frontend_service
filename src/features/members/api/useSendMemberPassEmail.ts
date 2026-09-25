import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import { sendMemberPassEmail, type SendMemberPassEmailResult } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type UseSendMemberPassEmailOptions = Omit<
  UseMutationOptions<SendMemberPassEmailResult, Error, string>,
  "mutationFn" | "mutationKey"
>;

export function useSendMemberPassEmail(options?: UseSendMemberPassEmailOptions) {
  return useMutation({
    mutationKey: queryKeys.mutations.sendMemberPassEmail(),
    mutationFn: sendMemberPassEmail,
    ...options,
  });
}