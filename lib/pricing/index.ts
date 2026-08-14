import "server-only";

import { api } from "@/lib/api/client";
import type { Plan, PlanKind, PriceList } from "./types";

export type * from "./types";

const EMPTY: PriceList = {
  will: [],
  lawyerWill: [],
  lodging: null,
  review: null,
  subscription: null,
  quotes: {},
  providers: { nomba: false, paystack: false, flutterwave: false, bank_transfer: true },
};

/**
 * The whole price list, in one request, grouped by kind.
 *
 * One call rather than the two this replaced — the pricing page used to fetch
 * `/plans` twice and still only saw the tiers, never the optional lodging
 * fee that makes up the rest of the bill.
 *
 * Degrades to empty rather than throwing: a momentary backend outage should
 * leave the pricing page saying "our plans are being updated" beside a phone
 * number, not fail the render.
 */
export async function getPriceList(): Promise<PriceList> {
  const result = await api<{
    data: Plan[];
    meta?: { quotes?: PriceList["quotes"]; providers?: PriceList["providers"] };
  }>("/plans", { authenticated: false });

  if (!result.ok) return EMPTY;

  const plans = result.data.data ?? [];
  const ofKind = (kind: PlanKind) => plans.filter((plan) => plan.kind === kind);

  const wills = ofKind("will");

  return {
    // Split so the page can present two price lists rather than one confusing
    // column where ₦10,000 sits beside ₦40,000 with no explanation.
    will: wills.filter((plan) => plan.audience !== "lawyer"),
    lawyerWill: wills.filter((plan) => plan.audience === "lawyer"),
    lodging: ofKind("lodging")[0] ?? null,
    review: ofKind("review")[0] ?? null,
    subscription: ofKind("subscription")[0] ?? null,
    quotes: result.data.meta?.quotes ?? {},
    providers: result.data.meta?.providers ?? EMPTY.providers,
  };
}
