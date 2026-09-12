"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api/browser";

/**
 * Who is looking, asked from the browser.
 *
 * The public pages are cached (ISR), so the header cannot be rendered per
 * session on the server: one client's signed-in header would be served as
 * static HTML to everybody. Instead the markup ships signed-out — which is
 * what the cache holds — and this corrects it after hydration.
 *
 * `GET /me` answers 401 for a visitor with no session, which `api()` returns
 * as an ordinary unsuccessful result: nothing is logged and nothing redirects.
 */
export type Viewer = { name: string | null; role: "user" | "admin" };

/**
 * One request per document load, shared by every caller.
 *
 * The header lives in a layout, so it survives client-side navigation and asks
 * once. Signing in and out are hard loads (the Router Cache would otherwise
 * replay a stale page), which is what clears this.
 */
let asked: Promise<Viewer | null> | null = null;

function viewer(): Promise<Viewer | null> {
  asked ??= api<{ data: Viewer }>("/me")
    .then((result) => (result.ok ? { name: result.data.data.name, role: result.data.data.role } : null))
    .catch(() => null);

  return asked;
}

/** The signed-in account, or null while unknown and for a visitor. */
export function useViewer(): { viewer: Viewer | null } {
  const [current, setCurrent] = useState<Viewer | null>(null);

  useEffect(() => {
    let live = true;

    void viewer().then((answer) => {
      if (live) setCurrent(answer);
    });

    return () => {
      live = false;
    };
  }, []);

  return { viewer: current };
}
