import { apiMutation } from "@/lib/api/browser";
import { type FormState } from "./state";

/**
 * Phone verification, delegated to the API.
 *
 * The code is generated, hashed, rate-limited and expired server-side, and the
 * SMS is sent from there too. Nothing about the OTP passes through this tier.
 */

export async function sendPhoneCodeAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/phone/send-code", {
    body: { phone: String(formData.get("phone") ?? "").trim() },
    onError: (result) => ({
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    }),
  });
}

export async function confirmPhoneCodeAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/phone/confirm-code", {
    body: { code: String(formData.get("code") ?? "").trim() },
  });
}
