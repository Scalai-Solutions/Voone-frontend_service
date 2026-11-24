"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

/**
 * A page's tab, kept in the URL as `?tab=…` so it can be linked to (and opened by the clinic
 * tutorial). Switching uses `history.replaceState`, which Next syncs with `useSearchParams`
 * without a server round trip or a new history entry. Unknown values fall back to the default,
 * and the default itself is left out of the URL.
 */
export function useUrlTab<T extends string>(values: readonly T[], fallback: T): [T, (tab: T) => void] {
  const raw = useSearchParams().get("tab");
  const tab = raw && (values as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setTab = React.useCallback(
    (next: T) => {
      const url = new URL(window.location.href);
      if (next === fallback) url.searchParams.delete("tab");
      else url.searchParams.set("tab", next);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [fallback],
  );

  return [tab, setTab];
}
