"use client";

import Link from "next/link";
import { CheckCircle2, MailCheck, MailWarning } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { confirmEmailAction, type VerificationOutcome } from "@/lib/actions/auth";
import { SubmitButton } from "./FormControls";
import { ResendVerificationForm } from "./ResendVerificationForm";

/**
 * Requires an actual click before the token is consumed.
 *
 * Landing on this page from the emailed link must stay a harmless GET — mail
 * gateways and clients routinely prefetch/scan every link in an email before
 * a person ever opens it, and a single-use token consumed by that scan would
 * make the real click a moment later look like the link "expired instantly".
 * Only this form's submission (a POST a scanner never issues) reaches
 * `confirmEmailAction`, so the page itself renders identically however many
 * times it is fetched.
 */
export function ConfirmEmailForm({
  token,
  email,
}: {
  token: string;
  email?: string;
}) {
  const [state, action] = useFormAction(confirmEmailAction, { refresh: false });
  const outcome = state.data?.outcome as VerificationOutcome | undefined;

  if (outcome === "verified" || outcome === "already") {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 border-l-2 border-success bg-success/5 px-4 py-3 text-sm text-navy">
          {outcome === "verified" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : (
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          )}
          <p>
            {outcome === "verified"
              ? "Email address verified."
              : "This address was confirmed previously."}
          </p>
        </div>
        <Link
          href="/login"
          className="flex h-14 w-full items-center justify-center bg-navy font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
        >
          Sign in to your dashboard
        </Link>
      </div>
    );
  }

  if (outcome === "invalid") {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-navy">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>
            Confirmation links expire after 24 hours and can only be used
            once. Request another below.
          </p>
        </div>
        <ResendVerificationForm defaultEmail={email} />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Click below to confirm this is really you.
      </p>
      <SubmitButton>Confirm my email address</SubmitButton>
    </form>
  );
}
