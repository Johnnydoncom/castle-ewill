"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Loader2,
  Pencil,
  X,
} from "lucide-react";

import { unlockWillForAmendment } from "@/lib/actions/will.client";

/**
 * "Update your Will" card + warning dialog for subscribers.
 *
 * Used on:
 *  - The Will detail page (via JourneyActions) when `journey.can_update`
 *  - The editor page directly when a subscriber navigates to the edit URL
 *
 * The subscriber must read and confirm four things before the Will is unlocked:
 *   1. Their Will returns to draft -- they must work through the wizard again.
 *   2. A selfie is required when they resubmit (liveness check).
 *   3. Their current printed Will stays legally valid throughout.
 *   4. Their subscription covers the amendment -- no extra charge.
 *
 * Only after confirming does the API call fire and the editor open.
 */
export function AmendmentUnlockSection({
  willId,
  forClient = false,
}: {
  willId: string;
  /**
   * A lawyer amending a client's Will. The camera check is still the
   * lawyer's own — theirs is the identity on file — but the Will, and the
   * printed copy somebody is holding, are the client's.
   */
  forClient?: boolean;
}) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);

    const result = await unlockWillForAmendment(willId);

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    // The Will is now a draft -- open the first step of the editor.
    startTransition(() => {
      router.push(`/dashboard/wills/${willId}/edit?step=1`);
    });
  };

  return (
    <>
      <section className="border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <Pencil className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div className="min-w-0">
            <h3 className="font-serif text-lg text-navy">
              {forClient ? "Update this Will" : "Update your Will"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {forClient
                ? "Its subscription lets you amend and re-issue this Will whenever your client's life changes -- a new beneficiary, a change of executor, or anything else that no longer reflects their wishes."
                : "Your subscription lets you amend and re-issue your Will whenever life changes -- a new beneficiary, a change of executor, or anything else that no longer reflects your wishes."}
            </p>

            <button
              type="button"
              onClick={() => setShowWarning(true)}
              className="mt-5 inline-flex h-11 items-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              <Pencil className="h-3.5 w-3.5" />
              Begin amendment
            </button>
          </div>
        </div>
      </section>

      {/* Warning dialog -- subscriber must confirm before the Will is unlocked */}
      {showWarning && (
        <dialog
          open
          aria-labelledby="amend-warning-heading"
          aria-modal="true"
          className="fixed inset-0 z-50 m-0 flex h-full w-full items-center justify-center bg-navy/60 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg border border-border bg-background p-8 shadow-2xl">
            {/* Close / cancel */}
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => {
                setShowWarning(false);
                setError(null);
              }}
              className="absolute right-4 top-4 rounded p-1 text-muted-foreground transition-colors hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Heading */}
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <h2
                id="amend-warning-heading"
                className="font-serif text-xl text-navy"
              >
                Before you begin your amendment
              </h2>
            </div>

            {/* Four things to know */}
            <ul className="mt-5 space-y-4 border-t border-border pt-5">
              {[
                {
                  heading: forClient
                    ? "This Will returns to draft"
                    : "Your Will returns to draft",
                  detail:
                    "You will need to work through the five steps again and resubmit. Nothing you entered before is lost -- your existing answers are pre-filled.",
                },
                {
                  heading: "A selfie is required at submission",
                  detail:
                    "When you resubmit, we will ask for a brief camera check to confirm it is you making the change -- exactly as we would for any amendment to a live instrument.",
                },
                {
                  heading: forClient
                    ? "The current Will stays valid"
                    : "Your current Will stays valid",
                  detail: forClient
                    ? "The printed Will your client holds continues to be their legal Will until you complete and resubmit the amendment. Opening the editor does not invalidate anything."
                    : "The printed Will you hold continues to be your legal Will until you complete and resubmit the amendment. Opening the editor does not invalidate anything.",
                },
                {
                  heading: "Payment is not required again",
                  // No review is offered on a lawyer's Will, so theirs does
                  // not name one as an extra.
                  detail: forClient
                    ? "This Will's subscription covers amendments. You will not be charged to resubmit, unless you add registry lodging."
                    : "Your subscription covers amendments. You will not be charged to resubmit, unless you add optional extras such as legal review or registry lodging.",
                },
              ].map(({ heading, detail }) => (
                <li key={heading} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <p className="font-medium text-navy">{heading}</p>
                    <p className="mt-0.5 leading-relaxed text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* API error */}
            {error && (
              <p
                role="alert"
                className="mt-4 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {/* Confirm / cancel */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleUnlock()}
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                )}
                {loading ? "Opening editor..." : "I understand -- begin amendment"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowWarning(false);
                  setError(null);
                }}
                disabled={loading}
                className="inline-flex h-11 items-center px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-navy disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}