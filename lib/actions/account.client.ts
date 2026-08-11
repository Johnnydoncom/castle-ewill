import { apiMutation } from "@/lib/api/browser";
import { errorState, type FormState } from "./state";

/**
 * Editing one's own account.
 *
 * Nothing is decided here. Which fields may change, what an email change costs
 * and whether a password is correct are all settled server-side — these
 * functions marshal a form into a request and the response back into the
 * `FormState` the forms already render.
 *
 * Both endpoints act on the authenticated account and take no id, so there is
 * nothing here for a caller to forge.
 */

export async function updateAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const phone = String(formData.get("phone") ?? "").trim();

  return apiMutation("/me", {
    method: "PUT",
    body: {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      // An empty box means "remove it", which is a different instruction from
      // "leave it alone" — sent as null rather than as "".
      phone: phone === "" ? null : phone,
      /*
       * Only meaningful when the address is changing, and the server decides
       * whether it was required. Sent whenever it was typed rather than
       * guessing here: this tier does not know the current address well enough
       * to judge, and guessing wrong means either a spurious prompt or a
       * silently rejected save.
       */
      current_password: String(formData.get("currentPassword") ?? "") || null,
    },
    onError: (result) => ({
      status: "error",
      message: result.message,
      fieldErrors: mapFieldErrors(result.fieldErrors),
    }),
  });
}

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  // Checked here for a faster inline message; the server checks it again, and
  // that check is the guarantee.
  if (next !== confirm) {
    return errorState("Please correct the highlighted fields.", {
      confirmPassword: ["Passwords do not match"],
    });
  }

  return apiMutation("/me/password", {
    method: "PUT",
    body: {
      current_password: String(formData.get("currentPassword") ?? ""),
      password: next,
      password_confirmation: confirm,
    },
    onError: (result) => ({
      status: "error",
      message: result.message,
      fieldErrors: mapFieldErrors(result.fieldErrors),
    }),
  });
}

/** Snake_case from the API, camelCase on the form. */
function mapFieldErrors(
  errors: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined {
  if (!errors) return undefined;

  const aliases: Record<string, string> = {
    current_password: "currentPassword",
    password_confirmation: "confirmPassword",
  };

  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [
      aliases[key] ?? key,
      messages,
    ]),
  );
}
