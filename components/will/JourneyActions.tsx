"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, CreditCard, Download, ScanFace, Scale } from "lucide-react";

import { chooseReview, type ReviewChoice } from "@/lib/actions/will.client";
import type { PrintBlocker, WillJourney } from "@/lib/actions/will";

/** A date as the client reads it, the same on the server and in the browser. */
function readableDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

/**
 * One answer to the legal-review question.
 *
 * A plain button that calls the API, not a submit button inside a
 * `<form action>`. Those forms were never sent (2026-09-15): pressing one
 * marked the question answered at once, which swapped the question for the
 * summary and took the form out of the page — and a browser does not submit a
 * form that is no longer in the document. The screen said "answered", nothing
 * reached the server, and the question came back on the next visit. Not one
 * choice had ever been recorded.
 */
function ChoiceButton({
  chosen,
  saving,
  disabled,
  onClick,
  children,
}: {
  chosen: boolean;
  saving: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={chosen}
      aria-busy={saving}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
        chosen
          ? "border-navy bg-navy text-navy-foreground"
          : "border-border text-navy hover:border-gold hover:text-gold"
      }`}
    >
      {chosen && !saving && <Check className="h-3.5 w-3.5" aria-hidden />}
      {saving ? "Saving…" : children}
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
    body: "Because this is your first Will with us, we confirm your identity — with your NIN and a selfie, or a photographed government-issued ID — before releasing it.",
    cta: { label: "Verify my identity", href: "/dashboard/kyc" },
  },
  /*
   * Rarely seen now: the photograph is asked for at the first step, so a Will
   * without one is reported as incomplete long before it reaches this gate.
   * It survives as the backstop for a document removed after the fact.
   */
  passport_photograph_required: {
    icon: ScanFace,
    title: "We need your photograph",
    body: "A passport photograph is printed on the face of your Will. Add one on the first step and you can carry on.",
    cta: { label: "Open this Will", href: null },
  },
  /*
   * Shown only where the witness panel is not.
   *
   * On the Will's own page that panel is a few inches below, so this card is
   * suppressed entirely — see `resolvedHere`. It survives on the editor's
   * review step, which has no witness panel of its own, and where the button
   * genuinely goes somewhere: the Will's page.
   */
  /*
   * Deliberately does not promise an email.
   *
   * It used to say "we are checking your witnesses — we will email you as soon
   * as both are checked", which describes a process that is often not
   * happening: a witness whose details changed on an amended Will has their
   * verification withdrawn, so nothing is with the authority and nothing is
   * coming. Telling somebody to wait for a result nobody is going to produce
   * is how they end up refreshing a page forever — the same fault as the
   * "queued for review" copy this product removed once already.
   *
   * The witness panel on the Will's own page says which of the two it is, per
   * witness. This card's job is only to say that the door is shut and where to
   * go.
   */
  witnesses_required: {
    icon: ScanFace,
    title: "Your witnesses need confirming",
    body: "Both witnesses' identification has to be confirmed before your Will can be released. Open the Will to see where each one stands.",
    cta: { label: "Open this Will", href: null },
  },
  /*
   * No active subscription on this Will (2026-09-14: downloading stops the moment
   * a subscription ends, with no grace). Renewing is the way
   * back and nothing was deleted, so the card says both. The button goes to the
   * Will's Subscription panel, which renews on the spot; on that page itself the
   * card is not shown (`resolvedHere`).
   */
  subscription_required: {
    icon: CreditCard,
    title: "Renew to download your Will",
    body: "This Will's subscription has ended, so downloading it is paused. Renew your subscription to download it again — nothing has been deleted, and renewing opens it straight away.",
    cta: { label: "Renew on this Will's page", href: null },
  },
  /*
   * No `liveness_required` card.
   *
   * It used to appear here, on the Print stage, and asked a client who was
   * already verified and already paid to find a camera before collecting the
   * document they had bought — then again on the next visit, because a
   * liveness pass expires within the hour.
   *
   * The camera is now asked for in exactly one place: the last step of an
   * *amendment*, where the question it answers is a real one — is the person
   * altering an instrument somebody may be relying on the testator, right now.
   * See `ReviewStep` in `StepForms.tsx`.
   */
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
  resolvedHere = [],
}: {
  willId: string;
  journey: WillJourney;
  pdfUrl: string;
  /**
   * Blockers whose own panel is already on this page.
   *
   * A card explaining what to do next, above a button that navigates to the
   * page you are already on, above the panel that actually does it, is three
   * things where one is wanted. Where the work is right here, the panel is the
   * call to action and this card is furniture.
   */
  resolvedHere?: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  /*
   * The legal-review answer, in three parts.
   *
   * `saving` is the answer on its way to the server: its button says so and
   * both are held until it lands, so a second press cannot race the first.
   * `saved` is an answer the server has accepted, shown at once rather than
   * after the refetch that will carry it. And the answer on record, for
   * everybody arriving at the page.
   *
   * Nothing is shown as answered until the server has said so. Showing it on
   * the click is exactly what hid the fault this replaced: the screen agreed
   * with the client while the server had heard nothing.
   */
  const [saving, setSaving] = useState<ReviewChoice | null>(null);
  const [saved, setSaved] = useState<ReviewChoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRecord =
    journey.review_choice === "requested" || journey.review_choice === "skipped"
      ? journey.review_choice
      : null;

  const answer = saved ?? onRecord;

  /** The answer they did not give, which is the only thing left to offer. */
  const theOtherAnswer: ReviewChoice =
    answer === "requested" ? "skipped" : "requested";

  const choose = async (choice: ReviewChoice) => {
    if (saving) return;

    setSaving(choice);
    setError(null);

    const result = await chooseReview(willId, choice);

    setSaving(null);

    if (!result.ok) {
      setError(result.message);

      return;
    }

    setSaved(choice);

    // The journey bar and the print panel read the same record.
    startTransition(() => router.refresh());
  };

  /*
   * Whether this instance carries the question at all. The journey block
   * appears on more than one screen; only the Will's own page asks, where
   * paying and printing happen.
   */
  const asksAboutReview = journey.can_skip_review || journey.can_request_review;

  const blocked = journey.print_blocked_by;

  const blocker =
    blocked && !resolvedHere.includes(blocked) ? BLOCKERS[blocked] : null;

  /*
    Beside the buttons, not at the top of the block. A refusal shown above a
    journey bar is a refusal nobody scrolls up to read.
  */
  const errorMessage = error && (
    <p
      role="alert"
      className="mt-4 w-full border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {error}
    </p>
  );

  return (
    <div className="space-y-6">
      {/*
        The optional stage, open until the Will is printed — after that, a
        review is a different product.

        Asked in full until it is answered, and afterwards only summarised: a
        question asked again after it has been answered reads as a question
        that was not heard.
      */}
      {asksAboutReview && answer === null && (
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
            <ChoiceButton
              chosen={saving === "requested"}
              saving={saving === "requested"}
              disabled={saving !== null}
              onClick={() => void choose("requested")}
            >
              Request a review
            </ChoiceButton>
            <ChoiceButton
              chosen={saving === "skipped"}
              saving={saving === "skipped"}
              disabled={saving !== null}
              onClick={() => void choose("skipped")}
            >
              Skip — I&apos;ll print it myself
            </ChoiceButton>
          </div>

          {errorMessage}
        </section>
      )}

      {asksAboutReview && answer !== null && (
        <section className="flex flex-wrap items-center justify-between gap-4 border border-border bg-surface px-6 py-4">
          <p
            role="status"
            aria-live="polite"
            className="text-sm leading-relaxed text-navy"
          >
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Legal review
            </span>
            <br />
            {answer === "requested"
              ? "A solicitor will read your Will before you print it."
              : "You are printing it yourself, without a solicitor's read."}
          </p>

          {/*
            The other answer, offered as one button rather than the whole
            question again. It is still changeable until the Will is printed.
          */}
          <ChoiceButton
            chosen={false}
            saving={saving === theOtherAnswer}
            disabled={saving !== null}
            onClick={() => void choose(theOtherAnswer)}
          >
            {theOtherAnswer === "skipped"
              ? "Change — print it myself"
              : "Change — request a review"}
          </ChoiceButton>

          {errorMessage}
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

          {/*
            Any grace after a lapsed subscription, while it runs — none by
            default since 2026-09-14. Said
            here, beside the button it will take away, rather than left to an
            email.
          */}
          {journey.download_access_ends_at && (
            <div className="mt-6 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-relaxed text-navy">
              <p>
                Your subscription has ended. You can download your Will until{" "}
                <span className="font-medium">
                  {readableDate(journey.download_access_ends_at)}
                </span>
                ; after that, renew to keep access. Nothing is deleted.
              </p>
              <Link
                href={`/dashboard/wills/${willId}#subscription`}
                className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.15em] text-navy underline underline-offset-4 hover:text-gold"
              >
                Renew subscription
              </Link>
            </div>
          )}
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
                    href={
                      blocker.cta.href ??
                      `/dashboard/wills/${willId}${blocked === "subscription_required" ? "#subscription" : ""}`
                    }
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
      {/* Not beside the renewal card above, which already offers the same thing. */}
      {journey.printed_at !== null &&
        !journey.can_update &&
        blocked !== "subscription_required" && (
          <section className="border border-border bg-surface p-6">
            <h3 className="font-serif text-lg text-navy">Amendments</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Your Will has been issued. To amend and re-issue it as life changes,
              an annual subscription keeps updates free.
            </p>
            {/*
              It linked to the payments page, which sells no subscription for a
              Will — so the button led somewhere nothing could be bought.
            */}
            <Link
              href={`/dashboard/wills/${willId}#subscription`}
              className="mt-5 inline-flex h-11 items-center border border-border px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
            >
              See subscription
            </Link>
          </section>
        )}
    </div>
  );
}
