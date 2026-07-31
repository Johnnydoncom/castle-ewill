import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  newPaymentReference,
  paystackConfigured,
  verifyWebhookSignature,
} from "@/lib/payments/paystack";

/**
 * The Paystack module reads its secret through `getEnv()`, which caches on
 * first access — the key is set in `tests/setup.ts`, before any import here.
 */
const SECRET = "sk_test_paystack_secret_key_for_tests";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha512", secret).update(body, "utf8").digest("hex");
}

const BODY = JSON.stringify({
  event: "charge.success",
  data: { reference: "CWP-ABC123", amount: 5_500_000, status: "success" },
});

describe("webhook signature verification", () => {
  it("accepts a correctly signed body", () => {
    expect(verifyWebhookSignature(BODY, sign(BODY))).toBe(true);
  });

  it("rejects a body that has been altered after signing", () => {
    const signature = sign(BODY);
    const tampered = BODY.replace("5500000", "1");
    expect(verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it("rejects a signature produced with the wrong secret", () => {
    expect(verifyWebhookSignature(BODY, sign(BODY, "sk_test_wrong"))).toBe(
      false,
    );
  });

  it("rejects a missing signature", () => {
    expect(verifyWebhookSignature(BODY, null)).toBe(false);
    expect(verifyWebhookSignature(BODY, "")).toBe(false);
  });

  it("rejects a signature of the wrong length without throwing", () => {
    // timingSafeEqual throws on length mismatch, so the guard must come first.
    expect(() => verifyWebhookSignature(BODY, "abc")).not.toThrow();
    expect(verifyWebhookSignature(BODY, "abc")).toBe(false);
  });

  it("is sensitive to whitespace, since the raw body is what is signed", () => {
    const signature = sign(BODY);
    const reserialised = JSON.stringify(JSON.parse(BODY), null, 2);
    expect(verifyWebhookSignature(reserialised, signature)).toBe(false);
  });
});

describe("payment references", () => {
  it("produces unique, prefixed references", () => {
    const refs = new Set(Array.from({ length: 500 }, newPaymentReference));
    expect(refs.size).toBe(500);
    for (const ref of refs) expect(ref.startsWith("CWP-")).toBe(true);
  });

  it("produces references safe to place in a URL", () => {
    const ref = newPaymentReference();
    expect(encodeURIComponent(ref)).toBe(ref);
  });
});

describe("configuration", () => {
  it("reports Paystack as configured when a key is present", () => {
    expect(paystackConfigured()).toBe(true);
  });
});
