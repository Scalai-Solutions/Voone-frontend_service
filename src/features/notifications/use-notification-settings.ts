"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationSettingsPatch } from "@/lib/api-client";

import type { NotificationSettingsApi } from "./settings-api";

/** One cache entry per centre and surface; a save writes the server's answer straight back. */
export function useNotificationSettings(
  api: NotificationSettingsApi,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const key = ["notification-settings", api.scope];
  const settings = useQuery({
    queryKey: key,
    queryFn: api.getSettings,
    enabled,
  });
  const catalog = useQuery({
    queryKey: ["automation-catalog", api.scope.split(":")[0]],
    queryFn: api.getCatalog,
    staleTime: Number.POSITIVE_INFINITY,
    enabled,
  });
  const patch = useMutation({
    mutationFn: (input: NotificationSettingsPatch) => api.patchSettings(input),
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  });

  return { settings, catalog, patch };
}
