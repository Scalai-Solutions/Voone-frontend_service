import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

import { provisionClinic, type ProvisionClinicInput, type ProvisionedClinic } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type UseProvisionClinicOptions = Omit<
  UseMutationOptions<ProvisionedClinic, Error, ProvisionClinicInput>,
  "mutationFn" | "mutationKey"
>;

export function useProvisionClinic(options?: UseProvisionClinicOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.provisionClinic(),
    mutationFn: provisionClinic,
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clinics() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
