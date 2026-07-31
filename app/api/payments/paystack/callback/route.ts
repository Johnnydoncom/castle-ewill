import { NextResponse } from "next/server";

import { settlePayment } from "@/lib/actions/payments";
import { getEnv } from "@/lib/env";

/**
 * Browser return leg from Paystack.
 *
 * This is a convenience for the user, not the authority on payment: the
 * webhook is. Anyone can navigate here with any reference, so the outcome is
 * always confirmed with Paystack before anything is shown or recorded.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");
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
    console.error("[payments] callback settlement failed", reference, error);
    dashboard.searchParams.set("payment", "pending");
  }

  return NextResponse.redirect(dashboard);
}
