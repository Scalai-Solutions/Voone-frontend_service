import { useQuery } from "@tanstack/react-query";

import { getTreatments, type Treatment } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useTreatments(options?: { initialData?: Treatment[] }) {
  return useQuery({
    queryKey: queryKeys.treatments(),
    queryFn: getTreatments,
    ...options,
  });
}
