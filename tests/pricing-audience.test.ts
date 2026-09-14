import { describe, expect, it } from "vitest";

import { willPlansFor } from "@/lib/pricing/audience";
import type { Plan } from "@/lib/pricing/types";

/** A verified lawyer is offered the professional plan, and nothing else. */

const plan = (slug: string) => ({ slug }) as Plan;

const prices = {
  will: [plan("basic"), plan("premium"), plan("platinum")],
  lawyerWill: [plan("lawyer-will")],
};

describe("willPlansFor", () => {
  it("offers a verified lawyer only the professional plan", () => {
    expect(willPlansFor(prices, "lawyer").map((p) => p.slug)).toEqual(["lawyer-will"]);
  });

  it("offers everyone else the individual plans", () => {
    expect(willPlansFor(prices, "individual").map((p) => p.slug)).toEqual([
      "basic",
      "premium",
      "platinum",
    ]);
    expect(willPlansFor(prices, undefined).map((p) => p.slug)).toEqual([
      "basic",
      "premium",
      "platinum",
    ]);
  });
});
