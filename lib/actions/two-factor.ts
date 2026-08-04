import { api, apiMutation } from "@/lib/api/browser";
import { type FormState } from "./state";

/**
 * Two-factor enrolment, delegated to the API.
 *
 * The secret is generated, sealed and verified server-side. It crosses this
 * tier exactly once — in the `begin` response, because the user has to type it
 * into their authenticator — and is never stored here, logged, or rendered into
 * anything cached.
 */

/**
 * Result of starting enrolment. A dedicated type rather than `FormState`,
 * whose `data` is a plain string map and cannot carry this shape.
 */
export type TwoFactorSetup =
  | { status: "error"; message: string }
  | {
    status: "success";
    message: string;
    secret: string;
    formatted: string;
    uri: string;
  };

export async function beginTwoFactorSetupAction(): Promise<TwoFactorSetup> {
  const result = await api<{
    message: string;
    data: { secret: string; formatted: string; uri: string };
  }>("/two-factor/begin", { method: "POST" });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return {
    status: "success",
    message: result.data.message,
    secret: result.data.data.secret,
    formatted: result.data.data.formatted,
    uri: result.data.data.uri,
  };
}

export async function confirmTwoFactorAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/two-factor/confirm", {
    body: { code: String(formData.get("code") ?? "").trim() },
  });
}

/**
 * Disabling requires the account password.
 *
 * The check is the backend's — this only carries the field. Turning off a
 * second factor is the first thing someone with a hijacked session would want
 * to do, so it sits behind something a session hijacker does not hold.
 */
export async function disableTwoFactorAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/two-factor/disable", {
    body: { password: String(formData.get("password") ?? "") },
  });
}
