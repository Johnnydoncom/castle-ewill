"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The Tawk.to live-chat widget.
 *
 * Mounted once in the root layout, so the embed is fetched on the first page
 * that wants it and survives every client-side navigation after that —
 * `next/script` de-duplicates by `src`, so remounting never loads it twice.
 *
 * `lazyOnload` keeps it off the critical path: the chat is a convenience, and
 * a third-party bundle has no business competing with the page for LCP.
 *
 * **Not on the admin console.** Admin screens carry client records, and a
 * visitor chat bubble there is both noise and a third party watching a
 * privileged surface. On those paths the script is never requested; if it is
 * already loaded (a visit to the site first, then the console) the widget is
 * hidden rather than left floating.
 */
const TAWK_SRC = "https://embed.tawk.to/6ac26c90cf3a4534d031f55f/1k43ng5eh";

const HIDDEN_UNDER = ["/admin", "/dashboard"];

type TawkApi = {
  onLoad?: () => void;
  hideWidget?: () => void;
  showWidget?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

function isHidden(pathname: string): boolean {
  return HIDDEN_UNDER.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function TawkChat() {
  const pathname = usePathname();
  const hidden = isHidden(pathname);

  // Read by Tawk's own onLoad, which fires long after the render that set it.
  const hiddenRef = useRef(hidden);

  useEffect(() => {
    hiddenRef.current = hidden;

    /*
     * The embed expects `Tawk_API` to exist before it runs, as the vendor
     * snippet arranges. This effect is guaranteed to win that race: a
     * `lazyOnload` script is injected only after the window's load event and
     * an idle callback, never within the commit that mounts it.
     */
    const api = (window.Tawk_API ??= {});
    window.Tawk_LoadStart ??= new Date();

    const sync = () => {
      if (hiddenRef.current) api.hideWidget?.();
      else api.showWidget?.();
    };

    api.onLoad = sync;
    sync();
  }, [hidden]);

  if (hidden) return null;

  return <Script id="tawk-to" src={TAWK_SRC} strategy="lazyOnload" crossOrigin="anonymous" />;
}
