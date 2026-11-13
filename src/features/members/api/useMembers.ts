import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { scopedKey, useStaffScope } from "@/features/members/staff-scope";
import { getMembers, type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

const PAGE_SIZE = 10;

export function useMembers(options?: { initialData?: Member[] }) {
  return useQuery({
    queryKey: queryKeys.members(),
    queryFn: () => getMembers({ limit: 200, offset: 0 }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    ...options,
  });
}

export function useInfiniteMembers(search: string) {
  const query = search.trim();
  const scope = useStaffScope();

  return useInfiniteQuery({
    queryKey: scopedKey([...queryKeys.members(), "infinite", query], scope),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getMembers({ q: query || undefined, limit: PAGE_SIZE, offset: pageParam }, scope.apiBase),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + PAGE_SIZE : undefined,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
