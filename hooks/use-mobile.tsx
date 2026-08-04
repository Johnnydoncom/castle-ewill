"use client";

import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Read through `useSyncExternalStore` rather than a state-plus-effect pair.
 * Seeding state from inside an effect costs a cascading second render on every
 * mount, and here the server snapshot is explicit — the viewport is treated as
 * desktop during SSR instead of passing through `undefined` on first paint.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
