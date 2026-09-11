"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import {
  fetchQuoteAction,
  startCheckoutAction,
  startBankTransferAction,
  NO_OPTIONS,
  type PriceOptions,
} from "@/lib/actions/payments.client";
import type { Plan, PriceQuote } from "@/lib/pricing/types";

/**
 * Paying for a Will, from the dashboard.
 *
 * Differs from the public pricing page in one respect that matters: the
 * client can take the optional extras, and the figure has to follow. It
 * follows by asking the server (`/payments/quote`) rather than adding the
 * add-on prices here — the browser never does money arithmetic, so the total
 * shown is by construction the total charged.
 *
 * The extras are rendered from a list rather than written out one by one,
 * mirroring `PriceQuoteBuilder::addOnsFor()` on the backend. Two of them were
 * already near-identical blocks; a third would have been three places to
 * forget the "already included, do not offer to sell it again" branch.
 */

type OptionKey = keyof PriceOptions;

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

/**
 * What each checkout form posts. Rendered into all three so the card,
 * Flutterwave and transfer paths cannot get out of step over what was chosen.
 */
function SelectionFields({
  willId,
  planSlug,
  options,
}: {
  willId?: string;
  planSlug: string;
  options: PriceOptions;
}) {
  return (
    <>
      {willId && <input type="hidden" name="willId" value={willId} />}
      <input type="hidden" name="planSlug" value={planSlug} />
      {options.withReview && <input type="hidden" name="withReview" value="on" />}
      {options.withSubscription && (
        <input type="hidden" name="withSubscription" value="on" />
      )}
      {options.withLodging && <input type="hidden" name="withLodging" value="on" />}
    </>
  );
}

export function WillCheckout({
  willId,
  plans,
  review,
  subscription,
  lodging,
  initialQuotes,
  hasActiveSubscription,
  autoRenewAvailable = false,
}: {
  /*
   * Which Will is being paid for.
   *
   * Sent explicitly because the server used to guess — "the most recently
   * updated Will" — which is a coin flip once a client holds two, and credits
   * the wrong one.
   */
  willId?: string;
  plans: Plan[];
  /** Optional per Will: a solicitor reads the draft. Null if unpublished. */
  review: Plan | null;
  /** The optional annual add-on, or null if none is published. */
  subscription: Plan | null;
  /**
   * Lodging the executed Will with the Probate Registry.
   *
   * An add-on now rather than an unavoidable surcharge. It was added to every
   * total automatically, so the cheapest route to a finished Will read
   * ₦65,000 when drafting alone is ₦40,000 — and a client who intends to lodge
   * it themselves was billed for a service they never asked for.
   */
  lodging: Plan | null;
  /** Composed server-side, keyed by slug — the state before any toggling. */
  initialQuotes: Record<string, PriceQuote>;
  /** Already subscribed: the option is shown as met rather than offered again. */
  hasActiveSubscription: boolean;
  /** Whether the active gateway can keep a card for automatic renewal. */
  autoRenewAvailable?: boolean;
}) {
  const [selected, setSelected] = useState(
    () => plans.find((plan) => plan.is_popular)?.slug ?? plans[0]?.slug ?? "",
  );
  const [options, setOptions] = useState<PriceOptions>(NO_OPTIONS);
  /** "Renew my subscription automatically each year" — off unless ticked. */
  const [autoRenew, setAutoRenew] = useState(false);
  const [fetched, setFetched] = useState<Record<string, PriceQuote>>({});
  const [repricing, startReprice] = useTransition();

  const [cardState, card] = useFormAction(startCheckoutAction);
  const [transferState, transfer] = useFormAction(startBankTransferAction);

  const plan = plans.find((p) => p.slug === selected) ?? null;

  /*
   * Each extra, and on what terms — the client mirror of the backend's
   * add-on table. `includedByPlan` is what stops Premium being sold a
   * review it already covers.
   */
  const addOns = [
    {
      key: "withReview" as OptionKey,
      plan: review,
      includedByPlan: plan?.includes_review ?? false,
      alreadyHeld: false,
      includedNote: "Included with this plan.",
      heldNote: null as string | null,
    },
    {
      key: "withSubscription" as OptionKey,
      plan: subscription,
      includedByPlan: (plan?.included_subscription_months ?? 0) > 0,
      alreadyHeld: hasActiveSubscription,
      includedNote: "Included with this plan for twelve months.",
      heldNote: "Your subscription is active — amendments are already free.",
    },
    {
      key: "withLodging" as OptionKey,
      plan: lodging,
      includedByPlan: plan?.includes_lodging ?? false,
      alreadyHeld: false,
      includedNote: "Included with this plan.",
      heldNote: null as string | null,
    },
  ].filter((addOn) => addOn.plan !== null);

  /*
   * The displayed quote is derived, not stored.
   *
   * Every plan arrives already priced with no extras taken, so that case
   * needs no request at all — only ticking a box does, and each answer is
   * kept so toggling back and forth asks once rather than every time.
   */
  const untouched =
    !options.withReview && !options.withSubscription && !options.withLodging;
  const cacheKey = `${selected}:${options.withReview}:${options.withSubscription}:${options.withLodging}`;
  const baseline = untouched ? initialQuotes[selected] : undefined;
  const quote = baseline ?? fetched[cacheKey] ?? null;

  /*
   * Offered only where it can work: a gateway that keeps cards, a Will for the
   * subscription to belong to, and an order that includes a subscription at
   * all. The server checks all three again.
   */
  const offersAutoRenew =
    autoRenewAvailable &&
    Boolean(willId) &&
    (quote?.subscription_months ?? plan?.included_subscription_months ?? 0) > 0;

  useEffect(() => {
    if (!selected || baseline || fetched[cacheKey]) return;

    let cancelled = false;

    startReprice(async () => {
      const next = await fetchQuoteAction(selected, options);

      // A slower earlier request must not overwrite a newer selection.
      if (!cancelled && next) {
        setFetched((prev) => ({ ...prev, [cacheKey]: next }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selected, options, cacheKey, baseline, fetched]);

  const error =
    [cardState, transferState].find((s) => s.status === "error")?.message ??
    null;

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

      {addOns.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy">
            Optional extras
          </legend>

          {addOns.map((addOn) => {
            const settled = addOn.includedByPlan || addOn.alreadyHeld;
            const extra = addOn.plan!;

            return (
              <label
                key={addOn.key}
                className={`flex items-start gap-4 border p-5 ${
                  settled
                    ? "border-border bg-surface"
                    : "cursor-pointer border-border transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5"
                }`}
              >
                {settled ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <input
                    type="checkbox"
                    checked={options[addOn.key]}
                    onChange={(event) =>
                      setOptions((prev) => ({
                        ...prev,
                        [addOn.key]: event.target.checked,
                      }))
                    }
                    className="mt-1.5 accent-gold"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className="font-serif text-base text-navy">
                      {extra.name}
                    </span>
                    <span className="text-sm text-navy">
                      {settled
                        ? "Already covered"
                        : `${extra.price_formatted} ${extra.charge_suffix}`}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                    {addOn.includedByPlan
                      ? addOn.includedNote
                      : addOn.alreadyHeld
                        ? addOn.heldNote
                        : extra.tagline}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {offersAutoRenew && (
        <label className="flex cursor-pointer items-start gap-4 border border-border p-5 transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(event) => setAutoRenew(event.target.checked)}
            className="mt-1.5 accent-gold"
          />
          <span className="min-w-0 flex-1">
            <span className="font-serif text-base text-navy">
              Renew my subscription automatically each year
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              We keep the card you pay with and charge{" "}
              {subscription ? subscription.price_formatted : "the annual subscription"}{" "}
              when your year ends, so access to your Will never lapses. We remind
              you a week before, and you can switch it off at any time. Card
              payments only.
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
        {/*
          Whichever gateway Settings makes active, and only that one.

          The button names no provider, so switching it in the console switches
          what charges. It used to sit above a row naming the alternates, which
          on a single-gateway account meant "Pay now" and "Flutterwave" side by
          side doing exactly the same thing — two buttons, one of them
          apparently a different choice.

          Bank transfer stays: it is not a gateway but a different way to pay,
          settled by hand against an account number an administrator publishes.
        */}
        <form action={card}>
          <SelectionFields willId={willId} planSlug={selected} options={options} />
          {/* The card form only: a bank transfer keeps no card to renew with. */}
          {offersAutoRenew && autoRenew && (
            <input type="hidden" name="autoRenew" value="on" />
          )}
          <Submit label="Pay now" featured />
        </form>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <form action={transfer}>
            <SelectionFields willId={willId} planSlug={selected} options={options} />
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
