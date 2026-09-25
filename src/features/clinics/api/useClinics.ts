import { useQuery } from "@tanstack/react-query";

import { getClinics, type Clinic } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useClinics(options?: { initialData?: Clinic[] }) {
  return useQuery({
    queryKey: queryKeys.clinics(),
    queryFn: getClinics,
    ...options,
  });
}
