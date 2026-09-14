import type { PriceList, Plan } from "./types";

export type PricingAudience = "individual" | "lawyer";

/**
 * The Will plans an account may buy, by the audience the API gives it.
 *
 * A verified lawyer buys only the professional plan (2026-09-14): offering
 * them Basic, Premium and Platinum put a client's price list in front of a
 * professional, and the backend refuses those slugs for them anyway. Anyone
 * else — an unverified lawyer included, whose enrolment number is still a
 * claim — buys from the individual list, as `User::pricingAudience()` says.
 */
export function willPlansFor(
  prices: Pick<PriceList, "will" | "lawyerWill">,
  audience: PricingAudience | undefined,
): Plan[] {
  return audience === "lawyer" ? prices.lawyerWill : prices.will;
}
