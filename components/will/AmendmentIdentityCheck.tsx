"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";

import { SmileIdCapture } from "@/components/verification/SmileIdCapture";
import { getVerificationStatusAction } from "@/lib/actions/verification.client";

/**
 * The camera check for an amendment, taken in a dialog over the form.
 *
 * **Only ever for an update.** A first Will is never checked here — this is
 * the narrow question of whether the person changing an instrument somebody
 * may already be relying on is the one who made it.
 *
 * ## Why a dialog, and why it opens from the submit button
 *
 * The check used to be a link to `/dashboard/kyc`, and then a panel embedded
 * in the page. Both were wrong in the same way: they put a second, unfamiliar
 * task in front of somebody who had already decided to do the first one. The
 * client presses "Save & continue" — that *is* the request — and the check
 * belongs on top of the page they are on, ending with the thing they asked
 * for actually happening.
 *
 * A native `<dialog>` rather than a div: it traps focus, closes on Escape and
 * is inert to the page behind it, all of which would otherwise be hand-rolled
 * and half-right.
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
  open,
  onCancel,
  onVerified,
}: {
  open: boolean;
  onCancel: () => void;
  onVerified: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<"capture" | "waiting" | "done" | "slow">(
    "capture",
  );

  /*
   * Guards against submitting twice. The poll is cancelled on the first pass,
   * but a verdict landing in the same tick as a re-render must not fire the
   * callback again.
   */
  const submitted = useRef(false);

  /* `showModal()` is what makes it modal — rendering the element does not. */
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const finish = useCallback(() => {
    if (submitted.current) return;

    submitted.current = true;
    setPhase("done");
    onVerified();
  }, [onVerified]);

  useEffect(() => {
    if (!open || phase !== "waiting") return;

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
       * few seconds; a dialog that polls forever is one hammering the API from
       * a tab somebody has walked away from, and a spinner that never resolves
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
  }, [open, phase, finish]);

  return (
    <dialog
      ref={dialogRef}
      /*
       * Escape and the backdrop both mean "not now". The client keeps their
       * changes either way — nothing here is lost by closing.
       */
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel();
      }}
      aria-labelledby="amendment-check-title"
      className="w-[min(30rem,calc(100vw-2rem))] border border-border bg-background p-0 shadow-elegant backdrop:bg-navy/50"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 id="amendment-check-title" className="font-serif text-lg text-navy">
            Confirm it is you
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your changes are saved. This finishes submitting them.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="-mr-1 p-1 text-muted-foreground transition-colors hover:text-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {phase === "done" && (
        <p className="flex items-center gap-2 px-6 py-8 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Confirmed. Submitting your changes…
        </p>
      )}

      {phase === "waiting" && (
        <p className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
          Confirming it is you. This submits by itself the moment it comes
          back — stay on this page.
        </p>
      )}

      {phase === "slow" && (
        <div className="px-6 py-6 text-sm leading-relaxed text-navy">
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
      )}

      {phase === "capture" && open && (
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
    </dialog>
  );
}
