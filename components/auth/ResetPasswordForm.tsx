"use client";

import Link from "next/link";

import { useFormAction } from "@/hooks/use-api-form";
import { resetPasswordAction } from "@/lib/actions/auth";
import { FormBanner, PasswordField, SubmitButton } from "./FormControls";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormAction(resetPasswordAction, {
    refresh: false,
  });

  if (state.status === "success") {
    return (
      <div className="space-y-6">
        <FormBanner state={state} />
        <Link
          href="/login"
          className="flex h-14 w-full items-center justify-center bg-navy font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormBanner state={state} />
      <input type="hidden" name="token" value={token} />

      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        hint="10+ characters"
        withMeter
        errors={state.fieldErrors?.password}
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton>Change my password</SubmitButton>
    </form>
  );
}
