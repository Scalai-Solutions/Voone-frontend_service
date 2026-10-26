import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

import { saveAdminTemplate, saveTemplate, type SaveTemplateInput, type Template } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type UseSaveTemplateOptions = Omit<
  UseMutationOptions<Template, Error, SaveTemplateInput>,
  "mutationFn" | "mutationKey"
>;

export function useSaveTemplate(
  templateId: string | undefined,
  clinicId: string,
  scope: "clinic" | "admin" = "clinic",
  options?: UseSaveTemplateOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.saveTemplate(),
    mutationFn: (input) =>
      scope === "admin"
        ? saveAdminTemplate(input, templateId, clinicId)
        : saveTemplate(input, templateId, clinicId),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clinicTemplate(clinicId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentClinic() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.treatments() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templateRefreshStatus() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
