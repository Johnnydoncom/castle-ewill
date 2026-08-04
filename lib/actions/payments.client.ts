import { api } from "@/lib/api/browser";
import { errorState, redirectState, type FormState } from "./state";
import type { PaymentRecord, BankAccount } from "./payments";

/**
 * Payment checkout, started directly from the browser.
 *
 *  - The **price comes from the `plans` table**, never from the form. These
 *    send a plan slug and a provider; they do not send an amount, and there
 *    is no field they could put one in.
 *  - Card details never touch either tier — the provider hosts the form, and
 *    the redirect below leaves our origin entirely.
 */

async function startCheckout(
  provider: "paystack" | "flutterwave",
  formData: FormData,
): Promise<FormState> {
  const planSlug = String(formData.get("planSlug") ?? "");

  if (!planSlug) return errorState("Choose a plan to continue.");

  const result = await api<{ data: { checkout_url: string } }>(
    "/payments/checkout",
    { method: "POST", body: { plan_slug: planSlug, provider } },
  );

  if (!result.ok) {
    return errorState(result.message);
  }

  return redirectState(result.data.data.checkout_url);
}

export async function startCheckoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return startCheckout("paystack", formData);
}

export async function startFlutterwaveCheckoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return startCheckout("flutterwave", formData);
}

/**
 * Records an intent to pay by bank transfer.
 *
 * No money moves. The row is created `pending` with a reference the client
 * quotes on the transfer, and an administrator settles it once the funds are
 * seen.
 */
export async function startBankTransferAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const planSlug = String(formData.get("planSlug") ?? "");

  if (!planSlug) return errorState("Choose a plan to continue.");

  const result = await api<{
    message: string;
    data: { payment: PaymentRecord; account: BankAccount };
  }>("/payments/bank-transfer", {
    method: "POST",
    body: { plan_slug: planSlug },
  });

  if (!result.ok) return errorState(result.message);

  return {
    status: "success",
    message: result.data.message,
    data: {
      reference: result.data.data.payment.reference,
      amount: result.data.data.payment.amount_formatted,
      bankName: result.data.data.account.bank_name,
      accountName: result.data.data.account.account_name,
      accountNumber: result.data.data.account.account_number,
    },
  };
}
