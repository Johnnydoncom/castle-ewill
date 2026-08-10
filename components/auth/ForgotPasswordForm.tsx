"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { Field, FormBanner, SubmitButton } from "./FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

export function ForgotPasswordForm() {
  // Nothing on this page reflects server state, so skip the RSC refresh.
  const [state, action] = useFormAction(requestPasswordResetAction, {
    refresh: false,
  });

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      <FormBanner state={state} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@domain.com"
        required
        errors={state.fieldErrors?.email}
      />
      <SubmitButton>Send reset link</SubmitButton>
    </StatefulForm>
  );
}
