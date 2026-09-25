import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

import { saveTemplate, type SaveTemplateInput, type Template } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type UseSaveTemplateOptions = Omit<
  UseMutationOptions<Template, Error, SaveTemplateInput>,
  "mutationFn" | "mutationKey"
>;

export function useSaveTemplate(
  templateId: string | undefined,
  clinicId: string,
  options?: UseSaveTemplateOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.saveTemplate(),
    mutationFn: (input) => saveTemplate(input, templateId, clinicId),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clinicTemplate(clinicId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
