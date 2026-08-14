import Link from "next/link";
import { ArrowUpRight, Check, Scale } from "lucide-react";

import type { Plan, PriceQuote } from "@/lib/pricing/types";

/**
 * The practitioner rate, as a full-width horizontal band.
 *
 * It used to be a card in the same three-column grid as the individual plans,
 * and being the only card in its row it rendered at one third width with two
 * thirds of the row empty — the same dead-space problem the seven stages had.
 *
 * Horizontal rather than a fourth column, and the reason is not only that four
 * does not divide into three:
 *
 *  - **It is not a tier.** Basic, Premium and Platinum are rungs of one ladder
 *    a person climbs; ₦10,000 per Will for a solicitor drafting on behalf of a
 *    client is a different product for a different buyer. Sitting it beside
 *    them invites a comparison that misleads in both directions — it looks
 *    like the cheap option, and the ladder looks like it has a bargain rung.
 *  - **It is not bought the same way.** Every other card ends in a checkout;
 *    this one ends in registration, because the rate needs an enrolment number
 *    checked against the roll first. A different action deserves a different
 *    shape.
 *  - **A band reads as an aside**, which is exactly its standing on a page
 *    whose audience is overwhelmingly individuals.
 *
 * Three zones on desktop — identity, what it includes, how to get it — and a
 * plain stack on mobile, where side-by-side would only crush all three.
 */
export function ProfessionalBand({
  plan,
  quote,
}: {
  plan: Plan;
  quote?: PriceQuote;
}) {
  // Composed server-side, like every other figure on this page. The card never
  // adds anything up.
  const total = quote?.total_formatted ?? plan.price_formatted;

  return (
    <section
      aria-labelledby="professional-heading"
      className="mt-16 overflow-hidden border border-border bg-surface"
    >
      <div className="grid gap-px bg-border lg:grid-cols-[0.95fr_1.45fr_0.85fr]">
        {/* Identity and price */}
        <div className="flex flex-col justify-center bg-background p-7 sm:p-9">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
            <Scale className="h-3.5 w-3.5" />
            For legal practitioners
          </span>

          <h3
            id="professional-heading"
            className="mt-4 font-serif text-2xl text-navy sm:text-3xl"
          >
            {plan.name}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>

          {/* `whitespace-nowrap` on the suffix: "per will" was breaking
              across two lines in this narrower column, leaving "will" stranded
              under the price. */}
          <p className="mt-6 font-serif text-3xl text-navy sm:text-4xl">
            {total}
            <span className="ml-2 whitespace-nowrap align-middle font-sans text-sm text-muted-foreground">
              {plan.charge_suffix}
            </span>
          </p>
        </div>

        {/* What it includes */}
        <div className="bg-background p-7 sm:p-9">
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>

          {plan.features.length > 0 && (
            <ul className="mt-6 grid gap-x-8 gap-y-2.5 xl:grid-cols-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-sm text-navy">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* How to get it */}
        <div className="flex flex-col justify-center bg-background p-7 sm:p-9">
          <Link
            href="/register?type=lawyer"
            className="group inline-flex h-13 items-center justify-center gap-2 bg-navy px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            Register as a lawyer
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          </Link>

          {/*
            Said here rather than discovered at checkout. The rate is not
            refused quietly — it simply is not offered until the roll confirms
            the number, and a practitioner deserves to know that before they
            start rather than after.
          */}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Your Supreme Court enrolment number is checked against the roll
            before this rate is applied.
          </p>
        </div>
      </div>
    </section>
  );
}
