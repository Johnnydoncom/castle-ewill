import type { Metadata } from "next";
import Link from "next/link";

import { getPriceList } from "@/lib/pricing";
import { PlanCard, PricingFootnotes } from "@/components/pricing/PlanCard";
import { CheckoutButton } from "@/components/payments/CheckoutButton";
import { COMPANY } from "@/lib/company";
import { currentUser } from "@/lib/actions/guards";

/**
 * Prices come from the API, which reads the `plans` table. Rendering per request
 * rather than at build keeps a price change live immediately — and stops a build
 * run without a reachable backend from baking in an empty pricing page, since
 * `getPriceList()` degrades to an empty list rather than throwing.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Charged once per Will. Basic from ₦40,000 plus the compulsory Probate Registry lodging fee, or Premium at ₦120,000 with lawyer review and lodging included.",
};

export default async function PricingPage() {
  const [prices, user] = await Promise.all([getPriceList(), currentUser()]);
  const signedIn = Boolean(user);

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
            Charged once,{" "}
            <span className="italic text-primary">per Will.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-muted-foreground">
            No subscription is required to make a Will, and no renewal trap.
            Every figure you will pay is shown below, including the Probate
            Registry&rsquo;s own compulsory lodging fee.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {prices.will.length === 0 ? (
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
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {prices.will.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  quote={prices.quotes[plan.slug]}
                  featured={plan.is_popular}
                >
                  {signedIn ? (
                    <CheckoutButton
                      planSlug={plan.slug}
                      planName={plan.name}
                      featured={plan.is_popular}
                      flutterwaveEnabled={prices.providers.flutterwave}
                    />
                  ) : (
                    // Anonymous visitors create an account first; checkout needs
                    // a verified email to attach the transaction to.
                    <Link
                      href={`/register?plan=${plan.slug}`}
                      className={`mt-8 flex h-13 items-center justify-center px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                        plan.is_popular
                          ? "bg-gold text-navy hover:bg-gold/90"
                          : "bg-navy text-navy-foreground hover:bg-navy/90"
                      }`}
                    >
                      Choose {plan.name}
                    </Link>
                  )}
                </PlanCard>
              ))}
            </div>

            <PricingFootnotes
              lodging={prices.lodging}
              subscription={prices.subscription}
            />
          </>
        )}

        <p className="mt-12 text-center text-sm leading-relaxed text-muted-foreground">
          Payment by Paystack, Flutterwave or bank transfer. The annual
          subscription covers amendments on this platform only — lodging a
          revised Will with the registry remains compulsory and is charged
          separately.
        </p>
      </section>
    </>
  );
}
