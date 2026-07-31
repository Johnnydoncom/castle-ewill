import { NextResponse } from "next/server";

import { settlePayment } from "@/lib/actions/payments";
import { getEnv } from "@/lib/env";

/**
 * Browser return leg from Flutterwave.
 *
 * Flutterwave appends `tx_ref` and `status` to the redirect. The `status`
 * parameter is not trusted — it is attacker-controllable — so only `tx_ref` is
 * used, and the outcome is confirmed with Flutterwave before anything is shown.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("tx_ref");
  const dashboard = new URL("/dashboard", getEnv().APP_URL);

  if (!reference) {
    dashboard.searchParams.set("payment", "missing");
    return NextResponse.redirect(dashboard);
  }

  try {
    const result = await settlePayment(reference);
    dashboard.searchParams.set(
      "payment",
      result.settled ? "success" : result.status,
    );
  } catch (error) {
    console.error("[payments] flutterwave callback failed", reference, error);
    dashboard.searchParams.set("payment", "pending");
  }

  return NextResponse.redirect(dashboard);
}
