import { useQuery } from "@tanstack/react-query";

import { useStaffScope } from "@/features/members/staff-scope";
import { getMember, type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useMember(memberId: string, options?: { initialData?: Member }) {
  const { apiBase } = useStaffScope();

  return useQuery({
    queryKey: queryKeys.member(memberId),
    queryFn: () => getMember(memberId, apiBase),
    ...options,
  });
}
