"use client";

import { MailCheck, MailWarning } from "lucide-react";

import { updateAccountAction } from "@/lib/actions/account.client";
import type { Profile } from "@/lib/actions/guards";
import { useFormAction } from "@/hooks/use-api-form";
import { StatefulForm } from "@/components/forms/StatefulForm";
import {
  Field,
  FormBanner,
  PasswordField,
  SubmitButton,
} from "@/components/auth/FormControls";

/**
 * Name, email and phone, editable.
 *
 * Three values, three different consequences to changing them, and the copy
 * says so rather than leaving the user to discover it after saving:
 *
 *  - **Name** is cosmetic here. The legal name on a Will is held on the Will
 *    itself, at the Personal step, and is not touched by this form.
 *  - **Email** is where password-reset and confirmation mail is delivered, so
 *    moving it costs the current password and un-confirms the address.
 *  - **Phone** un-confirms the number, which matters only where the platform
 *    is currently asking for a confirmed one.
 */
export function AccountDetailsForm({ profile }: { profile: Profile }) {
  const [state, action] = useFormAction(updateAccountAction);

  /*
   * Three sources, most-recent first.
   *
   * `values` is the submission just rejected — restoring it is what stops a
   * validation error wiping the form. `data` is the record the API returned
   * on a successful save, used in preference to `profile` because the prop is
   * still the pre-save render for the moment it takes `router.refresh()` to
   * land, and flashing the old surname back at someone who has just corrected
   * it reads as a failed save.
   */
  const saved = state.status === "success" ? state.data : undefined;
  const shown = (name: string, fallback: string): string =>
    state.values?.[name] ?? saved?.[name] ?? fallback;

  /*
   * "Confirmed" describes the address on the *account*, so it must not sit
   * beside an address that has been typed but not saved — after a rejected
   * submission the box holds the new address while the account still holds
   * the old one, and labelling that "Confirmed" is a claim about a mailbox
   * nobody has proved anything about.
   */
  const emailEdited = shown("email", profile.email) !== profile.email;
  const verified = profile.is_email_verified;

  return (
    <StatefulForm state={state} action={action} className="space-y-8" noValidate>
      <FormBanner state={state} />

      <div className="grid gap-8 sm:grid-cols-2">
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          required
          defaultValue={shown("name", profile.name ?? "")}
        />

        <Field
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+234 803 123 4567"
          hint={profile.is_phone_verified ? "Confirmed" : "Optional"}
          defaultValue={shown("phone", profile.phone ?? "")}
        />
      </div>

      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        hint={
          emailEdited
            ? "Needs confirming once saved"
            : verified
              ? "Confirmed"
              : "Not yet confirmed"
        }
        defaultValue={shown("email", profile.email)}
      />

      <div className="border-l-2 border-gold/50 bg-muted/40 px-4 py-3">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          {verified ? (
            <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          ) : (
            <MailWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          )}
          <span>
            Changing your email address signs you out of nothing, but it does
            un-confirm the address: we will send a fresh confirmation link to
            the new one, and password-reset mail goes there from that moment.
            That is why it needs your password.
          </span>
        </p>
      </div>

      <PasswordField
        label="Current password"
        name="current_password"
        autoComplete="current-password"
        hint="Only needed to change your email"
        required={false}
      />

      <SubmitButton>Save changes</SubmitButton>
    </StatefulForm>
  );
}
