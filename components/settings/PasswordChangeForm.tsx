"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { changePasswordAction } from "@/lib/actions/account.client";
import {
  FormBanner,
  PasswordField,
  SubmitButton,
} from "@/components/auth/FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

/**
 * Changing a password from inside the account, as distinct from resetting a
 * forgotten one from an emailed token.
 *
 * Separate from the details form deliberately: they are two different acts
 * with two different costs. Correcting a misspelt surname should not demand a
 * password, and changing a password should not quietly re-save a contact
 * detail alongside it.
 *
 * The current password is required without exception — a session cookie is not
 * proof of the person, and this is the one action that can lock the real owner
 * out of their own account.
 */
export function PasswordChangeForm() {
  const [state, action] = useFormAction(changePasswordAction);

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      <FormBanner state={state} />

      <PasswordField
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        errors={state.fieldErrors?.currentPassword}
      />
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        hint="10+ characters"
        withMeter
        errors={state.fieldErrors?.password}
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton>Change password</SubmitButton>
    </StatefulForm>
  );
}
