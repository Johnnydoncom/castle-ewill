"use client";

import Link from "next/link";

import { useFormAction } from "@/hooks/use-api-form";
import { signInAction } from "@/lib/actions/auth";
import { Field, FormBanner, PasswordField, SubmitButton } from "./FormControls";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  // A successful sign-in changes what every server component renders, so the
  // RSC refresh must happen before the redirect lands.
  const [state, action] = useFormAction(signInAction);

  // The server tells us when the password was accepted but a second factor is
  // still needed, so the code field only appears for accounts that use it.
  const needsCode = state.data?.challenge === "totp";

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormBanner state={state} />
      {callbackUrl && (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      )}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@domain.com"
        required
        errors={state.fieldErrors?.email}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
      />

      {needsCode && (
        <div className="border-l-2 border-gold bg-gold/5 px-4 py-4">
          <Field
            label="Authentication code"
            name="totp"
            type="text"
            hint="6 digits"
            placeholder="123456"
            autoComplete="one-time-code"
            required
            errors={state.fieldErrors?.totp}
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Open your authenticator app and enter the current code for
            {" "}Castle eWill &amp; Trust.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs italic text-muted-foreground transition-colors hover:text-navy"
        >
          Forgotten your password?
        </Link>
      </div>

      <SubmitButton>
        {needsCode ? "Verify and sign in" : "Sign in to dashboard"}
      </SubmitButton>
    </form>
  );
}
