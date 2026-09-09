import type { Metadata } from "next";
import Link from "next/link";

import { getPriceList } from "@/lib/pricing";
import { PlanCard, PricingFootnotes } from "@/components/pricing/PlanCard";
import { ProfessionalBand } from "@/components/pricing/ProfessionalBand";
import { CheckoutButton } from "@/components/payments/CheckoutButton";
import { COMPANY } from "@/lib/company";
import { currentUser } from "@/lib/actions/guards";

/** Reused for five minutes — see the note on the homepage. */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: "Pricing",
  description:
    "Charged once per Will. Basic ₦40,000; Premium ₦125,000 with a solicitor's review and Probate Registry lodging included; Platinum ₦150,000, which adds a recording of you reading your signed Will. Lodging is optional and charged separately. Lawyers drafting for clients pay ₦10,000 per Will.",
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
            You write your own Will here and print it the same day — a
            solicitor&rsquo;s review is an optional extra, not a gate. No
            subscription is required to make a Will, and no renewal trap. Every
            figure you will pay is shown below, including the Probate
            Registry&rsquo;s own lodging fee, should you ask us to lodge for you.
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
            {/*
              All three tiers in one row: Basic, Premium, Professional.

              The professional rate used to sit in a separate section below,
              which read as an afterthought and made the page's answer to "what
              does this cost?" arrive in two instalments. A lawyer comparing us
              against another platform should see the figure beside the others,
              not after scrolling past them.

              The eligibility rule it carried in that section now rides on the
              card itself — see `badge` — and is enforced where it always was,
              at checkout.
            */}
            {/*
              Individual plans in their own row, the practitioner rate in its
              own section below.

              Not one grid over both. There are three individual plans and one
              lawyer plan, so a single three-column grid leaves a fourth card
              orphaned on a second row — the same dead-cell problem the seven
              stages had. Splitting them is also the more honest layout: the
              professional rate is not a fourth tier an individual might weigh
              up, it is a different product for a different buyer, and it is
              sold through registration rather than a checkout.
            */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

            {prices.lawyerWill.map((plan) => (
              <ProfessionalBand
                key={plan.id}
                plan={plan}
                quote={prices.quotes[plan.slug]}
              />
            ))}

            <PricingFootnotes
              lodging={prices.lodging}
              review={prices.review}
              subscription={prices.subscription}
            />

          </>
        )}

        <p className="mt-12 text-center text-sm leading-relaxed text-muted-foreground">
          Payment by Paystack, Flutterwave or bank transfer. The annual
          subscription covers amendments on this platform only — lodging a
          revised Will with the registry is optional and charged separately.
        </p>
      </section>
    </>
  );
}
