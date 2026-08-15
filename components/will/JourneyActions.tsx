"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { CreditCard, Download, ScanFace, Scale } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { chooseReviewAction } from "@/lib/actions/will.client";
import type { PrintBlocker, WillJourney } from "@/lib/actions/will";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

/**
 * What the client is told when printing is refused, and where to send them.
 *
 * Keyed on the server's `print_blocked_by` rather than worked out here. The
 * server returns the *first* unmet condition in the order they must be
 * satisfied, so the screen can say "pay, then we will check your ID" instead of
 * listing everything at once and letting someone start with the step that will
 * not help them yet.
 */
const BLOCKERS: Record<
  PrintBlocker,
  {
    icon: typeof CreditCard;
    title: string;
    body: string;
    /*
     * `href: null` means "this Will's own page" — payment happens on the Will
     * it pays for, and only the component knows which Will that is.
     */
    cta: { label: string; href: string | null } | null;
  }
> = {
  incomplete: {
    icon: Scale,
    title: "Finish your Will first",
    body: "Every section needs an answer before the document can be produced.",
    cta: null,
  },
  unpaid: {
    icon: CreditCard,
    title: "Payment is the next step",
    body: "Your Will is complete. Settle the fee and we will produce the signed-ready document.",
    // Filled in per-Will below — payment happens on the Will it pays for.
    cta: { label: "Go to payment", href: null },
  },
  kyc_required: {
    icon: ScanFace,
    title: "One identity check to go",
    body: "Because this is your first Will with us, we confirm your identity against a government-issued document before releasing it.",
    cta: { label: "Verify my identity", href: "/dashboard/kyc" },
  },
  liveness_required: {
    icon: ScanFace,
    title: "A quick camera check",
    body: "We have already verified your documents. This is just a short liveness check to confirm it is you at the keyboard today.",
    cta: { label: "Start the check", href: "/dashboard/kyc" },
  },
};

/**
 * The actions available at the client's current stage.
 *
 * Everything here is driven by `journey`, which the server derives. Nothing is
 * decided in the browser — the download link is only offered when the server
 * says it would be honoured.
 */
export function JourneyActions({
  willId,
  journey,
  pdfUrl,
}: {
  willId: string;
  journey: WillJourney;
  pdfUrl: string;
}) {
  const [state, action] = useFormAction(chooseReviewAction);

  const blocker = journey.print_blocked_by
    ? BLOCKERS[journey.print_blocked_by]
    : null;

  return (
    <div className="space-y-6">
      {state.status === "error" && (
        <p className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {state.message}
        </p>
      )}

      {/* The optional stage. Offered only while the choice is still open —
          after the Will is issued, a review is a different product. */}
      {journey.can_skip_review && journey.review_choice === "undecided" && (
        <section className="border border-border bg-background p-6">
          <h3 className="font-serif text-lg text-navy">
            Would you like a lawyer to read it?
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A practising Nigerian solicitor reads your Will clause by clause and
            writes back with anything that should change. It is entirely optional
            — you can go straight to printing, and your Will is no less valid for
            it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={action}>
              <input type="hidden" name="willId" value={willId} />
              <input type="hidden" name="choice" value="requested" />
              <Submit>Request a review</Submit>
            </form>
            <form action={action}>
              <input type="hidden" name="willId" value={willId} />
              <input type="hidden" name="choice" value="skipped" />
              <Submit>Skip — I&apos;ll print it myself</Submit>
            </form>
          </div>
        </section>
      )}

      {journey.review_choice === "requested" && (
        <section className="border border-gold/50 bg-gold/5 p-6">
          <h3 className="font-serif text-lg text-navy">Review requested</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A solicitor will read your Will and write back. You can still pay and
            print at any time — the review does not hold up your document.
          </p>
        </section>
      )}

      {/* Print: either the gate, or the download. */}
      {journey.can_print ? (
        <section className="border border-success/40 bg-success/5 p-6">
          <h3 className="font-serif text-lg text-navy">Your Will is ready</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Print it on good paper, then sign it in front of two witnesses who
            each sign in front of you. The document carries a QR seal anyone can
            scan to confirm it is genuine and current.
          </p>
          {/*
            Links straight at the API, never through this Next server — the
            same rule as the vault. The bytes are a legal instrument and have
            no business transiting a tier that does not need to see them.
          */}
          <a
            href={pdfUrl}
            className="mt-5 inline-flex h-11 items-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            <Download className="h-4 w-4" />
            Download my Will
          </a>
        </section>
      ) : (
        blocker && (
          <section className="border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <blocker.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0">
                <h3 className="font-serif text-lg text-navy">{blocker.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {blocker.body}
                </p>
                {blocker.cta && (
                  <Link
                    href={blocker.cta.href ?? `/dashboard/wills/${willId}`}
                    className="mt-5 inline-flex h-11 items-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
                  >
                    {blocker.cta.label}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )
      )}

      {/* Amending an issued Will is the subscriber feature. Someone still
          drafting is never shown this. */}
      {journey.printed_at !== null && !journey.can_update && (
        <section className="border border-border bg-surface p-6">
          <h3 className="font-serif text-lg text-navy">Amendments</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Your Will has been issued. To amend and re-issue it as life changes,
            an annual subscription keeps updates free.
          </p>
          <Link
            href="/dashboard/payments"
            className="mt-5 inline-flex h-11 items-center border border-border px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
          >
            See subscription
          </Link>
        </section>
      )}
    </div>
  );
}
