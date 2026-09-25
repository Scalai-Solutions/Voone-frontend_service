import { useQuery } from "@tanstack/react-query";

import { getVooneTemplates, type VooneTemplate } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useTemplates(options?: { initialData?: VooneTemplate[] }) {
  return useQuery({
    queryKey: queryKeys.vooneTemplates(),
    queryFn: getVooneTemplates,
    ...options,
  });
}
