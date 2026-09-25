import { useQuery } from "@tanstack/react-query";

import { getCurrentClinicTemplate, type Template } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useClinicTemplate(clinicId: string, options?: { initialData?: Template | null }) {
  return useQuery({
    queryKey: queryKeys.clinicTemplate(clinicId),
    queryFn: () => getCurrentClinicTemplate(clinicId),
    ...options,
  });
}
