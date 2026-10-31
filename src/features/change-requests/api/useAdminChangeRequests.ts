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
  type ChangeRequestStatus,
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
  status: ChangeRequestStatus | "";
  type: ChangeRequestType | "";
  q: string;
}

/** The inbox's data: all clinics, or one clinic when `clinicId` is given. */
const fetchPage = (
  clinicId: string | undefined,
  filters: InboxFilters,
  limit: number,
  cursor: string | null,
) =>
  clinicId
    ? listClinicChangeRequests(clinicId, { ...filters, limit, cursor })
    : listChangeRequests({ ...filters, limit, cursor });

export function useInboxList(clinicId: string | undefined, filters: InboxFilters) {
  return useInfiniteQuery({
    queryKey: changeRequestKeys.list(clinicId ?? "all", filters),
    queryFn: ({ pageParam }) => fetchPage(clinicId, filters, 20, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/**
 * The count on each status chip. The list answers pages, not totals, so each count is the
 * size of a first page of 50 (shown as "50+" when there is more), with the type and text
 * filters applied but not the status one.
 */
export function useStatusCounts(
  clinicId: string | undefined,
  filters: Pick<InboxFilters, "type" | "q">,
) {
  return useQueries({
    queries: CHANGE_REQUEST_STATUSES.map((status) => ({
      queryKey: changeRequestKeys.counts(clinicId ?? "all", { ...filters, status }),
      queryFn: () => fetchPage(clinicId, { ...filters, status }, 50, null),
    })),
  });
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
    mutationFn: (note?: string) => applyChangeRequest(id, note),
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
