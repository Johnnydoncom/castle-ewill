/**
 * The price list's shape, shared by both tiers.
 *
 * Types only, and deliberately free of `server-only` — the dashboard's
 * checkout is a client component and needs these to describe a quote it
 * fetched. The half that actually reaches the API lives in `./index.ts`
 * behind the guard, the same split as `lib/auth/password-policy.ts`.
 *
 * The rule these types encode: **no money arithmetic in the browser**. Every
 * amount arrives as a preformatted string composed by `PriceQuoteBuilder`
 * server-side, because Basic's headline ₦40,000 is not what Basic costs, and
 * a page that worked that out for itself could differ from what the gateway
 * charges.
 */

export type PlanKind = "will" | "lodging" | "subscription";

export type Plan = {
  id: string;
  slug: string;
  kind: PlanKind;
  name: string;
  tagline: string | null;
  description: string | null;
  price_kobo: number;
  price_formatted: string;
  /** "per will" / "per annum" — derived from `kind` server-side. */
  charge_suffix: string;
  currency: string;
  features: string[];
  includes_lodging: boolean;
  included_subscription_months: number;
  is_popular: boolean;
  sort_order: number;
  /** Admin listings only; a public caller never receives unpublished rows. */
  is_active?: boolean;
};

export type QuoteLine = {
  label: string;
  kind: PlanKind;
  amount_kobo: number;
  amount_formatted: string;
  /** Absorbed by the plan rather than charged — shown as included, not hidden. */
  is_included: boolean;
};

export type PriceQuote = {
  plan_slug: string;
  plan_name: string;
  lines: QuoteLine[];
  total_kobo: number;
  total_formatted: string;
  currency: string;
  /** Months of free amendments this order grants, from all sources. */
  subscription_months: number;
};

export type PaymentProviders = {
  paystack: boolean;
  flutterwave: boolean;
  bank_transfer: boolean;
};

export type PriceList = {
  /** The tiers a client chooses between. */
  will: Plan[];
  /** Compulsory, per Will. Null when none is published. */
  lodging: Plan | null;
  /** The optional annual add-on. Null when none is published. */
  subscription: Plan | null;
  /** Composed totals keyed by Will-plan slug — render, never recompute. */
  quotes: Record<string, PriceQuote>;
  providers: PaymentProviders;
};
