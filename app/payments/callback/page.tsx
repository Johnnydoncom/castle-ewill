import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getProfile, requireUser } from "@/lib/actions/guards";
import { settlePayment } from "@/lib/actions/payments";
import { destinationAfterPayment } from "@/lib/payments/after-payment";

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

  /*
   * Straight on to the next thing, rather than back to the dashboard.
   *
   * Paying is not the end of anything — it is what unlocks the identity check,
   * and a client who has just paid expects to be taken there rather than
   * returned to a summary page to find the next step themselves. Reported as
   * "I am unable to verify my identity; I expected to be automatically taken
   * to identity verification upon payment."
   *
   * Only on success: a failed or still-confirming payment has unlocked
   * nothing, and sending somebody to a check they cannot complete yet would
   * be worse than saying so plainly.
   */
  if (outcome === "success") {
    const profile = await getProfile();

    /*
     * The lodging fee for an update returns to that update instead, where the
     * identity check picks up without another press.
     */
    redirect(destinationAfterPayment(state.data, profile?.is_kyc_verified ?? false));
  }

  redirect(`/dashboard?payment=${outcome}`);
}
