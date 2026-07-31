import "server-only";

import { timingSafeEqual } from "node:crypto";

import { getEnv } from "@/lib/env";

/**
 * Flutterwave v3 client.
 *
 * Two differences from Paystack matter and are handled here rather than left to
 * callers:
 *
 *  1. Flutterwave denominates amounts in **naira**, not kobo. Everything in
 *     this codebase stores kobo, so conversion happens at the boundary.
 *  2. Flutterwave does not sign its webhooks. It echoes a shared "secret hash"
 *     in the `verif-hash` header, which is weaker than an HMAC and is treated
 *     accordingly — the transaction is always re-verified over the API before
 *     anything is settled.
 */

const API = "https://api.flutterwave.com/v3";

export type FlutterwaveInitResult = {
  paymentLink: string;
  reference: string;
};

export type FlutterwaveVerified = {
  reference: string;
  status: "success" | "failed" | "abandoned" | "pending";
  amountKobo: number;
  currency: string;
  paidAt: Date | null;
  /** Flutterwave's `payment_type`, normalised to match Paystack's `channel`. */
  channel: string | null;
  customerEmail: string | null;
};

function secretKey(): string {
  const key = getEnv().FLUTTERWAVE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "FLUTTERWAVE_SECRET_KEY is not configured. Set it before enabling Flutterwave.",
    );
  }
  return key;
}

export function flutterwaveConfigured(): boolean {
  return Boolean(getEnv().FLUTTERWAVE_SECRET_KEY);
}

/** Kobo is the storage unit; Flutterwave wants naira. */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Converts a naira amount back to kobo.
 *
 * Rounded rather than truncated: Flutterwave returns amounts as JSON numbers,
 * and a value like 55000.000000001 must not become 5_499_999 kobo.
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

async function call<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: string; message: string; data: T }> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    status: string;
    message: string;
    data: T;
  };

  if (!response.ok || payload.status !== "success") {
    throw new Error(
      `Flutterwave ${path} failed (${response.status}): ${payload.message ?? "unknown error"}`,
    );
  }

  return payload;
}

export async function initialisePayment(input: {
  email: string;
  name?: string;
  amountKobo: number;
  reference: string;
  redirectUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<FlutterwaveInitResult> {
  const { data } = await call<{ link: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: input.reference,
      amount: koboToNaira(input.amountKobo),
      currency: "NGN",
      redirect_url: input.redirectUrl,
      customer: { email: input.email, name: input.name },
      meta: input.metadata,
      customizations: {
        title: "Castle eWill & Trust",
        description: "Will preparation",
      },
    }),
  });

  return { paymentLink: data.link, reference: input.reference };
}

export async function verifyByReference(
  reference: string,
): Promise<FlutterwaveVerified> {
  const { data } = await call<{
    tx_ref: string;
    status: string;
    amount: number;
    currency: string;
    created_at: string | null;
    payment_type: string | null;
    customer: { email: string | null } | null;
  }>(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
  );

  const status: FlutterwaveVerified["status"] =
    data.status === "successful"
      ? "success"
      : data.status === "failed"
        ? "failed"
        : data.status === "cancelled"
          ? "abandoned"
          : "pending";

  return {
    reference: data.tx_ref,
    status,
    amountKobo: nairaToKobo(data.amount),
    currency: data.currency,
    paidAt: data.created_at ? new Date(data.created_at) : null,
    channel: data.payment_type ?? null,
    customerEmail: data.customer?.email ?? null,
  };
}

/**
 * Compares the `verif-hash` header against the configured secret hash.
 *
 * Constant-time, and refuses outright when no hash is configured — an
 * unauthenticated webhook that settles payments would be worse than no webhook.
 */
export function verifyWebhookHash(received: string | null): boolean {
  const expected = getEnv().FLUTTERWAVE_SECRET_HASH;
  if (!expected || !received) return false;

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
