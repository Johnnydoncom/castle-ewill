"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setAutoRenewalAction } from "@/lib/actions/payments.client";
import type { AutoRenewal } from "@/lib/actions/will";

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
 * Whether this Will's subscription renews by itself, on which card, and when —
 * with the switch.
 *
 * Everything shown comes from the server's `auto_renewal`. The switch turns it
 * off at any time; it turns it on only where a card was kept, and the server
 * says what to do when none was.
 */
export function AutoRenewalPanel({
  willId,
  autoRenewal,
  subscriptionPrice,
}: {
  willId: string;
  autoRenewal: AutoRenewal;
  subscriptionPrice: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const { enabled, card, renews_on: renewsOn, available } = autoRenewal;

  // Nothing to switch and nothing that could be: a gateway that keeps no cards.
  if (!enabled && !card && !available) return null;

  const price = subscriptionPrice ?? "the annual subscription";

  const summary =
    enabled && card
      ? `Your subscription renews by itself${renewsOn ? ` on ${readableDate(renewsOn)}` : ""}, charging ${price} to your ${card.label}. We remind you a week before.`
      : enabled
        ? "Switched on. We are waiting for the payment provider to confirm your card, and will tell you if it does not arrive."
        : card
          ? `Your ${card.label} is kept. Switch automatic renewal on and your subscription renews by itself each year.`
          : "Tick automatic renewal the next time you pay by card, and your subscription will renew by itself each year.";

  function toggle(next: boolean) {
    setMessage(null);

    startTransition(async () => {
      const result = await setAutoRenewalAction(willId, next);

      setMessage({ ok: result.ok, text: result.message });

      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="border border-border bg-background p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Automatic renewal
          </p>
          <h3 className="mt-1 font-serif text-lg text-navy">{enabled ? "On" : "Off"}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </div>

        {(enabled || card) && (
          <button
            type="button"
            onClick={() => toggle(!enabled)}
            disabled={pending}
            aria-pressed={enabled}
            className="inline-flex h-11 shrink-0 items-center border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : enabled ? "Switch off" : "Switch on"}
          </button>
        )}
      </div>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-4 text-sm leading-relaxed ${message.ok ? "text-muted-foreground" : "text-destructive"}`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
