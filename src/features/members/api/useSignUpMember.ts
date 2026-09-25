import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import { signUpMember, type MembershipSignupInput } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type SignUpMemberResult = Awaited<ReturnType<typeof signUpMember>>;

type UseSignUpMemberOptions = Omit<
  UseMutationOptions<SignUpMemberResult, Error, MembershipSignupInput>,
  "mutationFn" | "mutationKey"
>;

export function useSignUpMember(slug: string, options?: UseSignUpMemberOptions) {
  return useMutation({
    mutationKey: queryKeys.mutations.signUpMember(),
    mutationFn: (input) => signUpMember(slug, input),
    ...options,
  });
}
