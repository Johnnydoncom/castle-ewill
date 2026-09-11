import { api } from "@/lib/api/browser";
import { errorState, redirectState, type FormState } from "./state";
import type { PaymentRecord, BankAccount } from "./payments";
import type { PriceQuote } from "@/lib/pricing/types";

/**
 * Payment checkout, started directly from the browser.
 *
 *  - The **price comes from the `plans` table**, never from the form. These
 *    send a plan slug and a provider; they do not send an amount, and there
 *    is no field they could put one in.
 *  - Card details never touch either tier — the provider hosts the form, and
 *    the redirect below leaves our origin entirely.
 */

/** Which optional extras were taken. Mirrors the backend's `PriceOptions`. */
export type PriceOptions = {
  withReview: boolean;
  withSubscription: boolean;
  /**
   * Lodging the executed Will with the Probate Registry.
   *
   * An extra like the others. It used to be added to every quote as a
   * compulsory fee, which made the cheapest route to a finished Will read
   * ₦65,000 when the drafting itself is ₦40,000 — the client decides whether
   * we lodge for them or they do it themselves.
   */
  withLodging: boolean;
};

export const NO_OPTIONS: PriceOptions = {
  withReview: false,
  withSubscription: false,
  withLodging: false,
};

/** The wire shape the API expects. One place, so no key name can drift. */
function optionsToBody(options: PriceOptions) {
  return {
    with_review: options.withReview,
    with_subscription: options.withSubscription,
    with_lodging: options.withLodging,
  };
}

/**
 * The selection, as the API wants it.
 *
 * A slug and some booleans — never an amount, and there is no field the form
 * could put one in. The total is composed server-side by `PriceQuoteBuilder`
 * from the `plans` table.
 */
function selectionFrom(formData: FormData) {
  const willId = String(formData.get("willId") ?? "");

  return {
    plan_slug: String(formData.get("planSlug") ?? ""),
    // Which Will this pays for. Omitted rather than sent empty, so the server
    // falls back to the Will in flight instead of trying to match "".
    ...(willId ? { will_id: willId } : {}),
    ...optionsToBody({
      withReview: formData.get("withReview") === "on",
      withSubscription: formData.get("withSubscription") === "on",
      withLodging: formData.get("withLodging") === "on",
    }),
  };
}

async function startCheckout(formData: FormData): Promise<FormState> {
  const selection = selectionFrom(formData);

  if (!selection.plan_slug) return errorState("Choose a plan to continue.");

  const result = await api<{ data: { checkout_url: string } }>(
    "/payments/checkout",
    {
      method: "POST",
      /*
       * No `provider`. The server names the active gateway in Settings, and
       * sending one here overrides it — which is exactly what went wrong once
       * before: this hard-coded "nomba", so switching the active gateway in
       * the console changed the setting, the screen, and nothing else.
       *
       * The buttons that named a gateway are gone too. On an account with one
       * gateway they sat beside "Pay now" doing the identical thing.
       */
      body: selection,
    },
  );

  if (!result.ok) {
    return errorState(result.message);
  }

  return redirectState(result.data.data.checkout_url);
}

/**
 * What a selection currently comes to.
 *
 * Round-trips to the server on every toggle rather than adding the
 * subscription's price to the plan's in the browser. That would be two lines
 * of arithmetic and one more place for the displayed total to disagree with
 * the charged one.
 */
export async function fetchQuoteAction(
  planSlug: string,
  options: PriceOptions,
): Promise<PriceQuote | null> {
  const result = await api<{ data: PriceQuote }>("/payments/quote", {
    method: "POST",
    body: { plan_slug: planSlug, ...optionsToBody(options) },
  });

  return result.ok ? result.data.data : null;
}

/**
 * The primary checkout.
 *
 * Nomba is the house gateway, so this is what the main button uses. Named for
 * its role rather than its vendor — swapping the primary later should be a
 * change here, not a rename at every call site.
 */
/**
 * The main checkout button.
 *
 * Names no gateway, so the one chosen in Settings is the one that charges.
 */
export async function startCheckoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return startCheckout(formData);
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
  const selection = selectionFrom(formData);

  if (!selection.plan_slug) return errorState("Choose a plan to continue.");

  const result = await api<{
    message: string;
    data: { payment: PaymentRecord; account: BankAccount };
  }>("/payments/bank-transfer", {
    method: "POST",
    body: selection,
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

/**
 * A checkout for something bought on its own for one Will, returning to it.
 *
 * Not a form action: its buttons sit inside other forms and panels. Returns the
 * gateway's address for the caller to leave for, or the reason it could not be
 * opened. `return_to` is a name the server resolves, never an address.
 */
async function startWillCheckout(
  willId: string,
  planSlug: string,
  returnTo: "will_update" | "will",
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const result = await api<{ data: { checkout_url: string } }>("/payments/checkout", {
    method: "POST",
    body: { plan_slug: planSlug, will_id: willId, return_to: returnTo },
  });

  return result.ok
    ? { ok: true, url: result.data.data.checkout_url }
    : { ok: false, message: result.message };
}

/**
 * Pays the lodging fee for an update, from the Will's final step, and comes
 * back to that step — where the identity check then starts by itself.
 */
export function startAmendmentLodgingCheckout(willId: string, planSlug: string) {
  return startWillCheckout(willId, planSlug, "will_update");
}

/**
 * Renews a Will's subscription: what keeps it downloadable once the month of
 * grace after a lapse is over, and what lets it be updated. Comes back to the
 * Will's own page.
 */
export function startSubscriptionRenewalCheckout(willId: string, planSlug: string) {
  return startWillCheckout(willId, planSlug, "will");
}
