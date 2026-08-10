"use client";

import { changePasswordAction } from "@/lib/actions/account.client";
import { useFormAction } from "@/hooks/use-api-form";
import { StatefulForm } from "@/components/forms/StatefulForm";
import {
  FormBanner,
  PasswordField,
  SubmitButton,
} from "@/components/auth/FormControls";

/**
 * Changing a password from inside the account.
 *
 * Distinct from the reset flow, which exists for someone who cannot sign in
 * at all. This one is for the ordinary case — a password that has been shared,
 * reused elsewhere, or simply grown old — and it does not involve email.
 *
 * The current password is required without exception. A session cookie proves
 * a browser, not a person, and this is the single action that can lock the
 * real owner out of their own account.
 *
 * `refresh: false`: nothing on the page reads from a password, so re-fetching
 * the server components would only cost a round trip.
 */
export function PasswordChangeForm() {
  const [state, action] = useFormAction(changePasswordAction, { refresh: false });

  return (
    <StatefulForm state={state} action={action} className="space-y-8" noValidate>
      <FormBanner state={state} />

      <PasswordField
        label="Current password"
        name="current_password"
        autoComplete="current-password"
      />

      <div className="grid gap-8 sm:grid-cols-2">
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          withMeter
        />

        <PasswordField
          label="Confirm new password"
          name="password_confirmation"
          autoComplete="new-password"
        />
      </div>

      <SubmitButton>Change password</SubmitButton>
    </StatefulForm>
  );
}
