"use client";

import * as React from "react";

import type { OwnerFlag } from "@/lib/change-flag";
import type { FlagRequest } from "@/lib/change-request-form";
import { previewChangeFlag } from "@/lib/staff-change-requests-api";

/** How long the input has to rest before the what-if is asked for. */
export const FLAG_DEBOUNCE_MS = 300;

const NONE: OwnerFlag = { status: "none" };

/**
 * The what-if flag for the request being typed, or `none` while there is nothing to ask, while
 * the answer is on its way, and whenever it failed. Asked 300 ms after the input stops changing;
 * a change aborts the call in flight, and an answer is only used for the very request it was
 * asked for, so a stale answer for an earlier pick is never shown.
 */
export function useChangeFlag(request: FlagRequest | null): OwnerFlag {
  const key = request ? JSON.stringify(request) : null;
  const [answer, setAnswer] = React.useState<{ key: string; flag: OwnerFlag } | null>(null);

  React.useEffect(() => {
    if (key === null) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void previewChangeFlag(JSON.parse(key) as FlagRequest, controller.signal).then((flag) => {
        if (!controller.signal.aborted) setAnswer({ key, flag });
      });
    }, FLAG_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return key !== null && answer?.key === key ? answer.flag : NONE;
}
