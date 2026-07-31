"use server";

import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { notifications, payments, plans, wills } from "@/lib/db/schema";
import type { Payment } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { getEnv } from "@/lib/env";
import { recordAudit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/auth/rate-limit";
import { callerKey } from "@/lib/security/audit";
import {
  initialiseTransaction,
  newPaymentReference,
  paystackConfigured,
  verifyTransaction,
} from "@/lib/payments/paystack";
import {
  flutterwaveConfigured,
  initialisePayment as initialiseFlutterwave,
  verifyByReference as verifyFlutterwave,
} from "@/lib/payments/flutterwave";
import { currentUser, requireAdmin } from "./guards";
import { errorState, successState, type FormState } from "./state";

/**
 * Starts a Paystack checkout.
 *
 * The price is read from the database, never from the form — a posted amount is
 * attacker-controlled, and trusting it would let anyone buy the Estate plan for
 * a naira. The pending payment row is written before redirecting so that a
 * webhook arriving before the user returns still has a record to settle.
 */
export async function startCheckoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Please sign in to continue to payment.");

  if (!paystackConfigured()) {
    return errorState(
      "Online payment is not enabled yet. Please contact us to arrange a bank transfer.",
    );
  }

  const limit = rateLimit(await callerKey(`checkout:${user.id}`), 10, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many attempts. Please wait a few minutes.");
  }

  const planSlug = String(formData.get("planSlug") ?? "");

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.slug, planSlug), eq(plans.isActive, true)))
    .limit(1);

  if (!plan) return errorState("That plan is no longer available.");

  // Attach the payment to the user's active draft, if there is one.
  const [will] = await db
    .select({ id: wills.id })
    .from(wills)
    .where(eq(wills.userId, user.id))
    .orderBy(desc(wills.updatedAt))
    .limit(1);

  const reference = newPaymentReference();

  await db.insert(payments).values({
    id: newId(),
    userId: user.id,
    willId: will?.id ?? null,
    planId: plan.id,
    reference,
    provider: "paystack",
    amountKobo: plan.priceKobo,
    currency: plan.currency,
    status: "pending",
    metadata: { planSlug: plan.slug, planName: plan.name },
  });

  let authorizationUrl: string;
  try {
    const result = await initialiseTransaction({
      email: user.email,
      amountKobo: plan.priceKobo,
      reference,
      callbackUrl: `${getEnv().APP_URL}/api/payments/paystack/callback`,
      metadata: { userId: user.id, planSlug: plan.slug },
    });
    authorizationUrl = result.authorizationUrl;
  } catch (error) {
    console.error("[payments] initialise failed", error);
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.reference, reference));
    return errorState(
      "We could not reach the payment provider. Please try again shortly.",
    );
  }

  await recordAudit({
    userId: user.id,
    action: "payment.initiated",
    entityType: "payment",
    metadata: { reference, planSlug: plan.slug, amountKobo: plan.priceKobo },
  });

  redirect(authorizationUrl);
}

/**
 * Settles a payment against Paystack's own record.
 *
 * Called from both the browser callback and the webhook, so it must be
 * idempotent: an already-successful payment is left untouched and reported as
 * settled rather than being written twice or double-notified.
 */
export async function settlePayment(
  reference: string,
): Promise<{ settled: boolean; status: Payment["status"]; reason?: string }> {
  const [record] = await db
    .select()
    .from(payments)
    .where(eq(payments.reference, reference))
    .limit(1);

  if (!record) {
    return { settled: false, status: "failed", reason: "Unknown reference" };
  }

  if (record.status === "success") {
    return { settled: true, status: "success" };
  }

  // A bank transfer has no provider to ask; it is settled by an administrator.
  if (record.provider === "bank_transfer") {
    return {
      settled: false,
      status: record.status,
      reason: "Bank transfers are confirmed manually",
    };
  }

  const verified =
    record.provider === "flutterwave"
      ? await verifyFlutterwave(reference)
      : await verifyTransaction(reference);

  if (verified.status !== "success") {
    await db
      .update(payments)
      .set({ status: verified.status })
      .where(eq(payments.id, record.id));
    return { settled: false, status: verified.status };
  }

  // Paystack is the source of truth for the amount. A mismatch means the
  // transaction was altered somewhere between our record and the charge.
  if (verified.amountKobo !== record.amountKobo) {
    await db
      .update(payments)
      .set({
        status: "failed",
        metadata: {
          ...(record.metadata as Record<string, unknown> | null),
          amountMismatch: {
            expected: record.amountKobo,
            received: verified.amountKobo,
          },
        },
      })
      .where(eq(payments.id, record.id));

    await recordAudit({
      userId: record.userId,
      action: "payment.amount_mismatch",
      entityType: "payment",
      entityId: record.id,
      metadata: {
        expected: record.amountKobo,
        received: verified.amountKobo,
        reference,
      },
    });

    return {
      settled: false,
      status: "failed",
      reason: "Amount did not match the plan price",
    };
  }

  await db
    .update(payments)
    .set({
      status: "success",
      paidAt: verified.paidAt ?? new Date(),
      metadata: {
        ...(record.metadata as Record<string, unknown> | null),
        channel: verified.channel,
      },
    })
    .where(eq(payments.id, record.id));

  await db.insert(notifications).values({
    id: newId(),
    userId: record.userId,
    type: "payment",
    title: "Payment received",
    body: `We have received your payment of ₦${(record.amountKobo / 100).toLocaleString("en-NG")}. Thank you.`,
    href: "/dashboard",
  });

  await recordAudit({
    userId: record.userId,
    action: "payment.succeeded",
    entityType: "payment",
    entityId: record.id,
    metadata: { reference, amountKobo: record.amountKobo },
  });

  return { settled: true, status: "success" };
}

/**
 * Starts a Flutterwave checkout.
 *
 * Identical trust model to the Paystack flow: the price comes from the `plans`
 * table, the pending row is written before redirecting, and settlement happens
 * only against the provider's own record of the transaction.
 */
export async function startFlutterwaveCheckoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Please sign in to continue to payment.");

  if (!flutterwaveConfigured()) {
    return errorState(
      "Flutterwave is not enabled yet. Please pay by card or bank transfer.",
    );
  }

  const limit = rateLimit(await callerKey(`flw:${user.id}`), 10, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many attempts. Please wait a few minutes.");
  }

  const planSlug = String(formData.get("planSlug") ?? "");

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.slug, planSlug), eq(plans.isActive, true)))
    .limit(1);

  if (!plan) return errorState("That plan is no longer available.");

  const [will] = await db
    .select({ id: wills.id })
    .from(wills)
    .where(eq(wills.userId, user.id))
    .orderBy(desc(wills.updatedAt))
    .limit(1);

  const reference = newPaymentReference();

  await db.insert(payments).values({
    id: newId(),
    userId: user.id,
    willId: will?.id ?? null,
    planId: plan.id,
    reference,
    provider: "flutterwave",
    amountKobo: plan.priceKobo,
    currency: plan.currency,
    status: "pending",
    metadata: { planSlug: plan.slug, planName: plan.name },
  });

  let paymentLink: string;
  try {
    const result = await initialiseFlutterwave({
      email: user.email,
      name: user.name,
      amountKobo: plan.priceKobo,
      reference,
      redirectUrl: `${getEnv().APP_URL}/api/payments/flutterwave/callback`,
      metadata: { userId: user.id, planSlug: plan.slug },
    });
    paymentLink = result.paymentLink;
  } catch (error) {
    console.error("[payments] flutterwave initialise failed", error);
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.reference, reference));
    return errorState(
      "We could not reach Flutterwave. Please try again shortly.",
    );
  }

  await recordAudit({
    userId: user.id,
    action: "payment.initiated",
    entityType: "payment",
    metadata: {
      reference,
      provider: "flutterwave",
      planSlug: plan.slug,
      amountKobo: plan.priceKobo,
    },
  });

  redirect(paymentLink);
}

/**
 * Records an intent to pay by bank transfer.
 *
 * No money moves here — the row is created as `pending` with a reference the
 * client quotes on the transfer, and an administrator settles it once the funds
 * are seen. Returning a redirect rather than a message keeps the flow identical
 * in shape to the card flow.
 */
export async function startBankTransferAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Please sign in to continue.");

  const limit = rateLimit(await callerKey(`transfer:${user.id}`), 10, 15 * 60);
  if (!limit.ok) {
    return errorState("Too many attempts. Please wait a few minutes.");
  }

  const planSlug = String(formData.get("planSlug") ?? "");

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.slug, planSlug), eq(plans.isActive, true)))
    .limit(1);

  if (!plan) return errorState("That plan is no longer available.");

  const [will] = await db
    .select({ id: wills.id })
    .from(wills)
    .where(eq(wills.userId, user.id))
    .orderBy(desc(wills.updatedAt))
    .limit(1);

  const reference = newPaymentReference();

  await db.insert(payments).values({
    id: newId(),
    userId: user.id,
    willId: will?.id ?? null,
    planId: plan.id,
    reference,
    provider: "bank_transfer",
    amountKobo: plan.priceKobo,
    currency: plan.currency,
    status: "pending",
    metadata: { planSlug: plan.slug, planName: plan.name },
  });

  await recordAudit({
    userId: user.id,
    action: "payment.bank_transfer_initiated",
    entityType: "payment",
    metadata: { reference, planSlug: plan.slug, amountKobo: plan.priceKobo },
  });

  redirect(`/dashboard/payments/${reference}`);
}

/**
 * Marks a bank transfer as received.
 *
 * Administrator-only, and deliberately restricted to `bank_transfer`: a card
 * payment must never be settled by hand, because Paystack is the only thing
 * that can say whether money actually moved.
 */
export async function confirmBankTransferAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const reference = String(formData.get("reference") ?? "");

  const [record] = await db
    .select()
    .from(payments)
    .where(eq(payments.reference, reference))
    .limit(1);

  if (!record) return errorState("That payment could not be found.");

  if (record.provider !== "bank_transfer") {
    return errorState(
      "Only bank transfers can be confirmed by hand. Card payments settle from the provider webhook.",
    );
  }

  if (record.status === "success") {
    return successState("That transfer was already confirmed.");
  }

  await db
    .update(payments)
    .set({ status: "success", paidAt: new Date() })
    .where(eq(payments.id, record.id));

  await db.insert(notifications).values({
    id: newId(),
    userId: record.userId,
    type: "payment",
    title: "Bank transfer confirmed",
    body: `We have received your transfer of ₦${(record.amountKobo / 100).toLocaleString("en-NG")}. Thank you.`,
    href: "/dashboard",
  });

  await recordAudit({
    userId: admin.id,
    action: "payment.bank_transfer_confirmed",
    entityType: "payment",
    entityId: record.id,
    metadata: { reference, amountKobo: record.amountKobo },
  });

  revalidatePath("/admin/payments");

  return successState(`Transfer ${reference} confirmed.`);
}

export async function getPaymentByReference(
  reference: string,
  userId: string,
): Promise<Payment | null> {
  const [record] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.reference, reference), eq(payments.userId, userId)))
    .limit(1);
  return record ?? null;
}

export async function listUserPayments(userId: string): Promise<Payment[]> {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}
