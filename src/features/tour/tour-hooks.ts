"use client";

import * as React from "react";

const noopSubscribe = () => () => {};

/** False on the server and during hydration, true afterwards: portals need `document.body`. */
export function useIsClient(): boolean {
  return React.useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function subscribeResize(listener: () => void) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}

const SERVER_VIEWPORT = "1280x800";

/** The window size, kept as one string snapshot so React can compare it cheaply. */
export function useViewport(): { width: number; height: number } {
  const snapshot = React.useSyncExternalStore(
    subscribeResize,
    () => `${window.innerWidth}x${window.innerHeight}`,
    () => SERVER_VIEWPORT,
  );
  const [width, height] = snapshot.split("x").map(Number);

  return { width, height };
}
