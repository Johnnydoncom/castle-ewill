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

/**
 * Consumes the token from the emailed link — but only when this action is
 * actually invoked, i.e. from a real form submission triggered by a click.
 *
 * This must never run as a side effect of merely *loading* the page the link
 * points at. Corporate mail gateways and clients (Outlook Safe Links, Gmail's
 * link proxy, antivirus scanners) routinely issue a GET against every link in
 * an email before a human ever sees it, to check it isn't malicious. A page
 * that consumed a single-use token on render would have it burned by that
 * scan, and the genuine click moments later would see "already used" — which
 * reads exactly like the token expiring instantly. Gating consumption behind
 * an explicit button (`ConfirmEmailForm`) means a passive GET renders the
 * page harmlessly; only a real submission reaches this function.
 */
export async function confirmEmailAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");

  if (!token) {
    return errorState(
      "That confirmation link is missing its token.",
      undefined,
    );
  }

  const result = await api<{
    message?: string;
    data?: { outcome?: VerificationOutcome };
  }>("/auth/email/verify", { method: "POST", body: { token } });

  // A failure of any kind reads as `invalid`. The backend already refuses to
  // distinguish unknown, expired and consumed tokens; collapsing a transport
  // failure into the same bucket keeps that indistinguishable too.
  const outcome = result.ok ? (result.data?.data?.outcome ?? "invalid") : "invalid";
  const message = result.ok
    ? (result.data?.message ?? "")
    : result.message;

  if (outcome === "invalid") {
    return { status: "error", message, data: { outcome } };
  }

  return { status: "success", message, data: { outcome } };
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

type LoginResponse = { data: { user: { id: string; role: "user" | "admin" } } };

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

  const result = await api<LoginResponse>("/auth/login", {
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

  /*
   * An administrator always lands on the console, regardless of what brought
   * them to this form — this is the customer portal's login, and `/dashboard`
   * has nothing for an admin account to do. `requireCustomer()` would bounce
   * them there anyway; deciding it here just skips the extra hop. Anyone else
   * goes to `callbackUrl` when one was given (a path only — an absolute URL
   * here would be an open redirect) or `/dashboard` otherwise.
   */
  const isAdmin = result.data.data.user.role === "admin";
  const target = isAdmin
    ? "/admin"
    : callbackUrl.startsWith("/")
      ? callbackUrl
      : "/dashboard";

  return redirectState(target, "Signed in.", { hard: true });
}

/**
 * The admin console's own sign-in, kept separate from `signInAction` so a
 * customer account is refused here outright rather than quietly landing on
 * the wrong dashboard. Same Sanctum session underneath — Laravel does not
 * have two login endpoints — but a successful authentication that turns out
 * not to belong to an administrator is immediately signed back out, so
 * nothing about this door is a softer version of the customer one.
 */
export async function adminSignInAction(
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

  const result = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password, totp: String(formData.get("totp") ?? "") },
  });

  if (!result.ok) {
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

  console.log("Admin signed in");

  if (result.data.data.user.role != "admin") {
    // The credentials were genuine, so this is not a login failure — but the
    // session just opened is for a customer account, and this door does not
    // hand those out. Revoked immediately rather than left signed in on the
    // console's origin with nowhere sanctioned to go.
    await api("/auth/logout", { method: "POST" });

    return errorState("This sign-in is for administrators only.");
  }

  return redirectState("/admin", "Signed in.", { hard: true });
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
