import { describe, expect, it } from "vitest";

import { destinationAfterPayment } from "@/lib/payments/after-payment";
import { stepByNumber } from "@/lib/will/steps";

/**
 * Where a client lands once a payment settles.
 *
 * The lodging fee for an update must bring them back to that update's final
 * step, where the identity check starts by itself. Everything else goes on to
 * the next thing owed, as before.
 */
describe("after a payment settles", () => {
  it("returns the client to the final step of the update they paid lodging for", () => {
    const url = new URL(
      destinationAfterPayment({ return_to: "will_update", will_id: "01a0-will" }, true),
      "https://castlewilltrust.com",
    );

    expect(url.pathname).toBe("/dashboard/wills/01a0-will/edit");
    expect(url.searchParams.get("lodging")).toBe("paid");
    expect(stepByNumber(Number(url.searchParams.get("step")))?.slug).toBe("review");
  });

  it("returns the client to the Will they renewed", () => {
    expect(destinationAfterPayment({ return_to: "will", will_id: "01a0-will" }, true)).toBe(
      "/dashboard/wills/01a0-will?payment=success",
    );
  });

  it("takes everybody else to the next thing owed", () => {
    expect(destinationAfterPayment({ status: "success" }, true)).toBe(
      "/dashboard/wills?payment=success",
    );
    expect(destinationAfterPayment(undefined, false)).toBe(
      "/dashboard/kyc?payment=success",
    );
  });

  it("goes nowhere it was not told to", () => {
    expect(destinationAfterPayment({ return_to: "will_update", will_id: null }, true)).toBe(
      "/dashboard/wills?payment=success",
    );
    expect(
      destinationAfterPayment({ return_to: "https://example.com", will_id: "x" }, true),
    ).toBe("/dashboard/wills?payment=success");
  });
});
