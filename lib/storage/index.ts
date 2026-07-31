import "server-only";

import { getEnv } from "@/lib/env";
import { decryptBuffer, encryptBuffer, sha256 } from "@/lib/security/crypto";
import { LocalStorageAdapter } from "./adapters/local";
import { S3StorageAdapter } from "./adapters/s3";
import { GoogleDriveStorageAdapter } from "./adapters/gdrive";
import type { StorageAdapter, StorageProviderName } from "./types";

export type { StorageAdapter, StorageProviderName } from "./types";

let adapter: StorageAdapter | undefined;

export function getStorage(): StorageAdapter {
  if (adapter) return adapter;

  const provider = getEnv().STORAGE_PROVIDER;
  adapter =
    provider === "s3"
      ? new S3StorageAdapter()
      : provider === "gdrive"
        ? new GoogleDriveStorageAdapter()
        : new LocalStorageAdapter();

  return adapter;
}

/** Test seam — lets unit tests substitute an in-memory adapter. */
export function setStorage(next: StorageAdapter | undefined): void {
  adapter = next;
}

export type StoredDocument = {
  handle: string;
  provider: StorageProviderName;
  sizeBytes: number;
  checksum: string;
};

/**
 * Encrypts and stores a document.
 *
 * Encryption happens here rather than in the adapters so that every provider —
 * including Google Drive — only ever receives ciphertext. The checksum is taken
 * over the *plaintext* so integrity can be verified after decryption.
 */
export async function storeDocument(
  key: string,
  body: Buffer,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<StoredDocument> {
  const storage = getStorage();
  const checksum = sha256(body);
  const envelope = encryptBuffer(body);

  const result = await storage.put({
    key,
    body: envelope,
    // Deliberately opaque: the real media type is recorded in the database.
    contentType: "application/octet-stream",
    metadata: { ...metadata, originalContentType: contentType },
  });

  return {
    handle: result.handle,
    provider: storage.name,
    sizeBytes: body.byteLength,
    checksum,
  };
}

/** Retrieves and decrypts a document, verifying it has not been tampered with. */
export async function readDocument(
  handle: string,
  expectedChecksum?: string | null,
): Promise<Buffer> {
  const plaintext = decryptBuffer(await getStorage().get(handle));

  if (expectedChecksum && sha256(plaintext) !== expectedChecksum) {
    throw new Error("Document integrity check failed");
  }

  return plaintext;
}

export async function removeDocument(handle: string): Promise<void> {
  await getStorage().delete(handle);
}

/**
 * Builds a collision-free, traversal-safe storage key.
 *
 * Path separators are replaced first, which alone prevents traversal. Runs of
 * dots are then collapsed so no `..` segment survives into the key at all — the
 * local adapter re-checks the resolved path regardless, but a key reading
 * `.._.._etc_passwd` is needlessly alarming in logs and in the object store.
 */
export function buildStorageKey(
  userId: string,
  kind: string,
  fileName: string,
): string {
  const safeName = fileName
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/_{2,}/g, "_")
    .replace(/^[._-]+/, "")
    .slice(-120);

  return `users/${userId}/${kind}/${Date.now()}-${safeName || "file"}`;
}
