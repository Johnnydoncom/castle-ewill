"use client";

import Link from "next/link";
import { CheckCircle2, MailWarning } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { restoreAccountAction } from "@/lib/actions/auth";
import { SubmitButton } from "./FormControls";

/**
 * Reopens a closed account — but only on a click.
 *
 * Landing here from the emailed link stays a harmless GET, for the reason
 * `ConfirmEmailForm` gives: mail scanners open links before people do, and a
 * single-use token spent by one would make the client's own click fail. Only
 * this form's submission reaches the API.
 */
export function RestoreAccountForm({ token }: { token: string }) {
  const [state, action] = useFormAction(restoreAccountAction, { refresh: false });

  if (state.status === "success") {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 border-l-2 border-success bg-success/5 px-4 py-3 text-sm text-navy">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p>{state.message}</p>
        </div>
        <Link
          href="/login"
          className="flex h-14 w-full items-center justify-center bg-navy font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
        >
          Sign in to your account
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-navy">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>{state.message}</p>
        </div>
        <Link
          href="/contact"
          className="flex h-14 w-full items-center justify-center border border-navy font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-navy/5"
        >
          Contact us
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li>Your Will and the documents in your vault come back as you left them.</li>
        <li>You sign in with the password you had before.</li>
        <li>
          If you used automatic renewal, turn it on again from your Will — we
          removed your saved card when you closed the account.
        </li>
      </ul>
      <SubmitButton>Reopen my account</SubmitButton>
    </form>
  );
}
