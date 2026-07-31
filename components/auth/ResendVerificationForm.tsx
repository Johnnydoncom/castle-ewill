"use client";

import { useActionState } from "react";

import { resendVerificationAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/state";
import { Field, FormBanner, SubmitButton } from "./FormControls";

export function ResendVerificationForm({
  defaultEmail,
}: {
  defaultEmail?: string;
}) {
  const [state, action] = useActionState(resendVerificationAction, idleState);

  return (
    <form action={action} className="space-y-6" noValidate>
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
    </form>
  );
}
