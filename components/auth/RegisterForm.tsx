"use client";

import Link from "next/link";
import { useState } from "react";

import { useFormAction } from "@/hooks/use-api-form";
import { registerAction } from "@/lib/actions/auth";
import {
  Field,
  FormBanner,
  PasswordField,
  SubmitButton,
} from "./FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

type AccountType = "individual" | "lawyer";

const ACCOUNT_TYPES: ReadonlyArray<{
  value: AccountType;
  label: string;
  blurb: string;
}> = [
  {
    value: "individual",
    label: "Individual",
    blurb: "I am writing my own Will.",
  },
  {
    value: "lawyer",
    label: "Lawyer",
    blurb: "I draft Wills for my clients.",
  },
];

export function RegisterForm({
  initialAccountType = "individual",
}: {
  initialAccountType?: AccountType;
} = {}) {
  const [state, action] = useFormAction(registerAction, { refresh: false });

  /*
   * Held in state rather than read off the DOM, because the enrolment field
   * only exists while "Lawyer" is chosen and an uncontrolled read would have
   * nothing to read. Seeded from the last submission so a validation error
   * does not silently drop someone back to "Individual" and take their
   * enrolment number with it.
   */
  const [accountType, setAccountType] = useState<AccountType>(
    state.values?.accountType === "lawyer" ? "lawyer" : initialAccountType,
  );

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

      <fieldset>
        <legend className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          I am registering as
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ACCOUNT_TYPES.map((option) => {
            const selected = accountType === option.value;
            return (
              <label
                key={option.value}
                className={`cursor-pointer border p-4 transition-colors ${
                  selected
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-navy/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="accountType"
                    value={option.value}
                    checked={selected}
                    onChange={() => setAccountType(option.value)}
                    className="h-4 w-4 border-border text-navy focus:ring-gold"
                  />
                  <span className="text-sm font-medium text-navy">
                    {option.label}
                  </span>
                </span>
                <span className="mt-2 block pl-7 text-xs leading-relaxed text-muted-foreground">
                  {option.blurb}
                </span>
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.accountType && (
          <p className="mt-2 text-xs text-destructive">
            {state.fieldErrors.accountType[0]}
          </p>
        )}
      </fieldset>

      {accountType === "lawyer" && (
        <div className="border-l-2 border-gold/60 pl-4">
          <Field
            label="Supreme Court enrolment number"
            name="enrolmentNumber"
            placeholder="SCN123456"
            required
            errors={state.fieldErrors?.enrolmentNumber}
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            We check this against the roll by hand before the professional rate
            applies. Until then your account works exactly like an
            individual&apos;s — you can start drafting straight away.
          </p>
        </div>
      )}

      {/*
        Three parts, as on the ID.
        
        This is the name the identity check is built from later, and a surname
        the software has to guess at is a surname it can guess wrong — a failed
        check on a perfectly good document. `autoComplete` is split to match, so
        a browser still fills all three.
      */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="First name"
          name="firstName"
          autoComplete="given-name"
          placeholder="Ada"
          required
          errors={state.fieldErrors?.firstName}
        />
        <Field
          label="Surname"
          name="lastName"
          autoComplete="family-name"
          placeholder="Okafor"
          required
          errors={state.fieldErrors?.lastName}
        />
      </div>
      <Field
        label="Middle name"
        name="middleName"
        autoComplete="additional-name"
        placeholder="Optional"
        errors={state.fieldErrors?.middleName}
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
