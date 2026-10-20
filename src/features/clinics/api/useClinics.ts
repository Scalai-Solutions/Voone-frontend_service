import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getClinics, type Clinic, type VoonePlan } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

const PAGE_SIZE = 10;

export function useClinics(options?: { initialData?: Clinic[] }) {
  return useQuery({
    queryKey: queryKeys.clinics(),
    queryFn: () => getClinics({ limit: 200, offset: 0 }),
    ...options,
  });
}

export function useInfiniteClinics(search: string, filters: { status?: "active" | "setup"; plan?: VoonePlan } = {}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.clinics(), "infinite", search.trim(), filters.status ?? "all", filters.plan ?? "all"] as const,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getClinics({ q: search.trim() || undefined, status: filters.status, plan: filters.plan, limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + PAGE_SIZE : undefined,
    staleTime: 0,
  });
}
