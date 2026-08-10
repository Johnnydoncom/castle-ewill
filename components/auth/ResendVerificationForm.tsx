"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { resendVerificationAction } from "@/lib/actions/auth";
import { Field, FormBanner, SubmitButton } from "./FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

export function ResendVerificationForm({
  defaultEmail,
}: {
  defaultEmail?: string;
}) {
  const [state, action] = useFormAction(resendVerificationAction, {
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
        defaultValue={defaultEmail}
        required
      />
      <SubmitButton>Send a new link</SubmitButton>
    </StatefulForm>
  );
}
