import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { listActivePlans, getPaymentProviders } from "@/lib/actions/content";
import { CheckoutButton } from "@/components/payments/CheckoutButton";
import { COMPANY } from "@/lib/company";
import { currentUser } from "@/lib/actions/guards";

/**
 * Prices come from the API, which reads the `plans` table. Rendering per request
 * rather than at build keeps a price change live immediately — and stops a build
 * run without a reachable backend from baking in an empty pricing page, since
 * `listActivePlans()` degrades to an empty list rather than throwing.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One-time pricing for a legally compliant Nigerian Will. No subscriptions, no hidden terms.",
};

export default async function PricingPage() {
  const [plans, providers, user] = await Promise.all([
    listActivePlans(),
    getPaymentProviders(),
    currentUser(),
  ]);
  const signedIn = Boolean(user);
  const flutterwaveEnabled = providers.flutterwave;

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
              Pricing
            </span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h1 className="font-serif text-4xl text-navy sm:text-5xl lg:text-6xl">
            One price.{" "}
            <span className="italic text-primary">Total peace.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-muted-foreground">
            Pay once. No subscription, no renewal trap, and clear terms — one of
            the commitments in our client charter.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {plans.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-20 text-center">
            <p className="font-serif text-lg text-navy">
              Our plans are being updated.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please call {COMPANY.phone} or email {COMPANY.email} and we will
              talk you through the options.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col border p-8 ${plan.is_popular
                  ? "border-gold bg-card shadow-elegant lg:-translate-y-3"
                  : "border-border bg-card"
                  }`}
              >
                {plan.is_popular && (
                  <span className="mb-5 inline-block self-start bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy">
                    Most chosen
                  </span>
                )}
                <h2 className="font-serif text-2xl text-navy">{plan.name}</h2>
                {plan.tagline && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>
                )}

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-serif text-4xl text-navy">
                    {plan.price_formatted}
                  </span>
                  <span className="text-sm text-muted-foreground">one-time</span>
                </div>

                {plan.description && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {plan.description}
                  </p>
                )}

                <ul className="mt-8 flex-1 space-y-3 border-t border-border pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-navy/85">{feature}</span>
                    </li>
                  ))}
                </ul>

                {signedIn ? (
                  <CheckoutButton
                    planSlug={plan.slug}
                    planName={plan.name}
                    featured={plan.is_popular}
                    flutterwaveEnabled={flutterwaveEnabled}
                  />
                ) : (
                  // Anonymous visitors create an account first; checkout needs a
                  // verified email to attach the transaction to.
                  <Link
                    href={`/register?plan=${plan.slug}`}
                    className={`mt-8 flex h-13 items-center justify-center px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors ${plan.is_popular
                      ? "bg-gold text-navy hover:bg-gold/90"
                      : "bg-navy text-navy-foreground hover:bg-navy/90"
                      }`}
                  >
                    Choose {plan.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Payment by Paystack, Flutterwave or bank transfer. Prices include all
          drafting fees; probate filing charges are set by the registry and are
          not included.
        </p>
      </section>
    </>
  );
}
