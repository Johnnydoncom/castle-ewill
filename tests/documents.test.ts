import { afterEach, describe, expect, it } from "vitest";

import {
  describeFileProblem,
  extensionOf,
  formatBytes,
  MAX_UPLOAD_BYTES,
} from "@/lib/documents";
import {
  buildStorageKey,
  readDocument,
  removeDocument,
  setStorage,
  storeDocument,
} from "@/lib/storage";
import type { PutObjectInput, StorageAdapter } from "@/lib/storage/types";

/** In-memory adapter so the vault round-trip runs without a filesystem or S3. */
class MemoryAdapter implements StorageAdapter {
  readonly name = "local" as const;
  readonly objects = new Map<string, Buffer>();

  async put(input: PutObjectInput) {
    this.objects.set(input.key, input.body);
    return {
      key: input.key,
      handle: input.key,
      sizeBytes: input.body.byteLength,
    };
  }
  async get(handle: string) {
    const value = this.objects.get(handle);
    if (!value) throw new Error(`Not found: ${handle}`);
    return value;
  }
  async delete(handle: string) {
    this.objects.delete(handle);
  }
  async exists(handle: string) {
    return this.objects.has(handle);
  }
  async signedUrl() {
    return null;
  }
}

afterEach(() => setStorage(undefined));

describe("upload validation", () => {
  it("accepts a PDF whose extension matches its media type", () => {
    expect(describeFileProblem("deed.pdf", "application/pdf", 1024)).toBeNull();
  });

  it("rejects a file whose extension contradicts its declared type", () => {
    // The classic upload bypass: claim image/png, ship an .html payload.
    expect(describeFileProblem("payload.html", "image/png", 1024)).toMatch(
      /only pdf/i,
    );
  });

  it("rejects an unsupported media type outright", () => {
    expect(
      describeFileProblem("macro.docx", "application/msword", 1024),
    ).toMatch(/only pdf/i);
  });

  it("rejects an oversized file and names the limit", () => {
    expect(
      describeFileProblem("scan.pdf", "application/pdf", MAX_UPLOAD_BYTES + 1),
    ).toMatch(/10 MB/);
  });

  it("rejects an empty file", () => {
    expect(describeFileProblem("empty.pdf", "application/pdf", 0)).toMatch(
      /empty/i,
    );
  });

  it("reads the extension from the last dot only", () => {
    expect(extensionOf("my.passport.scan.pdf")).toBe("pdf");
    expect(extensionOf("noextension")).toBe("");
  });

  it("formats sizes for display", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("storage keys", () => {
  it("strips characters that could escape the key namespace", () => {
    const key = buildStorageKey(
      "user-1",
      "identity_document",
      "../../etc/passwd",
    );
    expect(key).not.toContain("..");
    expect(key.startsWith("users/user-1/identity_document/")).toBe(true);
  });

  it("keeps the expected prefix and preserves the filename", () => {
    const key = buildStorageKey("user-1", "supporting_document", "deed.pdf");
    expect(key.startsWith("users/user-1/supporting_document/")).toBe(true);
    expect(key.endsWith("deed.pdf")).toBe(true);
  });
});

describe("vault round trip", () => {
  it("stores ciphertext and returns the original bytes", async () => {
    const adapter = new MemoryAdapter();
    setStorage(adapter);

    const plaintext = Buffer.from("Passport number A01234567", "utf8");
    const stored = await storeDocument(
      "users/u1/identity_document/passport.pdf",
      plaintext,
      "application/pdf",
    );

    // What reached the adapter must not be readable.
    const atRest = adapter.objects.get(stored.handle);
    expect(atRest).toBeDefined();
    expect(atRest!.includes("A01234567")).toBe(false);
    expect(stored.sizeBytes).toBe(plaintext.byteLength);

    const restored = await readDocument(stored.handle, stored.checksum);
    expect(restored.toString("utf8")).toBe("Passport number A01234567");
  });

  it("fails the integrity check when stored bytes are altered", async () => {
    const adapter = new MemoryAdapter();
    setStorage(adapter);

    const stored = await storeDocument(
      "users/u1/supporting_document/deed.pdf",
      Buffer.from("original deed"),
      "application/pdf",
    );

    const tampered = Buffer.from(adapter.objects.get(stored.handle)!);
    tampered[tampered.length - 1] ^= 0xff;
    adapter.objects.set(stored.handle, tampered);

    await expect(readDocument(stored.handle, stored.checksum)).rejects.toThrow();
  });

  it("removes an object from storage", async () => {
    const adapter = new MemoryAdapter();
    setStorage(adapter);

    const stored = await storeDocument(
      "users/u1/supporting_document/note.pdf",
      Buffer.from("note"),
      "application/pdf",
    );

    expect(adapter.objects.size).toBe(1);
    await removeDocument(stored.handle);
    expect(adapter.objects.size).toBe(0);
  });
});
