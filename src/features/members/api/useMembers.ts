import { useQuery } from "@tanstack/react-query";

import { getMembers, type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useMembers(options?: { initialData?: Member[] }) {
  return useQuery({
    queryKey: queryKeys.members(),
    queryFn: getMembers,
    ...options,
  });
}
