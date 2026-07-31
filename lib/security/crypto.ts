import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { getEnv } from "@/lib/env";

/**
 * AES-256-GCM envelope used for documents held in the digital vault.
 *
 * Layout: [ 12-byte IV | 16-byte auth tag | ciphertext ]
 * The authentication tag makes tampering detectable, which matters for
 * identity documents held with a third-party storage provider.
 */

const IV_BYTES = 12;
const TAG_BYTES = 16;

function key(): Buffer {
  return Buffer.from(getEnv().ENCRYPTION_KEY, "base64");
}

export function encryptBuffer(plaintext: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptBuffer(envelope: Buffer): Buffer {
  if (envelope.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Ciphertext is too short to be a valid envelope");
  }
  const iv = envelope.subarray(0, IV_BYTES);
  const tag = envelope.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = envelope.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function sha256(input: Buffer | string): string {
  return createHash("sha256").update(input).digest("hex");
}
