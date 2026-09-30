"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import {
  startBankTransferAction,
  startReactivationCheckoutAction,
} from "@/lib/actions/payments.client";
import { signOutAction } from "@/lib/actions/session";
import type { PriceQuote } from "@/lib/pricing/types";

function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-13 w-full items-center justify-center gap-3 bg-gold px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Redirecting…" : label}
    </button>
  );
}

function LinkButton({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-navy disabled:opacity-60"
    >
      {pending ? busy : label}
    </button>
  );
}

/**
 * Paying the reactivation fee.
 *
 * The amount is the server's quote (`PriceQuoteBuilder`), rendered and never
 * worked out here. A card payment reactivates the account the moment the
 * gateway confirms it; a transfer does once Castle has seen the money.
 */
export function ReactivationCheckout({ quote }: { quote: PriceQuote }) {
  const [cardState, card] = useFormAction(startReactivationCheckoutAction);
  const [transferState, transfer] = useFormAction(startBankTransferAction);
  const [, signOut] = useFormAction(signOutAction);

  const error = [cardState, transferState].find((state) => state.status === "error")?.message;
  const transferDetails =
    transferState.status === "success" ? (transferState.data as Record<string, string> | undefined) : undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between border-y border-border py-5">
        <span className="text-sm text-muted-foreground">{quote.plan_name}</span>
        <span className="font-serif text-3xl text-navy">{quote.total_formatted}</span>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <form action={card}>
        <input type="hidden" name="planSlug" value={quote.plan_slug} />
        <PayButton label={`Pay ${quote.total_formatted} and reactivate`} />
      </form>

      {transferDetails ? (
        <div className="space-y-2 border border-border bg-surface p-5 text-sm text-navy">
          <p className="font-medium">Pay by bank transfer</p>
          <p className="text-muted-foreground">
            Send {transferDetails.amount} to the account below, quoting{" "}
            <span className="font-mono text-navy">{transferDetails.reference}</span>. Your
            account is reactivated once we have confirmed the transfer.
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pt-2">
            <dt className="text-muted-foreground">Bank</dt>
            <dd>{transferDetails.bankName}</dd>
            <dt className="text-muted-foreground">Account name</dt>
            <dd>{transferDetails.accountName}</dd>
            <dt className="text-muted-foreground">Account number</dt>
            <dd className="font-mono">{transferDetails.accountNumber}</dd>
          </dl>
        </div>
      ) : (
        <form action={transfer} className="text-center">
          <input type="hidden" name="planSlug" value={quote.plan_slug} />
          <LinkButton label="Pay by bank transfer instead" busy="Preparing…" />
        </form>
      )}

      <form action={signOut} className="border-t border-border pt-6 text-center">
        <LinkButton label="Sign out" busy="Signing out…" />
      </form>
    </div>
  );
}
