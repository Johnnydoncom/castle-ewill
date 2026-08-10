"use client";

import { apiMutation } from "@/lib/api/browser";
import { errorState, type FormState } from "./state";

/**
 * The client's own account details.
 *
 * Browser-direct, like every other mutation: the session cookie and the CSRF
 * token both belong to Laravel's origin, and the password typed into the
 * change-password form has no reason to transit this Next server.
 *
 * Validation here is for feedback only. Every rule below is enforced again in
 * `UpdateAccountRequest` / `ChangePasswordRequest`, which are the guarantee —
 * including the one that matters most, that redirecting the account's email
 * costs the current password.
 */

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function updateAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();

  if (name.length < 2) {
    return errorState("Check the details below.", {
      name: ["Enter your full name."],
    });
  }

  const currentPassword = text(formData, "current_password");

  return apiMutation("/me", {
    method: "PUT",
    body: {
      name,
      email,
      phone: text(formData, "phone"),
      // Omitted entirely rather than sent empty, so the backend's
      // "required when the address is changing" rule reads a missing field
      // rather than a blank one.
      ...(currentPassword ? { current_password: currentPassword } : {}),
    },
  });
}

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = text(formData, "password");
  const confirmation = text(formData, "password_confirmation");

  if (password !== confirmation) {
    return errorState("Check the details below.", {
      password_confirmation: ["Passwords do not match."],
    });
  }

  return apiMutation("/me/password", {
    method: "PUT",
    body: {
      current_password: text(formData, "current_password"),
      password,
      password_confirmation: confirmation,
    },
  });
}
