"use client";

import { CalendarCheck } from "lucide-react";

import { RenewSubscription, type Renewal } from "@/components/will/RenewSubscription";
import { describeStanding, subscriptionStanding } from "@/lib/will/subscription";

/**
 * This Will's subscription: where it stands, and renewing it.
 *
 * Shown once the Will is paid for (`can_renew_subscription`), whatever state
 * the subscription is in. Renewal used to be offered only after a lapse, so a
 * client whose plan included a year had nowhere to see it or to renew ahead.
 *
 * Renewing costs the annual subscription alone — never the Will's plan again —
 * and a year renewed early is added to the one running. Every other screen
 * that mentions renewing links here (`#subscription`).
 */
export function SubscriptionPanel({
  willId,
  expiresAt,
  isActive,
  renewal,
}: {
  willId: string;
  expiresAt: string | null;
  /** The server's answer, not a comparison against this browser's clock. */
  isActive: boolean;
  /** The published subscription, or null when none is on sale. */
  renewal: Renewal | null;
}) {
  const standing = subscriptionStanding(expiresAt, isActive);

  const body =
    standing.kind === "active"
      ? "Your Will is kept in the vault and can be updated free of charge while it runs. Renewing now adds a year to it, so nothing is lost by renewing early."
      : standing.kind === "ended"
        ? "Renew to keep your Will downloadable and to update it again. Nothing has been deleted."
        : "A subscription keeps your Will in the vault and lets you update it free of charge for a year.";

  return (
    <section id="subscription" className="scroll-mt-24 border border-border bg-background p-6">
      <div className="flex items-start gap-4">
        <CalendarCheck
          className={`mt-0.5 h-5 w-5 shrink-0 ${standing.kind === "active" ? "text-success" : "text-gold"}`}
        />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Subscription
          </p>
          <h3 className="mt-1 font-serif text-lg text-navy">{describeStanding(standing)}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{body}</p>

          {renewal ? (
            <RenewSubscription
              willId={willId}
              renewal={renewal}
              label={standing.kind === "none" ? "Subscribe" : "Renew subscription"}
            />
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Renewal is not on sale just now. Please contact us to renew.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
