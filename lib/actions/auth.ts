import { api, apiMutation } from "@/lib/api/browser";
import { errorState, redirectState, type FormState } from "./state";

/**
 * Authentication, delegated to the Laravel API.
 *
 * Nothing here decides anything. Password policy, account-enumeration
 * resistance, lockout, rate limiting and the second factor all live in the
 * backend; these functions marshal a form into a request and a response back
 * into the `FormState` the forms already render.
 *
 * That is the point of the split: there is exactly one implementation of "may
 * this person sign in", and it is not in the tier that faces the browser.
 */

/* -------------------------------------------------------------------------- */
/*  Registration                                                               */
/* -------------------------------------------------------------------------- */

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  // Checked here purely for a faster inline message. The backend checks it
  // again — this one is a convenience, that one is the guarantee.
  if (password !== confirm) {
    return errorState("Please correct the highlighted fields.", {
      confirmPassword: ["Passwords do not match"],
    });
  }

  return apiMutation("/auth/register", {
    body: {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password,
      password_confirmation: confirm,
      accepted_terms: formData.get("acceptedTerms") === "on",
    },
    onError: (result) => ({
      status: "error",
      message: result.message,
      fieldErrors: mapFieldErrors(result.fieldErrors),
    }),
  });
}

/* -------------------------------------------------------------------------- */
/*  Email verification                                                         */
/* -------------------------------------------------------------------------- */

export type VerificationOutcome = "verified" | "already" | "invalid";

export async function verifyEmailToken(
  token: string,
): Promise<VerificationOutcome> {
  const result = await api<{ data?: { outcome?: VerificationOutcome } }>(
    "/auth/email/verify",
    { method: "POST", body: { token } },
  );

  // A failure of any kind reads as `invalid`. The backend already refuses to
  // distinguish unknown, expired and consumed tokens; collapsing a transport
  // failure into the same bucket keeps that indistinguishable too.
  if (!result.ok) return "invalid";

  return result.data?.data?.outcome ?? "invalid";
}

export async function resendVerificationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/auth/email/resend", {
    body: { email: String(formData.get("email") ?? "") },
  });
}

/* -------------------------------------------------------------------------- */
/*  Password reset                                                             */
/* -------------------------------------------------------------------------- */

export async function requestPasswordResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/auth/password/forgot", {
    body: { email: String(formData.get("email") ?? "") },
  });
}

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password !== confirm) {
    return errorState("Please correct the highlighted fields.", {
      confirmPassword: ["Passwords do not match"],
    });
  }

  return apiMutation("/auth/password/reset", {
    body: {
      token: String(formData.get("token") ?? ""),
      password,
      password_confirmation: confirm,
    },
    onError: (result) => ({
      status: "error",
      message: result.message,
      fieldErrors: mapFieldErrors(result.fieldErrors),
    }),
  });
}

/* -------------------------------------------------------------------------- */
/*  Sign in                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Maps the backend's machine `code` onto a message a person can act on.
 *
 * Laravel is the sole authority on why a sign-in failed — this only
 * translates its verdict into copy, the same way `describeSignInError` used
 * to translate whatever Auth.js's `CredentialsSignin` wrapper let through.
 */
function describeSignInError(code: string | undefined): string {
  switch (code) {
    case "email_not_verified":
      return "Please confirm your email address before signing in. Check your inbox for the link.";
    case "account_locked":
      return "Too many failed attempts. Your account is locked for 15 minutes.";
    case "account_suspended":
      return "This account has been suspended. Please contact us.";
    case "two_factor_unavailable":
      return "Two-factor authentication is misconfigured on this account. Please contact us.";
    case "backend_unreachable":
      return "We could not reach the service just now. Please try again shortly.";
    default:
      return "Those credentials do not match our records.";
  }
}

export async function signInAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return errorState("Please correct the highlighted fields.", {
      ...(email ? {} : { email: ["Enter a valid email address"] }),
      ...(password ? {} : { password: ["Enter your password"] }),
    });
  }

  const callbackUrl = String(formData.get("callbackUrl") ?? "");
  // A path only. An absolute URL here would be an open redirect.
  const target = callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  const result = await api<{ data: { user: { id: string } } }>("/auth/login", {
    method: "POST",
    body: { email, password, totp: String(formData.get("totp") ?? "") },
  });

  if (!result.ok) {
    // The password was correct; the form needs to collect a code and retry.
    if (result.code === "two_factor_required") {
      return {
        status: "error",
        message: "Enter the six-digit code from your authenticator app.",
        data: { challenge: "totp" },
      };
    }

    if (result.code === "two_factor_invalid") {
      return {
        status: "error",
        message:
          "That code was not accepted. Check your device clock and try the current code.",
        data: { challenge: "totp" },
        fieldErrors: { totp: ["Incorrect code"] },
      };
    }

    return errorState(describeSignInError(result.code));
  }

  return redirectState(target, "Signed in.");
}

/**
 * Laravel keys validation errors by snake_case field path; the forms are named
 * in camelCase. Translated here rather than renaming every input, so the API
 * contract and the markup can each keep their own convention.
 */
function mapFieldErrors(
  errors: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined {
  if (!errors) return undefined;

  const aliases: Record<string, string> = {
    password_confirmation: "confirmPassword",
    accepted_terms: "acceptedTerms",
  };

  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [aliases[key] ?? key, messages]),
  );
}
