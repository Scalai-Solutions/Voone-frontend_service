import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createChangeRequest,
  getChangeRequest,
  listChangeRequests,
  reopenChangeRequest,
  replyToChangeRequest,
} from "@/lib/staff-change-requests-api";
import type {
  ChangeRequestStatus,
  CreateChangeRequestBody,
} from "@/lib/staff-change-requests";
import { queryKeys } from "@/lib/query-keys";

/** The request list, newest first, a page at a time; `status` null is every status. */
export function useChangeRequestList(status: ChangeRequestStatus | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.changeRequests.list(status),
    queryFn: ({ pageParam }) =>
      listChangeRequests({
        ...(status ? { status } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useChangeRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.changeRequests.detail(id),
    queryFn: () => getChangeRequest(id),
  });
}

/**
 * How many requests are being worked on (open or in progress), for the badge in My Center.
 * The backend allows at most 20 of each at once, so one page of 20 per status is the exact
 * count, with no total endpoint needed.
 */
export function useOpenRequestCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.changeRequests.openCount(),
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const [open, working] = await Promise.all([
        listChangeRequests({ status: "OPEN", limit: 20 }),
        listChangeRequests({ status: "IN_PROGRESS", limit: 20 }),
      ]);

      return open.items.length + working.items.length;
    },
  });
}

function useRefreshRequests() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.changeRequests.all() });
}

export function useCreateChangeRequest() {
  const refresh = useRefreshRequests();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateChangeRequestBody) => createChangeRequest(body),
    onSuccess: (ticket) => {
      // A treatment or bono change is already applied: the lists the centre looks at must show it.
      if (ticket.autoApproved) {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.treatmentCatalogue() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.currentClinic() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.treatments() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.staffCatalog() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.bonoPlans() }),
        ]);
      }

      return refresh();
    },
  });
}

export function useReplyToChangeRequest(id: string) {
  const refresh = useRefreshRequests();

  return useMutation({
    mutationFn: (body: string) => replyToChangeRequest(id, body),
    // Also after a failure: a 409 means the request changed under us and should reload.
    onSettled: () => refresh(),
  });
}

export function useReopenChangeRequest(id: string) {
  const refresh = useRefreshRequests();

  return useMutation({
    mutationFn: (message?: string) => reopenChangeRequest(id, message),
    onSettled: () => refresh(),
  });
}
