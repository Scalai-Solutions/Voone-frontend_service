import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  saveAdminVooneTemplate,
  type SaveVooneTemplateInput,
  type VooneTemplate,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type UseSaveAdminTemplateOptions = Omit<
  UseMutationOptions<VooneTemplate, Error, SaveVooneTemplateInput>,
  "mutationFn" | "mutationKey"
>;

export function useSaveAdminTemplate(
  templateId: string | undefined,
  options?: UseSaveAdminTemplateOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.saveAdminVooneTemplate(),
    mutationFn: (input) => saveAdminVooneTemplate(input, templateId),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.vooneTemplates(),
      });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
