import { useQuery } from "@tanstack/react-query";

import { getAdminMembers, type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useAdminMembers(options?: { initialData?: Member[] }) {
  return useQuery({
    queryKey: queryKeys.adminMembers(),
    queryFn: getAdminMembers,
    ...options,
  });
}
