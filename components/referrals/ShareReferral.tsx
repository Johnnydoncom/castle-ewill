"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * The code and the link, each one tap from the clipboard, and the phone's own
 * share sheet where there is one — most invitations here go out on WhatsApp.
 */
export function ShareReferral({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  // False on the server, which has no `navigator` to ask, and while hydrating.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );

  async function copy(what: "code" | "link") {
    try {
      await navigator.clipboard.writeText(what === "code" ? code : link);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Both are on screen to read out; copying is a convenience.
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: "Castle eWill & Trust",
        text: `Write your Will online with Castle eWill & Trust. Use my referral code ${code} when you sign up.`,
        url: link,
      });
    } catch {
      // Dismissed, or not permitted — nothing to report.
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Your code
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-mono text-2xl tracking-[0.2em] text-navy">{code}</span>
          <button
            type="button"
            onClick={() => copy("code")}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-navy underline underline-offset-4 hover:text-gold"
          >
            {copied === "code" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === "code" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Your link
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="min-w-0 max-w-full truncate border border-border bg-surface px-3 py-2 font-mono text-xs text-navy">
            {link}
          </span>
          <button
            type="button"
            onClick={() => copy("link")}
            className="inline-flex items-center gap-1.5 bg-navy px-4 py-2 text-xs uppercase tracking-[0.15em] text-white hover:bg-navy/90"
          >
            {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 border border-navy px-4 py-2 text-xs uppercase tracking-[0.15em] text-navy hover:border-gold hover:text-gold"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
