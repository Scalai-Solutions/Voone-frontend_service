import { useQuery } from "@tanstack/react-query";

import { getCurrentClinic, type Clinic } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useCurrentClinic(options?: { initialData?: Clinic }) {
  return useQuery({
    queryKey: queryKeys.currentClinic(),
    queryFn: getCurrentClinic,
    ...options,
  });
}