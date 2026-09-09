"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { SmileIdCapture } from "@/components/verification/SmileIdCapture";
import { getVerificationStatusAction } from "@/lib/actions/verification.client";

/**
 * The camera check for an amendment, shown in place of the review.
 *
 * **Only ever for an update.** A first Will is never checked here — this is
 * the narrow question of whether the person changing an instrument somebody
 * may already be relying on is the one who made it.
 *
 * ## Why this is not a dialog
 *
 * It was one, briefly, and it rendered pinned to the top-left corner. Native
 * `<dialog>` is centred by the user agent's own `margin: auto`, and Tailwind's
 * Preflight resets `margin: 0` on every element — so the centring quietly went
 * away, and the box was also taller than the viewport with nowhere to scroll.
 *
 * That could have been patched, but a dialog was the wrong shape anyway. This
 * is not an aside from the task: it *is* the last step of the task, so it takes
 * the page the same way every other step does, and offers the way back that a
 * step should.
 *
 * ## Why it cannot submit the moment the capture ends
 *
 * `SmileIdCapture`'s `onVerified` fires when Smile ID *accepts* the job — a
 * `202` — not when it decides. The verdict arrives on our webhook seconds
 * later. Submitting then would post the amendment while the gate still had no
 * passing check and be refused, which is the confusing failure this exists to
 * remove. So it waits for the verdict, then submits.
 */
export function AmendmentIdentityCheck({
  onBack,
  onVerified,
}: {
  onBack: () => void;
  onVerified: () => void;
}) {
  const [phase, setPhase] = useState<"capture" | "waiting" | "done" | "slow">(
    "capture",
  );

  /*
   * Guards against submitting twice. The poll is cancelled on the first pass,
   * but a verdict landing in the same tick as a re-render must not fire the
   * callback again.
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
       * Ninety seconds, then stop and say so. A verdict normally lands in a
       * few seconds; a page that polls forever is one hammering the API from a
       * tab somebody has walked away from, and a spinner that never resolves
       * says nothing about what to do next.
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

  return (
    <div className="space-y-10">
      {/*
        This is the page's heading while the check is up, not a second one
        under it — the review step hands its own heading to `ReviewStep` and
        that goes away with the review. So this matches `StepHeading` beat for
        beat: same rule, same eyebrow, same scale, an `h1` because it is the
        only one on the page.
      */}
      <header className="border-b border-border pb-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-10 shrink-0 bg-gold" />
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Last step
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-navy sm:text-4xl">
              Confirm it is you
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              You are changing a Will that has already been produced. Your
              answers are saved — this confirms the change is being made by
              you, and then submits it.
            </p>
          </div>

          {/*
            A way back, which a dialog's close button was not: this returns to
            the review with everything still filled in, rather than dismissing
            something and leaving the client to work out what happened.

            Hidden once the verdict is being waited on — going back then would
            abandon a check that is already running, and it submits by itself
            within seconds.
          */}
          {phase === "capture" && (
            <button
              type="button"
              onClick={onBack}
              className="flex shrink-0 items-center gap-2 border border-border px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-navy hover:text-navy"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to review
            </button>
          )}
        </div>
      </header>

      <div className="space-y-6">
      {phase === "done" && (
        <p className="flex items-center gap-2 border border-success/40 bg-success/5 px-5 py-4 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Confirmed. Submitting your changes…
        </p>
      )}

      {phase === "waiting" && (
        <p className="flex items-center gap-2 border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
          Confirming it is you. This submits by itself the moment it comes back
          — stay on this page.
        </p>
      )}

      {phase === "slow" && (
        <div className="border border-gold/50 bg-gold/5 px-5 py-4 text-sm leading-relaxed text-navy">
          <p>
            This is taking longer than it should. Nothing you have written is
            lost — your changes are saved.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setPhase("waiting")}
              className="text-xs uppercase tracking-[0.15em] text-navy underline underline-offset-4"
            >
              Check again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4"
            >
              Back to review
            </button>
          </div>
        </div>
      )}

      {phase === "capture" && (
        <SmileIdCapture
          /*
           * Opens on Smile ID's consent screen. The client pressed "Save &
           * continue"; asking them to press "Begin identity check" as well
           * confirms a decision they have just taken.
           */
          autoStart
          /* Proved already — there is no document step to prepare for. */
          withDocument={false}
          title="Confirm it is you"
          description="A short camera check, to confirm the person making these changes is you."
          footerNote="We compare this against the identity you have already proved. Nothing is kept."
          onVerified={() => setPhase("waiting")}
        />
      )}
      </div>
    </div>
  );
}
