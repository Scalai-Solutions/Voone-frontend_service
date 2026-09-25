import { useQuery } from "@tanstack/react-query";

import { getTemplate, type Template } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useTemplate(templateId: string, options?: { initialData?: Template }) {
  return useQuery({
    queryKey: queryKeys.template(templateId),
    queryFn: () => getTemplate(templateId),
    ...options,
  });
}
