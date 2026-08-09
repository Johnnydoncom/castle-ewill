"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import {
  fetchQuoteAction,
  startCheckoutAction,
  startFlutterwaveCheckoutAction,
  startBankTransferAction,
} from "@/lib/actions/payments.client";
import type { Plan, PriceQuote } from "@/lib/pricing/types";

/**
 * Paying for a Will, from the dashboard.
 *
 * Differs from the public pricing page in one respect that matters: the
 * client can toggle the annual subscription, and the figure has to follow.
 * It follows by asking the server (`/payments/quote`) rather than adding
 * ₦5,000 here — the browser never does money arithmetic, so the total shown
 * is by construction the total charged.
 */

function Submit({ label, featured }: { label: string; featured: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex h-13 w-full items-center justify-center gap-3 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        featured
          ? "bg-gold text-navy hover:bg-gold/90"
          : "bg-navy text-navy-foreground hover:bg-navy/90"
      }`}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Redirecting…" : label}
    </button>
  );
}

function SecondarySubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-navy disabled:opacity-60"
    >
      {pending ? "Preparing…" : label}
    </button>
  );
}

export function WillCheckout({
  plans,
  subscription,
  initialQuotes,
  flutterwaveEnabled,
  hasActiveSubscription,
}: {
  plans: Plan[];
  /** The optional annual add-on, or null if none is published. */
  subscription: Plan | null;
  /** Composed server-side, keyed by slug — the state before any toggling. */
  initialQuotes: Record<string, PriceQuote>;
  flutterwaveEnabled: boolean;
  /** Already subscribed: the option is shown as met rather than offered again. */
  hasActiveSubscription: boolean;
}) {
  const [selected, setSelected] = useState(
    () => plans.find((plan) => plan.is_popular)?.slug ?? plans[0]?.slug ?? "",
  );
  const [withSubscription, setWithSubscription] = useState(false);
  const [fetched, setFetched] = useState<Record<string, PriceQuote>>({});
  const [repricing, startReprice] = useTransition();

  const [cardState, card] = useFormAction(startCheckoutAction);
  const [flwState, flutterwave] = useFormAction(startFlutterwaveCheckoutAction);
  const [transferState, transfer] = useFormAction(startBankTransferAction);

  const plan = plans.find((p) => p.slug === selected) ?? null;
  // Premium already carries a year, so the option is not an option for it.
  const subscriptionIncluded = (plan?.included_subscription_months ?? 0) > 0;

  /*
   * The displayed quote is derived, not stored.
   *
   * Every plan arrives already priced *without* the subscription, so that
   * case needs no request at all — only ticking the box does, and each
   * answer is kept so toggling back and forth asks once rather than
   * every time.
   */
  const cacheKey = `${selected}:${withSubscription}`;
  const baseline = withSubscription ? undefined : initialQuotes[selected];
  const quote = baseline ?? fetched[cacheKey] ?? null;

  useEffect(() => {
    if (!selected || baseline || fetched[cacheKey]) return;

    let cancelled = false;

    startReprice(async () => {
      const next = await fetchQuoteAction(selected, withSubscription);

      // A slower earlier request must not overwrite a newer selection.
      if (!cancelled && next) {
        setFetched((prev) => ({ ...prev, [cacheKey]: next }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selected, withSubscription, cacheKey, baseline, fetched]);

  const error =
    [cardState, flwState, transferState].find((s) => s.status === "error")
      ?.message ?? null;

  if (plans.length === 0) {
    return (
      <p className="border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        Our plans are being updated. Please contact us and we will take your
        payment directly.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="sr-only">Choose a plan</legend>
        {plans.map((option) => (
          <label
            key={option.slug}
            className="flex cursor-pointer items-start gap-4 border border-border p-5 transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5"
          >
            <input
              type="radio"
              name="plan"
              value={option.slug}
              checked={selected === option.slug}
              onChange={() => setSelected(option.slug)}
              className="mt-1.5 accent-gold"
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="font-serif text-lg text-navy">
                  {option.name}
                </span>
                <span className="font-serif text-lg text-navy">
                  {option.price_formatted}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {option.charge_suffix}
                  </span>
                </span>
              </span>
              {option.tagline && (
                <span className="mt-1 block text-sm text-muted-foreground">
                  {option.tagline}
                </span>
              )}
            </span>
          </label>
        ))}
      </fieldset>

      {subscription && (
        <label
          className={`flex items-start gap-4 border p-5 ${
            subscriptionIncluded || hasActiveSubscription
              ? "border-border bg-surface"
              : "cursor-pointer border-border transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5"
          }`}
        >
          {subscriptionIncluded || hasActiveSubscription ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : (
            <input
              type="checkbox"
              checked={withSubscription}
              onChange={(event) => setWithSubscription(event.target.checked)}
              className="mt-1.5 accent-gold"
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-serif text-base text-navy">
                {subscription.name}
              </span>
              <span className="text-sm text-navy">
                {subscriptionIncluded || hasActiveSubscription
                  ? "Already covered"
                  : `${subscription.price_formatted} ${subscription.charge_suffix}`}
              </span>
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              {subscriptionIncluded
                ? "Included with this plan for twelve months."
                : hasActiveSubscription
                  ? "Your subscription is active — amendments are already free."
                  : subscription.tagline}
            </span>
          </span>
        </label>
      )}

      {quote && (
        <dl className="space-y-2 border-t border-border pt-5 text-sm">
          {quote.lines.map((line) => (
            <div
              key={line.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt
                className={
                  line.is_included ? "text-muted-foreground" : "text-navy/80"
                }
              >
                {line.label}
              </dt>
              <dd className="shrink-0 tabular-nums">
                {line.is_included ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
                    Included
                  </span>
                ) : (
                  <span className="text-navy">{line.amount_formatted}</span>
                )}
              </dd>
            </div>
          ))}

          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="font-serif text-lg text-navy">Total payable</dt>
            <dd className="shrink-0 font-serif text-2xl tabular-nums text-navy">
              {repricing ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                quote.total_formatted
              )}
            </dd>
          </div>
        </dl>
      )}

      <div className="space-y-4">
        <form action={card}>
          <input type="hidden" name="planSlug" value={selected} />
          {withSubscription && (
            <input type="hidden" name="withSubscription" value="on" />
          )}
          <Submit label="Pay by card" featured />
        </form>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {flutterwaveEnabled && (
            <form action={flutterwave}>
              <input type="hidden" name="planSlug" value={selected} />
              {withSubscription && (
                <input type="hidden" name="withSubscription" value="on" />
              )}
              <SecondarySubmit label="Flutterwave" />
            </form>
          )}
          <form action={transfer}>
            <input type="hidden" name="planSlug" value={selected} />
            {withSubscription && (
              <input type="hidden" name="withSubscription" value="on" />
            )}
            <SecondarySubmit label="Bank transfer" />
          </form>
        </div>

        {error && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
