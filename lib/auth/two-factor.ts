import "server-only";

import { decryptBuffer, encryptBuffer } from "@/lib/security/crypto";

/**
 * TOTP secrets are stored encrypted.
 *
 * A leaked database dump should not hand an attacker the ability to mint valid
 * second factors, so the shared secret is sealed with the same AES-256-GCM
 * envelope used for vault documents and stored base64-encoded.
 */

export function sealTotpSecret(secretBase32: string): string {
  return encryptBuffer(Buffer.from(secretBase32, "utf8")).toString("base64");
}

export function openTotpSecret(sealed: string): string {
  return decryptBuffer(Buffer.from(sealed, "base64")).toString("utf8");
}
