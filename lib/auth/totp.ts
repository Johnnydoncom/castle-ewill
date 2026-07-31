import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Time-based one-time passwords (RFC 6238) over HMAC-OTP (RFC 4226).
 *
 * Implemented directly on `node:crypto` rather than pulling in a dependency:
 * the algorithm is about sixty lines, and the implementation is verified
 * against the test vectors published in RFC 6238 Appendix B.
 *
 * This module is deliberately free of database and environment imports so it
 * can be exercised in isolation.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  // Padding and casing vary between authenticator apps; normalise both.
  const normalised = input.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalised) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/** 20 random bytes — the size RFC 4226 recommends for an HMAC-SHA1 key. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export type TotpOptions = {
  digits?: number;
  stepSeconds?: number;
  algorithm?: "sha1" | "sha256" | "sha512";
};

/**
 * Computes the OTP for a given counter value (RFC 4226 HOTP).
 * Exported so the RFC test vectors can be checked directly.
 */
export function hotp(
  secret: Buffer,
  counter: number,
  options: TotpOptions = {},
): string {
  const digits = options.digits ?? 6;
  const algorithm = options.algorithm ?? "sha1";

  // Counter is a 64-bit big-endian integer.
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac(algorithm, secret).update(counterBuffer).digest();

  // Dynamic truncation: the low nibble of the last byte selects the offset.
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

export function generateTotp(
  secretBase32: string,
  atMs: number = Date.now(),
  options: TotpOptions = {},
): string {
  const step = options.stepSeconds ?? 30;
  const counter = Math.floor(atMs / 1000 / step);
  return hotp(base32Decode(secretBase32), counter, options);
}

/**
 * Verifies a submitted code.
 *
 * A window of ±1 step (30 seconds either side) absorbs clock drift between the
 * user's device and the server, which is the single most common cause of a
 * correct code being rejected. The comparison is constant-time.
 */
export function verifyTotp(
  secretBase32: string,
  token: string,
  options: TotpOptions & { window?: number; atMs?: number } = {},
): boolean {
  const cleaned = token.replace(/\s+/g, "");
  const digits = options.digits ?? 6;

  if (!new RegExp(`^\\d{${digits}}$`).test(cleaned)) return false;

  const step = options.stepSeconds ?? 30;
  const window = options.window ?? 1;
  const atMs = options.atMs ?? Date.now();
  const counter = Math.floor(atMs / 1000 / step);

  const secret = base32Decode(secretBase32);
  const submitted = Buffer.from(cleaned, "utf8");

  let matched = false;
  for (let drift = -window; drift <= window; drift++) {
    const candidate = Buffer.from(
      hotp(secret, counter + drift, { ...options, digits }),
      "utf8",
    );
    // Compare every candidate rather than breaking early, so the time taken
    // does not reveal which step matched.
    if (
      candidate.length === submitted.length &&
      timingSafeEqual(candidate, submitted)
    ) {
      matched = true;
    }
  }

  return matched;
}

/** `otpauth://` URI consumed by Google Authenticator, Authy, 1Password etc. */
export function buildOtpAuthUri(options: {
  secretBase32: string;
  accountName: string;
  issuer: string;
}): string {
  const label = encodeURIComponent(
    `${options.issuer}:${options.accountName}`,
  );
  const params = new URLSearchParams({
    secret: options.secretBase32,
    issuer: options.issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Groups the secret into four-character blocks for manual entry. */
export function formatSecretForDisplay(secretBase32: string): string {
  return secretBase32.replace(/(.{4})/g, "$1 ").trim();
}
