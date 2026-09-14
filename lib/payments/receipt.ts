import type { PaymentReceipt } from "@/lib/actions/payments";

/**
 * How a receipt reads — kept apart from the page so the wording is tested
 * without rendering it.
 *
 * Nothing here decides anything about money: the status, the lines and the
 * total are the server's, as recorded when the order was placed.
 */

export type ReceiptStanding = {
  tone: "paid" | "pending" | "unpaid" | "refunded";
  kicker: string;
  title: string;
  badge: string;
  /** A sentence under the amount, where the status needs one. */
  note: string | null;
};

export function receiptStanding(status: PaymentReceipt["status"]): ReceiptStanding {
  switch (status) {
    case "success":
      return { tone: "paid", kicker: "Receipt", title: "Payment receipt", badge: "Paid", note: null };
    case "pending":
      return {
        tone: "pending",
        kicker: "Payment record",
        title: "Payment pending",
        badge: "Awaiting confirmation",
        note: "This payment has not been confirmed yet. If you completed it, this page updates as soon as it is.",
      };
    case "refunded":
      return {
        tone: "refunded",
        kicker: "Payment record",
        title: "Payment refunded",
        badge: "Refunded",
        note: "This payment was refunded.",
      };
    default:
      return {
        tone: "unpaid",
        kicker: "Payment record",
        title: "Payment not completed",
        badge: "Not completed",
        note: "This payment did not go through, so there is no receipt for it. You can try again from your Will's page.",
      };
  }
}

/** "Card via Flutterwave", or the gateway alone when it did not say how. */
export function paidWith(receipt: Pick<PaymentReceipt, "paid_with">): string {
  const { provider, channel } = receipt.paid_with;

  if (!channel || channel.toLowerCase() === provider.toLowerCase()) return provider;

  return `${channel} via ${provider}`;
}

/** The notes under the items: what the payment added to the Will, and how it was taken. */
export function receiptNotes(
  receipt: Pick<PaymentReceipt, "status" | "subscription_months" | "automatic_renewal" | "will">,
): string[] {
  const notes: string[] = [];

  if (receipt.status === "success" && receipt.subscription_months > 0 && receipt.will) {
    const period =
      receipt.subscription_months === 12
        ? "a year"
        : `${receipt.subscription_months} month${receipt.subscription_months === 1 ? "" : "s"}`;

    notes.push(`Adds ${period} of subscription to ${receipt.will.reference}.`);
  }

  if (receipt.automatic_renewal) {
    notes.push("Taken automatically, on the card kept for renewal.");
  }

  return notes;
}

/** "14 September 2026, 12:40" — in Lagos, the same on the server and in the browser. */
export function receiptDate(iso: string): string {
  const moment = new Date(iso);

  const date = moment.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const time = moment.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Lagos",
  });

  return `${date}, ${time}`;
}
