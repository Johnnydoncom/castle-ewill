"use client";

import Link from "next/link";
import { useState } from "react";

import { useFormAction } from "@/hooks/use-api-form";
import { signInAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/state";
import { Field, FormBanner, PasswordField, SubmitButton } from "./FormControls";
import { isTwoFactorChallenge, TwoFactorChallenge } from "./TwoFactorChallenge";
import { StatefulForm } from "@/components/forms/StatefulForm";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  // A successful sign-in changes what every server component renders, so the
  // RSC refresh must happen before the redirect lands.
  const [state, action] = useFormAction(signInAction);

  /*
   * Once the password is accepted for an account with two-factor, the form
   * becomes the code step. "Use a different account" sets aside that one
   * result — the action state itself cannot be reset from here.
   */
  const [setAside, setSetAside] = useState<FormState | null>(null);
  const challenged = isTwoFactorChallenge(state) && state !== setAside;

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      {!isTwoFactorChallenge(state) && <FormBanner state={state} />}
      {callbackUrl && (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      )}

      {/* Hidden, not removed: the code is sent with these credentials. */}
      <div hidden={challenged} className="space-y-6">
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

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs italic text-muted-foreground transition-colors hover:text-navy"
          >
            Forgotten your password?
          </Link>
        </div>

        {!challenged && <SubmitButton>Sign in to dashboard</SubmitButton>}
      </div>

      {challenged && (
        <TwoFactorChallenge state={state} onBack={() => setSetAside(state)} />
      )}
    </StatefulForm>
  );
}
