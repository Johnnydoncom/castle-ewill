import { randomUUID, randomBytes } from "node:crypto";

/** RFC 4122 v4 identifier used as the primary key on every table. */
export function newId(): string {
  return randomUUID();
}

/**
 * Human-facing document number for a Will, e.g. `CW-2026-4F3A9C`.
 * The random suffix avoids leaking how many Wills exist on the platform.
 */
export function newWillReference(date = new Date()): string {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `CW-${date.getUTCFullYear()}-${suffix}`;
}

/** URL-safe opaque token for email verification and password reset links. */
export function newOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Numeric one-time passcode for phone verification / 2FA. */
export function newNumericCode(digits = 6): string {
  const max = 10 ** digits;
  const value = randomBytes(4).readUInt32BE(0) % max;
  return value.toString().padStart(digits, "0");
}
