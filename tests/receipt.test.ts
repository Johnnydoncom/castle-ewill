import { describe, expect, it } from "vitest";

import { paidWith, receiptDate, receiptNotes, receiptStanding } from "@/lib/payments/receipt";

/**
 * How a payment's receipt reads. The figures are the server's; these only
 * word them.
 */
describe("a payment receipt", () => {
  it("is a receipt only once the payment is paid", () => {
    expect(receiptStanding("success")).toMatchObject({ tone: "paid", title: "Payment receipt", badge: "Paid", note: null });
    expect(receiptStanding("pending")).toMatchObject({ tone: "pending", badge: "Awaiting confirmation" });
    expect(receiptStanding("failed")).toMatchObject({ tone: "unpaid", title: "Payment not completed" });
    expect(receiptStanding("abandoned").tone).toBe("unpaid");
    expect(receiptStanding("refunded")).toMatchObject({ tone: "refunded", badge: "Refunded" });
  });

  it("names how it was paid without repeating itself", () => {
    expect(paidWith({ paid_with: { provider: "Flutterwave", channel: "Card" } })).toBe("Card via Flutterwave");
    expect(paidWith({ paid_with: { provider: "Flutterwave", channel: null } })).toBe("Flutterwave");
    expect(paidWith({ paid_with: { provider: "Bank transfer", channel: "Bank transfer" } })).toBe("Bank transfer");
  });

  it("notes the subscription a paid order added, and a renewal taken by itself", () => {
    const will = { id: "w1", reference: "CW-2026-D1D5C8", title: "Last Will" };

    expect(receiptNotes({ status: "success", subscription_months: 12, automatic_renewal: false, will })).toEqual([
      "Adds a year of subscription to CW-2026-D1D5C8.",
    ]);
    expect(receiptNotes({ status: "success", subscription_months: 6, automatic_renewal: true, will })).toEqual([
      "Adds 6 months of subscription to CW-2026-D1D5C8.",
      "Taken automatically, on the card kept for renewal.",
    ]);
    // Nothing was added by a payment that did not go through.
    expect(receiptNotes({ status: "failed", subscription_months: 12, automatic_renewal: false, will })).toEqual([]);
  });

  it("dates it in Lagos", () => {
    // 23:30 UTC on the 13th is 00:30 on the 14th in Lagos.
    expect(receiptDate("2026-09-13T23:30:00+00:00")).toBe("14 September 2026, 00:30");
  });
});
