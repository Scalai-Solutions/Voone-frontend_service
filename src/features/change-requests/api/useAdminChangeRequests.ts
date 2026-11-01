import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  applyChangeRequest,
  createChangeRequestDraft,
  getChangeRequest,
  listChangeRequests,
  listClinicChangeRequests,
  replyToChangeRequest,
  resolveLinkedTickets,
  setChangeRequestStatus,
} from "@/lib/admin-change-requests-api";
import {
  CHANGE_REQUEST_STATUSES,
  type ChangeRequestDetail,
  type ChangeRequestPage,
  type ChangeRequestStatus,
  type InboxStatus,
  mergeNewestFirst,
  statusesFor,
  type ChangeRequestType,
  unresolvedLinkedTo,
} from "@/lib/admin-change-requests";

/** Keys local to this feature, so the shared query-keys file stays untouched. */
export const changeRequestKeys = {
  all: ["admin-change-requests"] as const,
  list: (scope: string, filters: unknown) =>
    ["admin-change-requests", "list", scope, filters] as const,
  counts: (scope: string, filters: unknown) =>
    ["admin-change-requests", "counts", scope, filters] as const,
  detail: (id: string) => ["admin-change-requests", "detail", id] as const,
  clinic: (clinicId: string) =>
    ["admin-change-requests", "clinic", clinicId] as const,
};

export interface InboxFilters {
  status: InboxStatus;
  type: ChangeRequestType | "";
  q: string;
}

/** The inbox's data: all clinics, or one clinic when `clinicId` is given. */
const fetchPage = (
  clinicId: string | undefined,
  filters: { status: ChangeRequestStatus | ""; type: ChangeRequestType | ""; q: string },
  limit: number,
  cursor: string | null,
) =>
  clinicId
    ? listClinicChangeRequests(clinicId, { ...filters, limit, cursor })
    : listChangeRequests({ ...filters, limit, cursor });

/**
 * The inbox list. "Active" is two backend calls (open, in progress) merged newest first,
 * because the backend filters by one status at a time; "Load more" asks each side that has more.
 */
export function useInboxList(clinicId: string | undefined, filters: InboxFilters) {
  const statuses = statusesFor(filters.status);
  const sides = [statuses[0] ?? "", statuses[1]] as const;

  const queryFor = (status: ChangeRequestStatus | "", enabled: boolean) => ({
    queryKey: changeRequestKeys.list(clinicId ?? "all", { ...filters, status }),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      fetchPage(clinicId, { type: filters.type, q: filters.q, status }, 20, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last: { nextCursor: string | null }) => last.nextCursor,
    enabled,
  });

  const first = useInfiniteQuery(queryFor(sides[0], true));
  const second = useInfiniteQuery(queryFor(sides[1] ?? "", sides[1] !== undefined));
  const active = sides[1] !== undefined ? [first, second] : [first];

  const rows = mergeNewestFirst(
    active.map((query) => query.data?.pages.flatMap((page) => page.items) ?? []),
  );

  return {
    rows,
    isPending: active.some((query) => query.isPending),
    isError: active.some((query) => query.isError),
    error: active.find((query) => query.isError)?.error ?? null,
    loaded: active.every((query) => query.data !== undefined),
    hasNextPage: active.some((query) => query.hasNextPage),
    isFetchingNextPage: active.some((query) => query.isFetchingNextPage),
    isFetchNextPageError: active.some((query) => query.isFetchNextPageError),
    fetchNextPage: () =>
      Promise.all(
        active
          .filter((query) => query.hasNextPage && !query.isFetchingNextPage)
          .map((query) => query.fetchNextPage()),
      ),
  };
}

/**
 * The count on each status chip: one first page of 50 per status (shown as "50+" when there
 * is more). Independent of the type and text filters, so it is fetched once per mount (and per
 * clinic scope) and again after a ticket changes, not on every keystroke.
 */
export function useStatusCounts(clinicId: string | undefined) {
  const queries = useQueries({
    queries: CHANGE_REQUEST_STATUSES.map((status) => ({
      queryKey: changeRequestKeys.counts(clinicId ?? "all", status),
      queryFn: () => fetchPage(clinicId, { status, type: "", q: "" }, 50, null),
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    })),
  });

  return Object.fromEntries(
    CHANGE_REQUEST_STATUSES.map((status, index) => [status, queries[index].data]),
  ) as Partial<Record<ChangeRequestStatus, ChangeRequestPage | undefined>>;
}

export const useChangeRequest = (id: string) =>
  useQuery({
    queryKey: changeRequestKeys.detail(id),
    queryFn: () => getChangeRequest(id),
  });

/** Everything about a ticket may have changed (lists, counts, the detail), so drop it all. */
function useRefreshTickets() {
  const queryClient = useQueryClient();

  return (detail?: ChangeRequestDetail) => {
    if (detail) queryClient.setQueryData(changeRequestKeys.detail(detail.id), detail);

    return queryClient.invalidateQueries({ queryKey: changeRequestKeys.all });
  };
}

export function useSetStatus(id: string) {
  const refresh = useRefreshTickets();

  return useMutation({
    mutationFn: (input: { status: ChangeRequestStatus; resolutionNote?: string }) =>
      setChangeRequestStatus(id, input),
    onSuccess: (detail) => refresh(detail),
    onError: () => refresh(),
  });
}

export function useReply(id: string) {
  const refresh = useRefreshTickets();

  return useMutation({
    mutationFn: (body: string) => replyToChangeRequest(id, body),
    onSuccess: (detail) => refresh(detail),
  });
}

export function useApply(id: string) {
  const refresh = useRefreshTickets();

  return useMutation({
    mutationFn: (input: { note?: string; categoryId?: string }) =>
      applyChangeRequest(id, input),
    onSuccess: (result) => refresh(result.request),
    // A 409 means the ticket changed under us (already applied, target gone): reload it.
    onError: () => refresh(),
  });
}

export function useCreateDraft(id: string) {
  const refresh = useRefreshTickets();

  return useMutation({
    mutationFn: () => createChangeRequestDraft(id),
    onSuccess: (result) => refresh(result.request),
    onError: () => refresh(),
  });
}

export function useResolveLinked(clinicId: string, programId: string) {
  const refresh = useRefreshTickets();

  return useMutation({
    mutationFn: (note: string) => resolveLinkedTickets(clinicId, programId, note),
    onSuccess: () => refresh(),
  });
}

/**
 * The clinic's unresolved tickets linked to a programme (for the prompt after a publish).
 * Fetched by status because linking moves a ticket to IN_PROGRESS but it may still be OPEN;
 * a clinic has at most 20 unresolved tickets, so one page of each is all there is.
 */
export function useLinkedTickets(clinicId: string, programId: string) {
  return useQuery({
    queryKey: [...changeRequestKeys.clinic(clinicId), "linked", programId] as const,
    queryFn: async () => {
      const [open, inProgress] = await Promise.all([
        listClinicChangeRequests(clinicId, { status: "OPEN", limit: 50 }),
        listClinicChangeRequests(clinicId, { status: "IN_PROGRESS", limit: 50 }),
      ]);

      return unresolvedLinkedTo([...open.items, ...inProgress.items], programId);
    },
    // The prompt is optional: a failure must not hold up the publish, so no retry delay.
    retry: false,
    staleTime: 0,
  });
}
