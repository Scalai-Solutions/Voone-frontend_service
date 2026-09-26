import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface PasswordSetupLinkResult {
  email: string;
  setupUrl: string;
  setupTokenExpiresAt: string;
  generatedAt?: string | null;
  sentAt?: string | null;
  hasPassword: boolean;
  emailSent: boolean;
}

async function createPasswordSetupLink(clinicId: string): Promise<PasswordSetupLinkResult> {
  const response = await fetch(`/api/admin/clinics/${encodeURIComponent(clinicId)}/credentials/share`, {
    method: "POST",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;

    throw new ApiError(
      `Password setup link request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<PasswordSetupLinkResult>;
}

type UseCreatePasswordSetupLinkOptions = Omit<
  UseMutationOptions<PasswordSetupLinkResult, Error, string>,
  "mutationFn" | "mutationKey"
>;

export function useCreatePasswordSetupLink(options?: UseCreatePasswordSetupLinkOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.createPasswordSetupLink(),
    mutationFn: createPasswordSetupLink,
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clinics() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
