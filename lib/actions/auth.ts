"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, passwordSchema } from "@/lib/auth/password";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { rateLimit } from "@/lib/auth/rate-limit";
import { callerKey, recordAudit } from "@/lib/security/audit";
import { sendMail } from "@/lib/mail/mailer";
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from "@/lib/mail/templates";
import { getEnv } from "@/lib/env";
import { newId } from "@/lib/ids";
import {
  errorState,
  successState,
  zodFieldErrors,
  type FormState,
} from "./state";

/* -------------------------------------------------------------------------- */
/*  Registration                                                               */
/* -------------------------------------------------------------------------- */

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(191),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.literal("on", {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = rateLimit(await callerKey("register"), 5, 15 * 60);
  if (!limit.ok) {
    return errorState(
      `Too many sign-up attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    );
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(
      "Please correct the highlighted fields.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id, verified: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Never reveal whether an address is already registered. Both branches
  // return the same message; an existing unverified account simply gets a
  // fresh link, and an existing verified one gets nothing.
  if (existing) {
    if (!existing.verified) {
      await dispatchVerificationEmail(existing.id, name, email);
    }
    return successState(
      "Check your inbox — if that address can be registered, a confirmation link is on its way.",
      { email },
    );
  }

  const userId = newId();
  await db.insert(users).values({
    id: userId,
    name,
    email,
    passwordHash: await hashPassword(password),
    role: "user",
  });

  await recordAudit({
    userId,
    action: "auth.register",
    entityType: "user",
    entityId: userId,
  });

  await dispatchVerificationEmail(userId, name, email);

  return successState(
    "Check your inbox — if that address can be registered, a confirmation link is on its way.",
    { email },
  );
}

async function dispatchVerificationEmail(
  userId: string,
  name: string,
  email: string,
): Promise<void> {
  const { token } = await issueToken(userId, "email_verification");
  const url = `${getEnv().APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const template = verifyEmailTemplate(name, url);
  await sendMail({ to: email, ...template });
}

/* -------------------------------------------------------------------------- */
/*  Email verification                                                         */
/* -------------------------------------------------------------------------- */

export type VerificationOutcome = "verified" | "already" | "invalid";

export async function verifyEmailToken(
  token: string,
): Promise<VerificationOutcome> {
  const userId = await consumeToken(token, "email_verification");
  if (!userId) return "invalid";

  const [user] = await db
    .select({ id: users.id, verifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return "invalid";
  if (user.verifiedAt) return "already";

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId));

  await recordAudit({
    userId,
    action: "auth.email_verified",
    entityType: "user",
    entityId: userId,
  });

  return "verified";
}

export async function resendVerificationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = rateLimit(await callerKey("resend-verification"), 3, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many requests. Please try again shortly.");
  }

  const email = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .safeParse(formData.get("email"));

  if (!email.success) {
    return errorState("Enter a valid email address.");
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, verifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email.data))
    .limit(1);

  if (user && !user.verifiedAt) {
    await dispatchVerificationEmail(
      user.id,
      user.name ?? "there",
      email.data,
    );
  }

  return successState(
    "If that address needs confirming, a new link is on its way.",
  );
}

/* -------------------------------------------------------------------------- */
/*  Password reset                                                             */
/* -------------------------------------------------------------------------- */

export async function requestPasswordResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = rateLimit(await callerKey("reset-request"), 5, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many requests. Please try again shortly.");
  }

  const email = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .safeParse(formData.get("email"));

  if (!email.success) {
    return errorState("Enter a valid email address.", {
      email: ["Enter a valid email address"],
    });
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, status: users.status })
    .from(users)
    .where(eq(users.email, email.data))
    .limit(1);

  if (user && user.status === "active") {
    const { token } = await issueToken(user.id, "password_reset");
    const url = `${getEnv().APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await sendMail({
      to: email.data,
      ...passwordResetTemplate(user.name ?? "there", url),
    });
    await recordAudit({
      userId: user.id,
      action: "auth.password_reset_requested",
      entityType: "user",
      entityId: user.id,
    });
  }

  // Same response either way — the form must not disclose who has an account.
  return successState(
    "If an account exists for that address, a reset link has been sent.",
  );
}

const resetSchema = z
  .object({
    token: z.string().min(1, "This reset link is invalid"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(
      "Please correct the highlighted fields.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const userId = await consumeToken(parsed.data.token, "password_reset");
  if (!userId) {
    return errorState(
      "This reset link has expired or has already been used. Request a new one.",
    );
  }

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      // A successful reset clears any lockout from failed sign-in attempts.
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, userId));

  await recordAudit({
    userId,
    action: "auth.password_reset",
    entityType: "user",
    entityId: userId,
  });

  return successState("Your password has been changed. You can now sign in.");
}

/* -------------------------------------------------------------------------- */
/*  Sign in                                                                    */
/* -------------------------------------------------------------------------- */

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  totp: z.string().optional(),
  callbackUrl: z.string().optional(),
});

/**
 * `redirect()` and a successful `signIn()` both signal control flow by throwing
 * an error carrying a `NEXT_REDIRECT` digest. Detecting it by digest avoids
 * importing from `next/dist/...`, which is private API and moves between
 * releases.
 */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/** Maps the errors thrown by `authorize` onto messages a person can act on. */
function describeSignInError(error: unknown): string {
  const cause = error instanceof Error ? `${error.message}` : "";

  if (cause.includes("EMAIL_NOT_VERIFIED")) {
    return "Please confirm your email address before signing in. Check your inbox for the link.";
  }
  if (cause.includes("ACCOUNT_LOCKED")) {
    return "Too many failed attempts. Your account is locked for 15 minutes.";
  }
  if (cause.includes("ACCOUNT_SUSPENDED")) {
    return "This account has been suspended. Please contact us.";
  }
  if (cause.includes("TWO_FACTOR_UNAVAILABLE")) {
    return "Two-factor authentication is misconfigured on this account. Please contact us.";
  }
  return "Those credentials do not match our records.";
}

export async function signInAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = rateLimit(await callerKey("signin"), 10, 15 * 60);
  if (!limit.ok) {
    return errorState(
      `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    );
  }

  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(
      "Please correct the highlighted fields.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const target =
    parsed.data.callbackUrl && parsed.data.callbackUrl.startsWith("/")
      ? parsed.data.callbackUrl
      : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      totp: parsed.data.totp,
      redirectTo: target,
    });
  } catch (error) {
    // `signIn` signals a successful login by throwing a redirect, which must
    // propagate rather than being reported as a failure.
    if (isRedirectError(error)) throw error;

    const cause = error instanceof Error ? error.message : "";

    // The password was correct; the form needs to collect a code and retry.
    if (cause.includes("TWO_FACTOR_REQUIRED")) {
      return {
        status: "error",
        message: "Enter the six-digit code from your authenticator app.",
        data: { challenge: "totp" },
      };
    }

    if (cause.includes("TWO_FACTOR_INVALID")) {
      return {
        status: "error",
        message:
          "That code was not accepted. Check your device clock and try the current code.",
        data: { challenge: "totp" },
        fieldErrors: { totp: ["Incorrect code"] },
      };
    }

    return errorState(describeSignInError(error));
  }

  redirect(target);
}
