import { describe, expect, it } from "vitest";

import { planCardLines } from "@/lib/pricing/breakdown";
import type { PlanKind, PriceQuote, QuoteLine } from "@/lib/pricing/types";

/**
 * A plan card does not list the subscription its plan already includes — the
 * card's own features say "Free Will updates for one year", and saying it
 * again as "Annual subscription · Included" was the same fact twice.
 */

const line = (label: string, kind: PlanKind, isIncluded = false): QuoteLine => ({
  label,
  kind,
  amount_kobo: isIncluded ? 0 : 1,
  amount_formatted: isIncluded ? "₦0.00" : "₦1.00",
  is_included: isIncluded,
  net_kobo: isIncluded ? 0 : 1,
  vat_kobo: 0,
  gross_kobo: isIncluded ? 0 : 1,
});

const quote = (lines: QuoteLine[]) => ({ lines }) as PriceQuote;

describe("planCardLines", () => {
  it("leaves out a subscription the plan includes", () => {
    const lines = planCardLines(
      quote([
        line("Basic", "will"),
        line("Probate Registry lodging", "lodging", true),
        line("Annual subscription", "subscription", true),
      ]),
    );

    expect(lines.map((l) => l.label)).toEqual(["Basic", "Probate Registry lodging"]);
  });

  it("keeps every other included line, which says what the price covers", () => {
    const lines = planCardLines(
      quote([
        line("Premium", "will"),
        line("Probate Registry lodging", "lodging", true),
        line("Solicitor review", "review", true),
        line("Annual subscription", "subscription", true),
      ]),
    );

    expect(lines.map((l) => l.kind)).toEqual(["will", "lodging", "review"]);
  });

  it("keeps a subscription that is charged, because that one is money", () => {
    const lines = planCardLines(
      quote([line("Basic", "will"), line("Annual subscription", "subscription")]),
    );

    expect(lines).toHaveLength(2);
  });

  it("leaves a plan that bundles nothing else with no breakdown to show", () => {
    // The professional plan: the Will, and a year of updates.
    const lines = planCardLines(
      quote([line("Professional", "will"), line("Annual subscription", "subscription", true)]),
    );

    expect(lines.map((l) => l.label)).toEqual(["Professional"]);
  });

  it("has nothing to list when the backend was unreachable", () => {
    expect(planCardLines(undefined)).toEqual([]);
  });
});
