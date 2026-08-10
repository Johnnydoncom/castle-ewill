"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { adminSignInAction } from "@/lib/actions/auth";
import { Field, FormBanner, PasswordField, SubmitButton } from "./FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

export function AdminLoginForm() {
  const [state, action] = useFormAction(adminSignInAction);
  const needsCode = state.data?.challenge === "totp";

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      <FormBanner state={state} />

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
        </div>
      )}

      <SubmitButton>
        {needsCode ? "Verify and sign in" : "Sign in to console"}
      </SubmitButton>
    </StatefulForm>
  );
}
