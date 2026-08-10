"use client";

import Link from "next/link";

import { useFormAction } from "@/hooks/use-api-form";
import { registerAction } from "@/lib/actions/auth";
import {
  Field,
  FormBanner,
  PasswordField,
  SubmitButton,
} from "./FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

export function RegisterForm() {
  const [state, action] = useFormAction(registerAction, { refresh: false });

  // On success the account exists but is unverified — show the next step
  // rather than a form the person has no reason to fill in again.
  if (state.status === "success") {
    return (
      <div className="space-y-6">
        <FormBanner state={state} />
        <div className="border border-border bg-surface p-6">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Next step
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Open the message we sent to{" "}
            <span className="font-medium text-navy">{state.data?.email}</span>{" "}
            and follow the confirmation link. It expires in 24 hours.
          </p>
          <Link
            href="/verify-email"
            className="mt-4 inline-block text-sm font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Didn&apos;t receive it? &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      <FormBanner state={state} />

      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        placeholder="Ada Chinelo Okafor"
        required
        errors={state.fieldErrors?.name}
      />
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
        autoComplete="new-password"
        hint="10+ characters"
        withMeter
        errors={state.fieldErrors?.password}
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
      />

      <label className="flex items-start gap-3 pt-1 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="acceptedTerms"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-navy focus:ring-gold"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-navy underline underline-offset-4">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-navy underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {state.fieldErrors?.acceptedTerms && (
        <p className="text-xs text-destructive">
          {state.fieldErrors.acceptedTerms[0]}
        </p>
      )}

      <SubmitButton>Open my account</SubmitButton>
    </StatefulForm>
  );
}
