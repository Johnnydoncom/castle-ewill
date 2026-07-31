"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { COMPANY } from "@/lib/company";
import { verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/auth/rate-limit";
import { callerKey, recordAudit } from "@/lib/security/audit";
import {
  buildOtpAuthUri,
  formatSecretForDisplay,
  generateTotpSecret,
  verifyTotp,
} from "@/lib/auth/totp";
import { openTotpSecret, sealTotpSecret } from "@/lib/auth/two-factor";
import { currentUser } from "./guards";
import {
  errorState,
  successState,
  zodFieldErrors,
  type FormState,
} from "./state";

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

/**
 * Two-factor enrolment.
 *
 * A secret is generated and stored sealed but *not* activated. Two-factor only
 * switches on once the user proves they can produce a code from it — otherwise
 * a mis-scanned key would lock them out of their own account.
 */
export async function beginTwoFactorSetupAction(): Promise<TwoFactorSetup> {
  const user = await currentUser();
  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const [record] = await db
    .select({ enabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (record?.enabled) {
    return {
      status: "error",
      message: "Two-factor authentication is already switched on.",
    };
  }

  const secret = generateTotpSecret();

  await db
    .update(users)
    .set({ twoFactorSecret: sealTotpSecret(secret), twoFactorEnabled: false })
    .where(eq(users.id, user.id));

  return {
    status: "success",
    message: "Enter the key below into your authenticator app, then confirm with a code.",
    secret,
    formatted: formatSecretForDisplay(secret),
    uri: buildOtpAuthUri({
      secretBase32: secret,
      accountName: user.email,
      issuer: COMPANY.name,
    }),
  };
}

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the six-digit code from your authenticator app"),
});

export async function confirmTwoFactorAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Your session has expired. Sign in again.");

  const limit = rateLimit(await callerKey(`2fa-confirm:${user.id}`), 10, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many attempts. Please wait a few minutes.");
  }

  const parsed = codeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return errorState(
      "Enter the six-digit code from your app.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const [record] = await db
    .select({
      secret: users.twoFactorSecret,
      enabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!record?.secret) {
    return errorState("Start the setup again — no pending key was found.");
  }

  if (!verifyTotp(openTotpSecret(record.secret), parsed.data.code)) {
    return errorState(
      "That code was not accepted. Check your device's clock is correct and try the current code.",
    );
  }

  await db
    .update(users)
    .set({ twoFactorEnabled: true })
    .where(eq(users.id, user.id));

  await recordAudit({
    userId: user.id,
    action: "auth.two_factor_enabled",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/dashboard/settings");

  return successState(
    "Two-factor authentication is on. You will be asked for a code each time you sign in.",
  );
}

const disableSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm"),
});

/**
 * Disabling requires the account password.
 *
 * Turning off a second factor is exactly what someone with a hijacked session
 * would want to do first, so it is gated on something they would not have.
 */
export async function disableTwoFactorAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Your session has expired. Sign in again.");

  const limit = rateLimit(await callerKey(`2fa-disable:${user.id}`), 5, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many attempts. Please wait a few minutes.");
  }

  const parsed = disableSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return errorState(
      "Enter your password to confirm.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const [record] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!(await verifyPassword(parsed.data.password, record?.passwordHash))) {
    return errorState("That password is not correct.");
  }

  await db
    .update(users)
    .set({ twoFactorEnabled: false, twoFactorSecret: null })
    .where(eq(users.id, user.id));

  await recordAudit({
    userId: user.id,
    action: "auth.two_factor_disabled",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/dashboard/settings");

  return successState("Two-factor authentication has been switched off.");
}
