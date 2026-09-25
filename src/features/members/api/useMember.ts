import { useQuery } from "@tanstack/react-query";

import { getMember, type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useMember(memberId: string, options?: { initialData?: Member }) {
  return useQuery({
    queryKey: queryKeys.member(memberId),
    queryFn: () => getMember(memberId),
    ...options,
  });
}
