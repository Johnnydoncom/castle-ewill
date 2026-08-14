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
 * server-side. A headline price is not a bill — extras are added, and a plan
 * that bundles one shows it as an included, zero-amount line — so a page that
 * worked the total out for itself could differ from what the gateway charges.
 */

export type PlanKind = "will" | "lodging" | "review" | "subscription";

/**
 * Who a plan is sold to.
 *
 * `both` is most of the list — lodging is a statutory fee and review and the
 * subscription cost what they cost whoever is buying. Only the Will itself is
 * tiered, at ₦40,000 for someone writing their own and ₦10,000 for a verified
 * lawyer drafting for a client.
 *
 * Presentation only. A visitor may *see* the professional rate on the pricing
 * page — that is how a lawyer discovers the platform — but buying at it
 * requires a confirmed enrolment number, enforced server-side at checkout.
 */
export type PlanAudience = "individual" | "lawyer" | "both";

export type Plan = {
  id: string;
  slug: string;
  kind: PlanKind;
  audience: PlanAudience;
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
  /** Premium absorbs the solicitor review; Basic charges for it. */
  includes_review: boolean;
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
  nomba: boolean;
  paystack: boolean;
  flutterwave: boolean;
  bank_transfer: boolean;
};

export type PriceList = {
  /** The tiers an individual chooses between. */
  will: Plan[];
  /**
   * The professional rate, for lawyers drafting on behalf of a client.
   *
   * Advertised publicly and bought only by an account whose Supreme Court
   * enrolment number an administrator has confirmed — the page shows it, the
   * checkout enforces it.
   */
  lawyerWill: Plan[];
  /** Compulsory, per Will. Null when none is published. */
  lodging: Plan | null;
  /** Optional per Will: a solicitor reads the draft. Null when none is published. */
  review: Plan | null;
  /** The optional annual add-on. Null when none is published. */
  subscription: Plan | null;
  /** Composed totals keyed by Will-plan slug — render, never recompute. */
  quotes: Record<string, PriceQuote>;
  providers: PaymentProviders;
};
