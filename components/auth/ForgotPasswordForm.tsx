"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/state";
import { Field, FormBanner, SubmitButton } from "./FormControls";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(
    requestPasswordResetAction,
    idleState,
  );

  return (
    <form action={action} className="space-y-6" noValidate>
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
    </form>
  );
}
