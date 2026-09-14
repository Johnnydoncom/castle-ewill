"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

import { startSubscriptionRenewalCheckout } from "@/lib/actions/payments.client";

/** The subscription a Will can be renewed on, priced server-side. */
export type Renewal = { planSlug: string; price: string; autoRenewAvailable?: boolean };

/**
 * Renews this Will's subscription, straight to the gateway and back.
 *
 * A button rather than a link to a billing page: there is no page that sells a
 * subscription for one Will, and a renewal belongs to the Will it keeps open.
 */
export function RenewSubscription({
  willId,
  renewal,
  label,
}: {
  willId: string;
  renewal: Renewal;
  label: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Keep this card and renew by itself from now on — off unless ticked. */
  const [autoRenew, setAutoRenew] = useState(false);

  async function renew() {
    setError(null);
    setPending(true);

    const result = await startSubscriptionRenewalCheckout(
      willId,
      renewal.planSlug,
      renewal.autoRenewAvailable === true && autoRenew,
    );

    if (result.ok) {
      window.location.assign(result.url);
      return;
    }

    setPending(false);
    setError(result.message);
  }

  return (
    <div className="mt-5 space-y-3">
      {renewal.autoRenewAvailable && (
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-relaxed text-navy">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(event) => setAutoRenew(event.target.checked)}
            className="mt-1 accent-gold"
          />
          Renew automatically each year after this, on the card I pay with
        </label>
      )}
      <button
        type="button"
        onClick={() => void renew()}
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CreditCard className="h-4 w-4" />
        {pending ? "Redirecting…" : `${label} · ${renewal.price}`}
      </button>
      {error && (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
