import { useQuery } from "@tanstack/react-query";

import { getTemplatePresets, type TemplatePreset } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useTemplatePresets(options?: { initialData?: TemplatePreset[] }) {
  return useQuery({
    queryKey: queryKeys.templatePresets(),
    queryFn: getTemplatePresets,
    ...options,
  });
}
