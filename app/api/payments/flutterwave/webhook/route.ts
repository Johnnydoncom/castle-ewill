import { NextResponse } from "next/server";

import { verifyWebhookHash } from "@/lib/payments/flutterwave";
import { settlePayment } from "@/lib/actions/payments";
import { recordAudit } from "@/lib/security/audit";

/**
 * Flutterwave webhook.
 *
 * Flutterwave does not sign its payloads — it echoes the "secret hash" set in
 * the dashboard in the `verif-hash` header. That is a shared bearer value
 * rather than a signature, so it is treated as a gate only: the transaction is
 * re-verified over the API inside `settlePayment()` before anything is settled.
 */
export async function POST(request: Request) {
  if (!verifyWebhookHash(request.headers.get("verif-hash"))) {
    await recordAudit({
      action: "payment.webhook_rejected",
      entityType: "payment",
      metadata: { provider: "flutterwave", reason: "invalid verif-hash" },
    });
    return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
  }

  let event: { event?: string; data?: { tx_ref?: string; status?: string } };
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const reference = event.data?.tx_ref;

  // Flutterwave sends `charge.completed` for both successes and failures; the
  // provider's own verify call decides which it was.
  if (event.event !== "charge.completed" || !reference) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const result = await settlePayment(reference);
    return NextResponse.json(
      { received: true, settled: result.settled },
      { status: 200 },
    );
  } catch (error) {
    console.error("[payments] flutterwave webhook failed", reference, error);
    return NextResponse.json({ error: "Settlement failed" }, { status: 500 });
  }
}
