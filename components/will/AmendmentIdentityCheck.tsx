"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { SmileIdCapture } from "@/components/verification/SmileIdCapture";
import { getVerificationStatusAction } from "@/lib/actions/verification.client";

/**
 * The camera check for an amendment, over the whole screen.
 *
 * **Only ever for an update.** A first Will is never checked here — this is
 * the narrow question of whether the person changing an instrument somebody
 * may already be relying on is the one who made it.
 *
 * ## Why a native dialog, opened with `showModal()`
 *
 * Looking into a camera and holding still is the one moment in this journey
 * that wants nothing else on the screen, so it takes all of it.
 *
 * `showModal()` is what makes that true rather than merely painted: it puts
 * the dialog in the **top layer**, above every stacking context on the page;
 * makes everything behind it inert — unfocusable, unclickable, invisible to a
 * screen reader; traps the tab ring inside; stops the page behind from
 * scrolling; and routes Escape to `oncancel`. A `position: fixed` overlay
 * gives you the first of those and none of the rest.
 *
 * This was a dialog once before and rendered pinned to the top-left corner: a
 * dialog is centred by the user agent's own `margin: auto`, and Tailwind's
 * Preflight resets `margin: 0` on every element. That cannot arise here — this
 * one is deliberately full-bleed and sets its own geometry rather than
 * inheriting any.
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [phase, setPhase] = useState<"capture" | "waiting" | "done" | "slow">(
    "capture",
  );

  /*
   * Opened with the method, not rendered with the attribute.
   *
   * `<dialog open>` is a *non-modal* dialog: in the normal flow, nothing inert
   * behind it, no focus trap, no top layer. Every property this relies on
   * comes from `showModal()`, so it has to be called.
   */
  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) dialog.showModal();
  }, []);

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
  }, []);

  /*
   * A beat between the verdict and the submission.
   *
   * Long enough to read "confirmed" and understand why the screen then
   * changes, short enough not to be a wait. Closing on the same frame the
   * verdict lands reads as the check having failed and thrown them back.
   */
  useEffect(() => {
    if (phase !== "done") return;

    const timer = window.setTimeout(onVerified, 700);

    return () => window.clearTimeout(timer);
  }, [phase, onVerified]);

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
    <dialog
      ref={dialogRef}
      aria-labelledby="amendment-check-heading"
      /*
        Escape is the way out, and it goes back to the review rather than
        anywhere else — but only while the client is still the one holding
        things up. Once a check is with Smile ID, a keystroke should not
        abandon a verdict that is seconds from arriving and submitting.

        `preventDefault()` either way: left alone the browser closes the dialog
        itself, and React is then rendering one that is no longer open.
      */
      onCancel={(event) => {
        event.preventDefault();

        if (phase === "capture") onBack();
      }}
      /*
        Full-bleed, and every class here overrides something the user agent
        puts on a dialog: `fit-content` in both dimensions, a `max-width` and
        `max-height` that hold it off the viewport edges, a border, padding,
        and the `margin: auto` that centres a box we want filling the screen.
      */
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto border-0 bg-background p-0 text-foreground backdrop:bg-navy/90"
    >
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Last step
            </p>

            {/*
              A way back, not a dismissal: it returns to the review with every
              answer still filled in.

              Gone once the verdict is being waited on — leaving then would
              abandon a check that is already running and submits by itself
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

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-6">
          <div className="text-center">
            <h1
              id="amendment-check-heading"
              className="font-serif text-3xl tracking-tight text-navy sm:text-4xl"
            >
              Confirm it is you
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              You are changing a Will that has already been produced. Your
              answers are saved — this confirms the change is being made by
              you, and then submits it.
            </p>
          </div>

          {phase === "done" && (
            <p className="mx-auto flex max-w-md items-center gap-2 border border-success/40 bg-success/5 px-5 py-4 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Confirmed. Submitting your changes…
            </p>
          )}

          {phase === "waiting" && (
            <p className="mx-auto flex max-w-md items-center gap-2 border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
              Confirming it is you. This submits by itself the moment it comes
              back — stay on this screen.
            </p>
          )}

          {phase === "slow" && (
            <div className="mx-auto max-w-md border border-gold/50 bg-gold/5 px-5 py-4 text-sm leading-relaxed text-navy">
              <p>
                This is taking longer than it should. Nothing you have written
                is lost — your changes are saved.
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
    </dialog>
  );
}
