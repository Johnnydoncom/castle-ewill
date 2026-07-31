import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnv } from "@/lib/env";

/**
 * Minimal Paystack client.
 *
 * Only three operations are needed — initialise, verify and webhook signature
 * validation — so this talks to the REST API directly rather than pulling in an
 * SDK. Amounts are always in kobo, matching both Paystack and our own storage.
 */

const API = "https://api.paystack.co";

export type InitialiseResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type VerifiedTransaction = {
  reference: string;
  status: "success" | "failed" | "abandoned" | "pending";
  amountKobo: number;
  currency: string;
  paidAt: Date | null;
  channel: string | null;
  customerEmail: string | null;
  metadata: Record<string, unknown> | null;
};

function secretKey(): string {
  const key = getEnv().PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured. Set it before enabling payments.",
    );
  }
  return key;
}

export function paystackConfigured(): boolean {
  return Boolean(getEnv().PAYSTACK_SECRET_KEY);
}

async function call<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: boolean; message: string; data: T }> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    // Payment state must never be served from a cache.
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data: T;
  };

  if (!response.ok || !payload.status) {
    throw new Error(
      `Paystack ${path} failed (${response.status}): ${payload.message ?? "unknown error"}`,
    );
  }

  return payload;
}

export async function initialiseTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<InitialiseResult> {
  const { data } = await call<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: "NGN",
      metadata: input.metadata,
    }),
  });

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

/**
 * Confirms a transaction against Paystack.
 *
 * This is the only source of truth for whether money moved. The amount is
 * returned so the caller can check it against what was expected — a client
 * that tampers with the amount still cannot under-pay for a plan.
 */
export async function verifyTransaction(
  reference: string,
): Promise<VerifiedTransaction> {
  const { data } = await call<{
    reference: string;
    status: string;
    amount: number;
    currency: string;
    paid_at: string | null;
    channel: string | null;
    customer: { email: string | null } | null;
    metadata: Record<string, unknown> | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  const status: VerifiedTransaction["status"] =
    data.status === "success"
      ? "success"
      : data.status === "failed"
        ? "failed"
        : data.status === "abandoned"
          ? "abandoned"
          : "pending";

  return {
    reference: data.reference,
    status,
    amountKobo: data.amount,
    currency: data.currency,
    paidAt: data.paid_at ? new Date(data.paid_at) : null,
    channel: data.channel,
    customerEmail: data.customer?.email ?? null,
    metadata: data.metadata,
  };
}

/**
 * Validates the `x-paystack-signature` header.
 *
 * Paystack signs the raw request body with HMAC-SHA512 using the secret key.
 * The comparison is constant-time: a fast-failing `===` would leak, byte by
 * byte, how much of a forged signature was correct.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha512", secretKey())
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Opaque, collision-resistant reference carried through to Paystack. */
export function newPaymentReference(): string {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `CWP-${Date.now().toString(36).toUpperCase()}-${random}`;
}
