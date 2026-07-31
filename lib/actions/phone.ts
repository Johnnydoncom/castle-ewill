"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { rateLimit } from "@/lib/auth/rate-limit";
import { callerKey, recordAudit } from "@/lib/security/audit";
import { sendSms } from "@/lib/sms/termii";
import { phoneSchema } from "@/lib/will/validation";
import { COMPANY } from "@/lib/company";
import { currentUser } from "./guards";
import {
  errorState,
  successState,
  zodFieldErrors,
  type FormState,
} from "./state";

/**
 * Phone verification, reusing the single-use token machinery already backing
 * email confirmation and password reset. Codes are stored only as hashes and
 * expire after ten minutes.
 */

export async function sendPhoneCodeAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Your session has expired. Sign in again.");

  // Deliberately tight: each SMS costs money and an unbounded endpoint is a
  // way to spend someone else's.
  const limit = rateLimit(await callerKey(`phone-send:${user.id}`), 5, 60 * 60);
  if (!limit.ok) {
    return errorState(
      "Too many codes requested. Please wait an hour before trying again.",
    );
  }

  const parsed = z
    .object({ phone: phoneSchema })
    .safeParse({ phone: formData.get("phone") });

  if (!parsed.success) {
    return errorState(
      "Enter a valid Nigerian phone number.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  // Store the number now but leave it unverified; the code proves ownership.
  await db
    .update(users)
    .set({ phone: parsed.data.phone, phoneVerifiedAt: null })
    .where(eq(users.id, user.id));

  const { token } = await issueToken(user.id, "phone_otp");

  try {
    await sendSms(
      parsed.data.phone,
      `${token} is your ${COMPANY.name} verification code. It expires in 10 minutes. We will never ask you for this code.`,
    );
  } catch (error) {
    console.error("[phone] SMS send failed", error);
    return errorState(
      "We could not send the code just now. Please try again shortly.",
    );
  }

  await recordAudit({
    userId: user.id,
    action: "phone.code_sent",
    entityType: "user",
    entityId: user.id,
  });

  return successState(
    `We have sent a six-digit code to ${parsed.data.phone}.`,
    { phone: parsed.data.phone },
  );
}

export async function confirmPhoneCodeAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Your session has expired. Sign in again.");

  const limit = rateLimit(await callerKey(`phone-confirm:${user.id}`), 10, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many attempts. Please wait a few minutes.");
  }

  const parsed = z
    .object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit code") })
    .safeParse({ code: formData.get("code") });

  if (!parsed.success) {
    return errorState(
      "Enter the six-digit code we sent you.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const userId = await consumeToken(parsed.data.code, "phone_otp");

  // The token is looked up by hash, so a code belonging to a different account
  // must not verify this one.
  if (!userId || userId !== user.id) {
    return errorState(
      "That code was not accepted. It may have expired — request a new one.",
    );
  }

  await db
    .update(users)
    .set({ phoneVerifiedAt: new Date() })
    .where(eq(users.id, user.id));

  await recordAudit({
    userId: user.id,
    action: "phone.verified",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/dashboard/settings");

  return successState("Your phone number has been verified.");
}
