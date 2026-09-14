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
  provider: "nomba" | "paystack" | "flutterwave" | "bank_transfer";
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

/** One line of an order, as it was quoted when the order was placed. */
export type ReceiptLine = {
  label: string;
  kind: string | null;
  amount_formatted: string;
  /** Covered by the plan at no charge — shown to say so, never added to the total. */
  is_included: boolean;
};

/**
 * A payment as its receipt, as the server composes it.
 *
 * Written from the order as it was placed, so a price edited since does not
 * change it.
 */
export type PaymentReceipt = {
  reference: string;
  status: PaymentRecord["status"];
  amount_kobo: number;
  amount_formatted: string;
  currency: string;
  paid_at: string | null;
  created_at: string;
  description: string;
  lines: ReceiptLine[];
  subscription_months: number;
  /** Taken by itself on a card kept for renewal, rather than at a checkout. */
  automatic_renewal: boolean;
  paid_with: { provider: string; channel: string | null };
  will: { id: string; reference: string; title: string } | null;
  billed_to: { name: string; email: string } | null;
};

/**
 * One payment's receipt.
 *
 * Scoped to the caller by the API: another client's reference resolves to null,
 * and the page turns that into a 404. A payment reference is short and quotable,
 * so confirming that one exists would let somebody probe for other people's
 * transactions.
 */
export async function getPaymentByReference(reference: string): Promise<{
  payment: PaymentRecord;
  receipt: PaymentReceipt;
} | null> {
  return apiData<{ payment: PaymentRecord; receipt: PaymentReceipt } | null>(
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
