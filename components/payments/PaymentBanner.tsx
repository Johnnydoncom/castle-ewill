import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

/**
 * Renders the outcome carried back on `?payment=` after a Paystack redirect.
 * Purely presentational — the payment record itself was settled server-side
 * before this page rendered.
 */
export function PaymentBanner({ outcome }: { outcome?: string }) {
  if (!outcome) return null;

  const config: Record<
    string,
    { tone: "success" | "error" | "info"; text: string }
  > = {
    success: {
      tone: "success",
      text: "Payment received. Thank you — your receipt is in your payment history below.",
    },
    pending: {
      tone: "info",
      text: "Your payment is still being confirmed. This page will show it as soon as it settles.",
    },
    failed: {
      tone: "error",
      text: "That payment did not go through. No money has left your account — you can try again.",
    },
    abandoned: {
      tone: "error",
      text: "The payment was not completed. You can start it again whenever you are ready.",
    },
    missing: {
      tone: "error",
      text: "We could not identify that payment. If money has left your account, contact us and we will trace it.",
    },
  };

  const entry = config[outcome];
  if (!entry) return null;

  const Icon =
    entry.tone === "success"
      ? CheckCircle2
      : entry.tone === "info"
        ? Clock
        : AlertCircle;

  const classes =
    entry.tone === "success"
      ? "border-success bg-success/5"
      : entry.tone === "info"
        ? "border-gold bg-gold/5"
        : "border-destructive bg-destructive/5";

  const iconClass =
    entry.tone === "success"
      ? "text-success"
      : entry.tone === "info"
        ? "text-gold"
        : "text-destructive";

  return (
    <div
      role="status"
      className={`flex items-start gap-3 border-l-2 px-5 py-4 text-sm text-navy ${classes}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
      <p className="leading-relaxed">{entry.text}</p>
    </div>
  );
}
