"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, CreditCard, Download, ScanFace, Scale } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { chooseReviewAction } from "@/lib/actions/will.client";
import type { PrintBlocker, WillJourney } from "@/lib/actions/will";

/**
 * One of two answers to a question, and it shows which one you gave.
 *
 * These were two plain buttons. Pressing one submitted its own form, and until
 * the server answered and the route refetched, the screen looked exactly as it
 * had a moment earlier — so people pressed again, or wondered whether it had
 * registered at all.
 *
 * The choice is held here as well as on the server: pressed, it takes the
 * chosen state immediately and keeps it while the request is in flight. Marked
 * up as a pressed toggle rather than styled to look like one, so a screen
 * reader says "Request a review, pressed" instead of describing a button that
 * happens to be a different colour.
 */
function ChoiceSubmit({
  chosen,
  onChoose,
  children,
}: {
  chosen: boolean;
  /**
   * Fired on the click, not on the form's `onSubmit`.
   *
   * A `<form action={fn}>` in React 19 is submitted by React itself, and how
   * a user-supplied `onSubmit` interleaves with that is a detail of theirs to
   * change. A click on the submit button is not: it happens first, always, and
   * it is the moment the client expects the screen to answer.
   */
  onChoose: () => void;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      onClick={onChoose}
      aria-pressed={chosen}
      /*
        Only the one being saved is disabled. Disabling both would take away
        the correction from somebody who has just realised they pressed the
        wrong one, in the seconds where it is easiest to make that mistake.
      */
      disabled={pending}
      className={`inline-flex h-11 items-center justify-center gap-2 border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:opacity-70 ${
        chosen
          ? "border-navy bg-navy text-navy-foreground"
          : "border-border text-navy hover:border-gold hover:text-gold"
      }`}
    >
      {chosen && !pending && <Check className="h-3.5 w-3.5" aria-hidden />}
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
  witnesses_required: {
    icon: ScanFace,
    title: "We are checking your witnesses",
    body: "Both witnesses' identification has to be confirmed before your Will can be released. We will email you as soon as both are checked.",
    cta: { label: "Open this Will", href: null },
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
  const [state, action] = useFormAction(chooseReviewAction);

  /*
   * Which answer was given, held here so the screen can show it at the moment
   * of the click rather than after the server has been asked and the route
   * refetched. Cleared if the request fails, so a failed choice does not sit
   * on screen looking settled.
   */
  const [pressed, setPressed] = useState<"requested" | "skipped" | null>(null);

  /*
   * What to show as chosen: the click if there has been one, otherwise the
   * answer already on record.
   *
   * The stored answer matters as much as the click. This section used to
   * vanish the moment a choice was made, so somebody coming back to the page
   * found the question gone with nothing saying which way they had answered —
   * and somebody who wanted to change their mind found nothing to change.
   *
   * Derived rather than synchronised: a choice the server refused stops
   * showing as one the moment the error arrives, without an effect writing
   * state back into the render that produced it.
   */
  const choosing =
    state.status === "error"
      ? null
      : (pressed ??
        (journey.review_choice === "undecided" ? null : journey.review_choice));

  /** Whether the question has been answered — on the server, or just now. */
  const decided = choosing !== null;

  /** The answer they did not give, which is the only thing left to offer. */
  const theOtherAnswer = choosing === "requested" ? "skipped" : "requested";

  /*
   * Whether this instance carries the question at all. The journey block
   * appears on more than one screen; only the Will's own page asks, where
   * paying and printing happen.
   */
  const asksAboutReview = journey.can_skip_review || journey.can_request_review;

  const blocked = journey.print_blocked_by;

  const blocker =
    blocked && !resolvedHere.includes(blocked) ? BLOCKERS[blocked] : null;

  return (
    <div className="space-y-6">
      {/* The optional stage. Offered only while the choice is still open —
          after the Will is issued, a review is a different product. */}
      {/*
        Asked while it is the question in front of the client, and afterwards
        only summarised.

        The choice stays the client's until the Will is printed, so it was
        rendered in full at every later stage as well — heading, explanation
        and both buttons, on a page whose journey bar had already ticked legal
        review off. A question asked again after it has been answered reads as
        a question that was not heard.

        Undecided, it is the step: asked in full wherever they are. Decided, it
        is a line saying what they chose and how to change it.
      */}
      {asksAboutReview && !decided && (
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
              <ChoiceSubmit
                chosen={choosing === "requested"}
                onChoose={() => setPressed("requested")}
              >
                Request a review
              </ChoiceSubmit>
            </form>
            <form action={action}>
              <input type="hidden" name="willId" value={willId} />
              <input type="hidden" name="choice" value="skipped" />
              <ChoiceSubmit
                chosen={choosing === "skipped"}
                onChoose={() => setPressed("skipped")}
              >
                Skip — I&apos;ll print it myself
              </ChoiceSubmit>
            </form>
          </div>

          {/*
            Said in words as well as in colour, because a filled button is not
            an answer — and it stays on screen through the refetch that follows,
            which is the second or two where nothing else on the page moves.
          */}
          {/*
            Beside the buttons, not at the top of the block.

            A refusal shown above a journey bar is a refusal nobody scrolls up
            to read: the click looked as though it had simply done nothing,
            which is how a 403 on every single choice went unnoticed for as
            long as it did.
          */}
          {state.status === "error" && (
            <p
              role="alert"
              className="mt-4 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {state.message}
            </p>
          )}

          {choosing && state.status !== "error" && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 text-sm text-muted-foreground"
            >
              {choosing === "requested"
                ? "A solicitor will read your Will. You can change this until it is printed."
                : "You will print it yourself. You can change this until it is printed."}
            </p>
          )}
        </section>
      )}

      {asksAboutReview && decided && (
        <section className="flex flex-wrap items-center justify-between gap-4 border border-border bg-surface px-6 py-4">
          <p className="text-sm leading-relaxed text-navy">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Legal review
            </span>
            <br />
            {choosing === "requested"
              ? "A solicitor will read your Will before you print it."
              : "You are printing it yourself, without a solicitor's read."}
          </p>

          {/*
            The other answer, offered as one button rather than the whole
            question again. It is still changeable until the Will is printed,
            which is worth saying once rather than asking twice.
          */}
          <form action={action}>
            <input type="hidden" name="willId" value={willId} />
            <input type="hidden" name="choice" value={theOtherAnswer} />
            {/*
              Pressing it takes the new answer immediately, so the line above
              changes with the click rather than after the round trip.
            */}
            <ChoiceSubmit
              chosen={false}
              onChoose={() => setPressed(theOtherAnswer)}
            >
              {theOtherAnswer === "skipped"
                ? "Change — print it myself"
                : "Change — request a review"}
            </ChoiceSubmit>
          </form>
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
