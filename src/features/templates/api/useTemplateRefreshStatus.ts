import { useQuery } from "@tanstack/react-query";

import { getTemplateRefreshStatus } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

const POLL_EVERY_MS = 10_000;

/** After a save: keep checking until a window closes, or until every member of the new change is either synced or failed. */
export interface RefreshPolling {
  /** Epoch ms when checking stops, whatever the counts say. */
  until: number;
  /** The last-change time seen before the save, to tell the new change from the old one. */
  previousChangeAt: string | null;
}

export function useTemplateRefreshStatus(options: { enabled: boolean; polling?: RefreshPolling | null }) {
  const polling = options.polling ?? null;

  return useQuery({
    queryKey: queryKeys.templateRefreshStatus(),
    queryFn: getTemplateRefreshStatus,
    enabled: options.enabled,
    refetchInterval: (query) => {
      if (!polling || Date.now() >= polling.until) return false;

      const status = query.state.data;
      const isNewChange = status?.lastChange && status.lastChange.at !== polling.previousChangeAt;

      if (status?.lastChange && isNewChange && status.syncedSince + status.failedSince >= status.lastChange.cardsAtSave) {
        return false;
      }

      return POLL_EVERY_MS;
    },
  });
}
