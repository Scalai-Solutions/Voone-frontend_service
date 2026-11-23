import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { scopedKey, useStaffScope } from "@/features/members/staff-scope";
import {
  getMembers,
  getMembersPage,
  getMemberTiers,
  type Member,
  type MemberListParams,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

/** Members per page on the members screen. */
export const MEMBERS_PAGE_SIZE = 10;

/** The backend's largest page, used when every matching member is needed (CSV export). */
const EXPORT_BATCH = 200;

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

/**
 * One numbered page of the members screen (1-based), with the total matching the same search
 * and tier, so the screen can say how many pages there are.
 */
export function usePagedMembers(filters: { search: string; tier?: string; page: number }) {
  const query = filters.search.trim();
  const tier = filters.tier || undefined;
  const scope = useStaffScope();

  return useQuery({
    queryKey: scopedKey([...queryKeys.members(), "page", query, tier ?? "", filters.page], scope),
    queryFn: () =>
      getMembersPage(
        {
          q: query || undefined,
          tier,
          limit: MEMBERS_PAGE_SIZE,
          offset: (filters.page - 1) * MEMBERS_PAGE_SIZE,
        },
        scope.apiBase,
      ),
    // The previous page stays on screen while the next one loads, so the table does not flash.
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/** The clinic's tiers with a member count each; their sum is the clinic's member total. */
export function useMemberTiers() {
  const scope = useStaffScope();

  return useQuery({
    queryKey: scopedKey([...queryKeys.members(), "tiers"], scope),
    queryFn: () => getMemberTiers(scope.apiBase),
    staleTime: 0,
  });
}

/** Every member matching the search and tier, page by page, for an export. */
export async function fetchAllMembers(
  filters: Pick<MemberListParams, "q" | "tier">,
  apiBase?: string,
): Promise<Member[]> {
  const all: Member[] = [];

  for (let offset = 0; ; offset += EXPORT_BATCH) {
    const page = await getMembers({ ...filters, limit: EXPORT_BATCH, offset }, apiBase);

    all.push(...page);

    if (page.length < EXPORT_BATCH) return all;
  }
}
