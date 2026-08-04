"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { setBankAccountAction } from "@/lib/actions/review";

type BankAccount = {
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions: string | null;
  configured: boolean;
};

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save bank details"}
    </button>
  );
}

/**
 * The account clients are asked to transfer to.
 *
 * Held in settings rather than in code because correcting an account number is
 * occasionally urgent and must not wait for a deploy. Every change is audited,
 * with the old and new numbers recorded: this is where the firm's money
 * arrives, and a silent edit would be the highest-value change anyone could
 * make in this console.
 */
export function BankAccountForm({ account }: { account: BankAccount }) {
  const [state, action] = useFormAction(setBankAccountAction);

  const field =
    "w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none";
  const labelClass =
    "block font-serif text-[10px] uppercase tracking-[0.28em] text-navy";

  return (
    <form action={action} className="space-y-5">
      {state.status !== "idle" && state.message && (
        <p
          role="status"
          className={`flex items-start gap-2 text-sm ${
            state.status === "success" ? "text-success" : "text-destructive"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="bank-name" className={labelClass}>
            Bank
          </label>
          <input
            id="bank-name"
            name="bankName"
            required
            maxLength={96}
            defaultValue={account.configured ? account.bank_name : ""}
            placeholder="Guaranty Trust Bank"
            className={field}
          />
          {state.fieldErrors?.bankName && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.bankName[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="account-name" className={labelClass}>
            Account name
          </label>
          <input
            id="account-name"
            name="accountName"
            required
            maxLength={191}
            defaultValue={account.account_name}
            className={field}
          />
          {state.fieldErrors?.accountName && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.accountName[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="account-number" className={labelClass}>
          Account number
        </label>
        <input
          id="account-number"
          name="accountNumber"
          required
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          defaultValue={account.configured ? account.account_number : ""}
          placeholder="0123456789"
          className={`${field} font-mono tracking-[0.2em]`}
        />
        <p className="text-[11px] text-muted-foreground">
          Ten digits. Check it twice — this is the number clients will send money
          to.
        </p>
        {state.fieldErrors?.accountNumber && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.accountNumber[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="bank-instructions" className={labelClass}>
          Instructions (optional)
        </label>
        <textarea
          id="bank-instructions"
          name="instructions"
          rows={2}
          maxLength={512}
          defaultValue={account.instructions ?? ""}
          placeholder="Quote your payment reference in the narration."
          className="w-full border border-border bg-transparent px-3 py-2 text-sm text-navy placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
        />
      </div>

      <Submit />
    </form>
  );
}
