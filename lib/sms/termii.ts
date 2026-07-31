import "server-only";

import { getEnv } from "@/lib/env";

/**
 * Termii SMS.
 *
 * Same posture as the mailer: with no API key configured, messages are printed
 * to the console so the phone-verification flow works end to end in
 * development. In production a missing key is a hard error — silently dropping
 * a one-time passcode would leave users unable to verify with no signal as to
 * why.
 */

const API = "https://api.ng.termii.com/api/sms/send";

/**
 * Termii expects an international number without a leading `+`.
 * Nigerian numbers are commonly entered as `0803…`, which must become
 * `234803…` rather than being sent as-is.
 */
export function toInternational(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return `234${digits}`;
}

export function smsConfigured(): boolean {
  return Boolean(getEnv().TERMII_API_KEY);
}

export async function sendSms(to: string, message: string): Promise<void> {
  const env = getEnv();
  const destination = toInternational(to);

  if (!env.TERMII_API_KEY) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "TERMII_API_KEY is required in production so that one-time passcodes can be delivered.",
      );
    }

    console.info(
      [
        "",
        "───────────────────────── SMS (dev, not sent) ─────────────────────────",
        `To:      +${destination}`,
        `Message: ${message}`,
        "───────────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      to: destination,
      from: env.TERMII_SENDER_ID,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: env.TERMII_API_KEY,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new Error(
      `Termii send failed (${response.status}): ${payload.message ?? "unknown error"}`,
    );
  }
}
