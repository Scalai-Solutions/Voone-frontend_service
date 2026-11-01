"use client";

import * as React from "react";

/**
 * Returns focus to the control that opened a panel when the panel closes, so a keyboard or
 * screen-reader user lands where they were instead of at the top of the page.
 *
 * `remember` takes the clicked element (event.currentTarget: Safari does not focus a button on
 * click, so document.activeElement cannot be trusted); `restore` focuses it once the panel has
 * unmounted. A trigger that has since left the page is skipped.
 */
export function useRestoreFocus() {
  const trigger = React.useRef<HTMLElement | null>(null);

  const remember = React.useCallback((element: HTMLElement | null) => {
    trigger.current = element;
  }, []);

  const restore = React.useCallback(() => {
    const element = trigger.current;

    trigger.current = null;

    if (!element) return;

    requestAnimationFrame(() => {
      if (element.isConnected) element.focus();
    });
  }, []);

  return { remember, restore };
}
