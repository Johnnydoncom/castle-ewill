import { Check, Minus } from "lucide-react";

import type { Plan, PriceQuote } from "@/lib/pricing/types";

/**
 * One priced tier, with its bill broken out.
 *
 * Shared by the public pricing page and the dashboard checkout so the two can
 * never drift into quoting different figures for the same plan. Every amount
 * rendered here is a preformatted string from the API — this component does
 * no arithmetic, by design.
 *
 * The breakdown is the point of the card. Basic reads ₦40,000 at the top and
 * ₦65,000 at the bottom, and a client who only saw the first number would
 * meet the second at the payment gateway.
 */
export function PlanCard({
  plan,
  quote,
  featured = false,
  badge,
  children,
}: {
  plan: Plan;
  /** Composed server-side. Absent only if the backend was unreachable. */
  quote?: PriceQuote;
  featured?: boolean;
  /**
   * A label across the top of the card, for a plan whose *audience* differs
   * rather than its price.
   *
   * The professional rate used to sit in its own section below the individual
   * plans, with a paragraph beside it carrying that context. In a single row
   * of three there is no such paragraph, so the card has to say who it is for
   * on its own face — otherwise it reads as a third tier anyone may buy, and
   * the first thing a member of the public would learn about the eligibility
   * rule is the checkout refusing them.
   */
  badge?: string;
  /** The call to action — a link on the public page, a form in the dashboard. */
  children?: React.ReactNode;
}) {
  // A single-line quote is just the plan itself; there is nothing to break out.
  const showBreakdown = (quote?.lines.length ?? 0) > 1;

  return (
    <div
      className={`flex flex-col border p-8 ${
        featured
          ? "border-gold bg-card shadow-elegant lg:-translate-y-3"
          : "border-border bg-card"
      }`}
    >
      {/*
        One slot, so the two labels can never stack and knock the three cards
        out of alignment. `featured` wins: "Most chosen" is the one that has to
        catch the eye.
      */}
      {featured ? (
        <span className="mb-5 inline-block self-start bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy">
          Most chosen
        </span>
      ) : badge ? (
        <span className="mb-5 inline-block self-start border border-navy/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy/70">
          {badge}
        </span>
      ) : (
        // Holds the same height as a labelled card so the plan names line up
        // across the row whether or not a card carries a label.
        <span aria-hidden className="mb-5 block h-[25px]" />
      )}

      <h3 className="font-serif text-2xl text-navy">{plan.name}</h3>
      {plan.tagline && (
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      )}

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-serif text-4xl text-navy">
          {plan.price_formatted}
        </span>
        <span className="text-sm text-muted-foreground">
          {plan.charge_suffix}
        </span>
      </div>

      {plan.description && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {plan.description}
        </p>
      )}

      {showBreakdown && quote && (
        <dl className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
          {quote.lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-4">
              <dt
                className={
                  line.is_included ? "text-muted-foreground" : "text-navy/80"
                }
              >
                {line.label}
              </dt>
              <dd className="shrink-0 tabular-nums">
                {line.is_included ? (
                  // Not "₦0.00", which reads as a charge that happened to be
                  // nothing. This line is the plan absorbing a real cost.
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
            <dt className="font-serif text-base text-navy">Total payable</dt>
            <dd className="shrink-0 font-serif text-xl tabular-nums text-navy">
              {quote.total_formatted}
            </dd>
          </div>
        </dl>
      )}

      <ul className="mt-7 flex-1 space-y-3 border-t border-border pt-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="text-navy/85">{feature}</span>
          </li>
        ))}
      </ul>

      {children}
    </div>
  );
}

/**
 * The add-ons, stated plainly.
 *
 * They are not tiers and must not be shown as further cards to choose between
 * — presenting a solicitor's review as though every Will must have one is what
 * this component exists to stop.
 *
 * There was a per-item Required/Optional badge here, with lodging marked
 * "Required" in the destructive colour. Lodging is now the client's own
 * decision — it is paid on to the registry and they may lodge it themselves —
 * so all three are optional and a badge saying so on each would be a constant
 * repeated three times. It is stated once, in the heading, where it reads as a
 * reassurance rather than as three warnings.
 */
export function PricingFootnotes({
  lodging,
  review,
  subscription,
}: {
  lodging: Plan | null;
  review: Plan | null;
  subscription: Plan | null;
}) {
  const notes = [lodging, review, subscription].filter(Boolean) as Plan[];

  if (notes.length === 0) return null;

  return (
    <div className="mt-14 border-t border-border pt-10">
      <div className="flex items-baseline gap-3">
        <h3 className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          Optional extras
        </h3>
        <span className="text-xs text-muted-foreground">
          Added only if you ask for them.
        </span>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((plan) => (
          <div key={plan.id} className="flex gap-4">
            <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/40">
              <Minus className="h-3.5 w-3.5 text-gold" />
            </span>
            <div className="min-w-0">
              <h4 className="font-serif text-lg text-navy">
                {plan.name}
                <span className="ml-2 text-sm text-gold">
                  {plan.price_formatted} {plan.charge_suffix}
                </span>
              </h4>
              {plan.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
