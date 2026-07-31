import { describe, expect, it } from "vitest";

import { koboToNaira, nairaToKobo } from "@/lib/payments/flutterwave";

/**
 * Flutterwave denominates in naira while everything here stores kobo, so the
 * conversion at that boundary is the highest-risk line in the integration.
 */
describe("kobo / naira conversion", () => {
  it.each([
    [2_500_000, 25_000],
    [5_500_000, 55_000],
    [15_000_000, 150_000],
  ])("converts %i kobo to %i naira", (kobo, naira) => {
    expect(koboToNaira(kobo)).toBe(naira);
  });

  it("round-trips without loss", () => {
    for (const kobo of [1, 99, 100, 2_500_000, 15_000_000]) {
      expect(nairaToKobo(koboToNaira(kobo))).toBe(kobo);
    }
  });

  it("rounds JSON float noise rather than truncating it", () => {
    // Truncation here would silently lose a kobo on every affected payment.
    expect(nairaToKobo(55_000.000000001)).toBe(5_500_000);
    expect(nairaToKobo(54_999.999999999)).toBe(5_500_000);
    expect(Math.trunc(54_999.999999999 * 100)).not.toBe(5_500_000);
  });

  it("never produces a fractional kobo amount", () => {
    expect(Number.isInteger(nairaToKobo(1234.56))).toBe(true);
    expect(Number.isInteger(nairaToKobo(0.01))).toBe(true);
  });
});
