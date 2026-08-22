"use client";

import { useState } from "react";

import { useFormAction } from "@/hooks/use-api-form";
import { updateAccountAction } from "@/lib/actions/account.client";
import type { Profile } from "@/lib/actions/guards";
import { Field, FormBanner, PasswordField, SubmitButton } from "@/components/auth/FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

/**
 * The account details form.
 *
 * Two forms rather than one, because they are two different acts with two
 * different costs: correcting a misspelt surname should not require a
 * password, and changing a password should not quietly re-save a contact
 * detail alongside it.
 *
 * Both are `StatefulForm`s, so a validation error comes back with the typed
 * values still in the boxes — React resets an uncontrolled form on every
 * settled action, and re-typing an address because a phone number was two
 * digits short is exactly the behaviour that made this worth fixing.
 */
export function AccountDetailsForm({ profile }: { profile: Profile }) {
  const [state, action] = useFormAction(updateAccountAction);

  const {
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    email,
    phone,
  } = profile;

  /*
   * The current-password box appears only once the address is actually being
   * changed. Held in state because the field is conditional: an uncontrolled
   * read of an input that is not rendered has nothing to read.
   */
  const [nextEmail, setNextEmail] = useState(email);
  const changingEmail = nextEmail.trim().toLowerCase() !== email.toLowerCase();

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      <FormBanner state={state} />

      {/*
        Three parts, as on the ID — the same name the identity check is built
        from, so a surname the software has to guess at is a surname it can
        guess wrong.
      */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="First name"
          name="firstName"
          autoComplete="given-name"
          defaultValue={firstName ?? ""}
          required
          errors={state.fieldErrors?.firstName}
        />
        <Field
          label="Surname"
          name="lastName"
          autoComplete="family-name"
          defaultValue={lastName ?? ""}
          required
          errors={state.fieldErrors?.lastName}
        />
      </div>
      <Field
        label="Middle name"
        name="middleName"
        autoComplete="additional-name"
        defaultValue={middleName ?? ""}
        errors={state.fieldErrors?.middleName}
      />

      <div>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={email}
          required
          onChange={(event) => setNextEmail(event.target.value)}
          errors={state.fieldErrors?.email}
        />
        {changingEmail && (
          <p className="mt-2 text-xs leading-relaxed text-gold">
            Changing your address signs you out of nothing, but it does un-confirm
            your email — we will send a fresh confirmation link to the new
            address.
          </p>
        )}
      </div>

      {/*
        Required by the server only when the address is changing. Asking for a
        password to fix a typo in a surname is friction with no security value;
        asking before redirecting where account-recovery mail is delivered is
        the whole defence against a borrowed session becoming a stolen account.
      */}
      {changingEmail && (
        <PasswordField
          label="Current password"
          name="currentPassword"
          autoComplete="current-password"
          hint="Needed to change the address your account recovery goes to"
          errors={state.fieldErrors?.currentPassword}
        />
      )}

      <Field
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={phone ?? ""}
        placeholder="+234 801 234 5678"
        hint="Optional. Changing it un-confirms the number."
        errors={state.fieldErrors?.phone}
      />

      <SubmitButton>Save changes</SubmitButton>
    </StatefulForm>
  );
}
