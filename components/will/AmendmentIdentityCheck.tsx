"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { SmileIdCapture } from "@/components/verification/SmileIdCapture";
import { getVerificationStatusAction } from "@/lib/actions/verification.client";

/**
 * The camera check for an amendment, taken without leaving the page.
 *
 * It used to be a card linking to `/dashboard/kyc`. A client part-way through
 * confirming an amended Will was sent to a different screen, did the check
 * there, and was left on the KYC page with no indication that the thing they
 * had actually been doing was still waiting for them. Most of the way through
 * a task is the worst possible moment to be moved somewhere else.
 *
 * ## Why it cannot just submit when the capture ends
 *
 * `SmileIdCapture`'s `onVerified` fires when Smile ID *accepts* the job — a
 * `202` — not when it decides. The verdict arrives on our webhook seconds
 * later. Submitting at `onVerified` would post the amendment while the gate
 * still had no passing check and be refused, which is exactly the confusing
 * failure this component exists to remove.
 *
 * So it waits for the verdict, and only then submits.
 */
export function AmendmentIdentityCheck({ onVerified }: { onVerified: () => void }) {
  const [phase, setPhase] = useState<"capture" | "waiting" | "done" | "slow">(
    "capture",
  );

  /*
   * Guards the callback against firing twice. The poll is cancelled on the
   * first pass, but a verdict landing in the same tick as a re-render should
   * not submit the form a second time.
   */
  const submitted = useRef(false);

  const finish = useCallback(() => {
    if (submitted.current) return;

    submitted.current = true;
    setPhase("done");
    onVerified();
  }, [onVerified]);

  useEffect(() => {
    if (phase !== "waiting") return;

    let cancelled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;

      const result = await getVerificationStatusAction();

      if (cancelled) return;

      if (result.status === "success" && result.data.is_verified) {
        finish();

        return;
      }

      /*
       * Ninety seconds, then stop and say so.
       *
       * A verdict normally lands in a few seconds. A page that polls forever
       * is a page hammering the API from a tab somebody has walked away from,
       * and a spinner that never resolves tells a client nothing about what to
       * do next.
       */
      if (Date.now() - startedAt > 90_000) {
        setPhase("slow");

        return;
      }

      timer = window.setTimeout(() => void tick(), 3000);
    };

    let timer = window.setTimeout(() => void tick(), 2000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, finish]);

  if (phase === "done") {
    return (
      <p className="flex items-center gap-2 border border-success/40 bg-success/5 px-5 py-4 text-sm text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Confirmed it is you. Saving your changes…
      </p>
    );
  }

  if (phase === "waiting") {
    return (
      <p className="flex items-center gap-2 border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
        Confirming it is you. Your changes are saved and will be submitted the
        moment this comes back — stay on this page.
      </p>
    );
  }

  if (phase === "slow") {
    return (
      <div className="border border-gold/50 bg-gold/5 px-5 py-4 text-sm leading-relaxed text-navy">
        <p>
          This is taking longer than it should. Nothing you have written is
          lost — your changes are saved.
        </p>
        <button
          type="button"
          onClick={() => setPhase("waiting")}
          className="mt-3 text-xs uppercase tracking-[0.15em] text-navy underline underline-offset-4"
        >
          Check again
        </button>
      </div>
    );
  }

  return (
    <SmileIdCapture
      title="Confirm it is you"
      description="You are already verified — this is a short camera check to confirm the person making these changes is you. No documents: just follow the prompts, and it takes a few seconds."
      footerNote="We compare this against the identity you have already proved. Nothing is kept."
      /*
       * Accepted, not decided — so this moves to waiting rather than
       * submitting. See the note at the top.
       */
      onVerified={() => setPhase("waiting")}
    />
  );
}
