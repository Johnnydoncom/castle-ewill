"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";

import { getVerificationStatusAction } from "@/lib/actions/verification.client";

/**
 * What a client sees while a submitted check has no verdict yet.
 *
 * ## Two different waits, which this used to conflate
 *
 * A `pending` attempt means one of two quite different things, and saying the
 * wrong one is worse than saying nothing. Under **manual review** a person has
 * to look at it, which takes as long as it takes and ends in an email. Under
 * **Smile ID** nobody is waiting on a human at all: the verdict is already on
 * its way to our webhook and normally lands within seconds.
 *
 * The screen said "recorded and awaiting review… we'll email you as soon as
 * it's approved" for both. For an automated check that is simply untrue — it
 * describes a review that is not going to happen, to somebody who is about to
 * be verified, and it stops them where they should have carried on.
 *
 * ## Why it polls
 *
 * The verdict arrives on a webhook, out of band, so nothing about this page
 * would otherwise change. Without polling the client sits on a stale screen
 * until they think to reload — which is the same complaint in a different
 * costume. So the automated path asks for the status until it settles, and
 * then sends them on.
 */
const INTERVAL_MS = 3000;

/**
 * How long to keep asking.
 *
 * Their `202` is not a promise of a fast answer, and a page that polls forever
 * is a page that hammers our API from an abandoned tab. After this, the client
 * is told plainly that it is taking longer than usual — which is true, and
 * more useful than a spinner that never stops.
 */
const GIVE_UP_MS = 120_000;

/**
 * Kept asking for, though, after the message changes.
 *
 * The server abandons a job that has stopped answering and marks the attempt
 * over; this page only learns that by asking. Stopping the poll at the same
 * moment the copy says "you can start again" would leave the client waiting
 * for a page that never changes — which is the complaint in a third costume.
 */
const SLOW_INTERVAL_MS = 15_000;

/**
 * And a point at which it stops asking altogether.
 *
 * The server gives up on a silent job within minutes, so reaching this means
 * something else is wrong — our own API unreachable, most likely. A tab left
 * open overnight should not keep polling into it; the client gets a link
 * instead, which is one click and no worse.
 */
const HARD_STOP_MS = 1_200_000;

export function VerificationPending({
  provider,
  next,
}: {
  /** The provider that owns the pending attempt. */
  provider: string;
  /** Where to send the client once it passes. */
  next: string;
}) {
  const automated = provider !== "manual_review";
  const [slow, setSlow] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    // A human decides this one. Nothing to poll for — they get an email.
    if (!automated) return;

    let cancelled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;

      const status = await getVerificationStatusAction();

      if (cancelled) return;

      const latest = status.status === "success" ? status.data.latest : null;

      /*
       * Settled either way. A full load rather than a client-side refresh:
       * this is the moment `is_kyc_verified` flips, and every server component
       * down the tree — the dashboard banner, the Will's print gate — has to
       * see it.
       *
       * Onward only when it passed. A check that failed, or that we gave up
       * waiting on, reloads *this* page instead — which falls back to the
       * check itself, with the reason above it. Sending somebody to the
       * dashboard on a failure would hide the one thing they need to do.
       */
      if (latest && latest.status !== "pending") {
        window.location.href = latest.status === "passed" ? next : window.location.pathname;

        return;
      }

      const elapsed = Date.now() - startedAt;

      if (elapsed > GIVE_UP_MS) setSlow(true);

      if (elapsed > HARD_STOP_MS) {
        setStopped(true);

        return;
      }

      window.setTimeout(
        () => void tick(),
        elapsed > GIVE_UP_MS ? SLOW_INTERVAL_MS : INTERVAL_MS,
      );
    };

    const timer = window.setTimeout(() => void tick(), INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [automated, next]);

  if (!automated) {
    return (
      <div className="flex items-start gap-3 border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm text-navy">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="leading-relaxed">
          Your identity check has been received and is with our team. We&apos;ll
          email you as soon as it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm text-navy">
      {slow ? (
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      ) : (
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-gold" />
      )}

      <p className="leading-relaxed">
        {stopped ? (
          <>
            We are still not hearing back. Nothing you have given us is lost —{" "}
            <a
              href={typeof window === "undefined" ? "" : window.location.pathname}
              className="font-medium text-navy underline decoration-gold underline-offset-4"
            >
              start the check again
            </a>
            .
          </>
        ) : slow ? (
          <>
            This is taking longer than usual. We stop waiting after a few
            minutes and let you start again — this page will offer the check
            back to you shortly, and nothing you have already given us is
            lost.
          </>
        ) : (
          <>
            <strong className="font-medium">Checking your identity.</strong>{" "}
            This usually takes a few seconds. You&apos;ll be taken on
            automatically — no need to do anything.
          </>
        )}
      </p>
    </div>
  );
}
