import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/actions/guards";
import { settlePayment } from "@/lib/actions/payments";

export const metadata: Metadata = {
  title: "Confirming your payment",
  robots: { index: false, follow: false },
};

/**
 * Where Paystack and Flutterwave return the browser after checkout.
 *
 * This page exists because the provider needs somewhere to send a *person*.
 * It is not how the payment is recorded: the webhook posts straight to Laravel
 * and is the authoritative path, so a client who closes the tab still gets
 * their payment. Everything here is a courtesy for the client who does come
 * back — settle if we can, and say something true if we cannot.
 *
 * Never prerendered: it settles money and reads a session.
 */
export const dynamic = "force-dynamic";

/**
 * The two providers name the reference differently, and Paystack sends it
 * twice. Read in order of preference rather than assuming one shape, so a
 * successful payment is never orphaned over a query-string key.
 */
function referenceFrom(params: Record<string, string | string[] | undefined>): string {
  for (const key of ["reference", "trxref", "tx_ref", "txref"]) {
    const value = params[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) return first;
  }

  return "";
}

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // A signed-in session is required: settlement is scoped to the caller, and an
  // anonymous visitor here has nothing to settle.
  await requireUser();

  const params = await searchParams;
  const reference = referenceFrom(params);

  if (!reference) {
    redirect("/dashboard?payment=unknown");
  }

  const state = await settlePayment(reference);

  /*
   * Three outcomes, and the middle one matters most.
   *
   *  - settled  — confirmed against the provider's own record.
   *  - pending  — we could not confirm it in this instant. The user may well
   *               have paid, and the webhook will finish the job. Telling them
   *               it failed would be worse than telling them to wait.
   *  - failed   — the provider says the charge did not complete.
   */
  const outcome =
    state.status === "success"
      ? "success"
      : state.message?.toLowerCase().includes("confirming")
        ? "pending"
        : "failed";

  redirect(`/dashboard?payment=${outcome}`);
}
