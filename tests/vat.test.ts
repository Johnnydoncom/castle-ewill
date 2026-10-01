import { describe, expect, it } from "vitest";

import { vatPriceNotice, vatRateLabel } from "@/lib/payments/vat";

/**
 * How VAT is worded. The amounts are the server's; these only turn a rate into
 * the sentence a price list carries.
 */
describe("VAT wording", () => {
  it("writes a rate in basis points as a percentage", () => {
    expect(vatRateLabel(750)).toBe("7.5%");
    expect(vatRateLabel(1000)).toBe("10%");
    expect(vatRateLabel(525)).toBe("5.25%");
  });

  it("tells the reader whether the prices contain the VAT or have it added", () => {
    expect(vatPriceNotice({ rate_bps: 750, prices_include_vat: true })).toBe("All prices include 7.5% VAT.");
    expect(vatPriceNotice({ rate_bps: 750, prices_include_vat: false })).toBe(
      "All prices are shown before 7.5% VAT, which is added at checkout.",
    );
  });

  it("says nothing while no VAT is charged", () => {
    expect(vatPriceNotice({ rate_bps: 0, prices_include_vat: true })).toBeNull();
  });
});
