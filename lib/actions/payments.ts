import { apiData, apiMutation } from "@/lib/api/client";
import { errorState, type FormState } from "./state";

/**
 * Payments, delegated to the API.
 *
 * The trust model is unchanged and worth restating, because none of it lives
 * here any more:
 *
 *  - The **price comes from the `plans` table**, never from the form. The
 *    checkout starters (`payments.client.ts`, called directly from the
 *    browser) send a plan slug and a provider; they do not send an amount,
 *    and there is no field they could put one in.
 *  - The **webhook is authoritative**. `settlePayment` below is a convenience
 *    for the returning browser and calls the same idempotent settler — it
 *    stays server-side because the provider redirects back to a Server
 *    Component page, not a form.
 *  - Card details never touch either tier — the provider hosts the form.
 */

export type PaymentRecord = {
  id: string;
  reference: string;
  provider: "paystack" | "flutterwave" | "bank_transfer";
  status: "pending" | "success" | "failed" | "abandoned" | "refunded";
  amount_kobo: number;
  amount_formatted: string;
  currency: string;
  paid_at: string | null;
  created_at: string;
};

export type BankAccount = {
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions: string | null;
  configured: boolean;
};

export async function listUserPayments(): Promise<PaymentRecord[]> {
  return apiData<PaymentRecord[]>("/payments", []);
}

/**
 * One payment and the account to transfer to.
 *
 * Scoped to the caller by the API: another client's reference resolves to null,
 * and the page turns that into a 404. A payment reference is short and quotable,
 * so confirming that one exists would let somebody probe for other people's
 * transactions.
 */
export async function getPaymentByReference(reference: string): Promise<{
  payment: PaymentRecord;
  account: BankAccount;
} | null> {
  return apiData<{ payment: PaymentRecord; account: BankAccount } | null>(
    `/payments/${encodeURIComponent(reference)}`,
    null,
  );
}

/**
 * Settles the payment the browser has just returned from.
 *
 * A 202 means "we could not confirm it in this instant" — not a failure. The
 * webhook will finish the job, so the caller should say so rather than telling
 * someone who has just paid that something went wrong.
 *
 * Called from `app/payments/callback/page.tsx`, a Server Component the
 * provider redirects to — there is no form here for the browser to post
 * directly, so this stays a server-to-server call.
 */
export async function settlePayment(reference: string): Promise<FormState> {
  if (!reference) return errorState("That payment could not be found.");

  return apiMutation("/payments/callback", { body: { reference } });
}
