"use client";

import { useState } from "react";

import { useFormAction } from "@/hooks/use-api-form";
import { adminSignInAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/state";
import { Field, FormBanner, PasswordField, SubmitButton } from "./FormControls";
import { isTwoFactorChallenge, TwoFactorChallenge } from "./TwoFactorChallenge";
import { StatefulForm } from "@/components/forms/StatefulForm";

export function AdminLoginForm() {
  const [state, action] = useFormAction(adminSignInAction);

  // The same two steps as the customer sign-in; see LoginForm.
  const [setAside, setSetAside] = useState<FormState | null>(null);
  const challenged = isTwoFactorChallenge(state) && state !== setAside;

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      {!isTwoFactorChallenge(state) && <FormBanner state={state} />}

      {/* Hidden, not removed: the code is sent with these credentials. */}
      <div hidden={challenged} className="space-y-6">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@castlewilltrust.com"
          required
          errors={state.fieldErrors?.email}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          errors={state.fieldErrors?.password}
        />

        {!challenged && <SubmitButton>Sign in to console</SubmitButton>}
      </div>

      {challenged && (
        <TwoFactorChallenge state={state} onBack={() => setSetAside(state)} />
      )}
    </StatefulForm>
  );
}
