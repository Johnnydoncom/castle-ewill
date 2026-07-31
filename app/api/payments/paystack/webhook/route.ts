import { NextResponse } from "next/server";

import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { settlePayment } from "@/lib/actions/payments";
import { recordAudit } from "@/lib/security/audit";

/**
 * Paystack webhook.
 *
 * The signature is computed over the *raw* request body, so the body is read as
 * text and only parsed after the signature checks out. Parsing first and
 * re-serialising would change byte-for-byte formatting and break verification.
 *
 * Webhooks are retried on any non-2xx response, so this endpoint returns 200
 * for anything it has definitively handled — including events it chooses to
 * ignore — and reserves non-2xx for cases where a retry might genuinely help.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    await recordAudit({
      action: "payment.webhook_rejected",
      entityType: "payment",
      metadata: { reason: "invalid signature" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    // A malformed body will not become valid on retry.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const reference = event.data?.reference;

  if (event.event !== "charge.success" || !reference) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const result = await settlePayment(reference);
    return NextResponse.json(
      { received: true, settled: result.settled },
      { status: 200 },
    );
  } catch (error) {
    console.error("[payments] webhook settlement failed", reference, error);
    // A transient database or Paystack failure is worth a retry.
    return NextResponse.json(
      { error: "Settlement failed" },
      { status: 500 },
    );
  }
}
