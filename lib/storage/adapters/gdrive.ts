import "server-only";

import { createSign, randomUUID } from "node:crypto";

import { getEnv } from "@/lib/env";
import type {
  PutObjectInput,
  PutObjectResult,
  StorageAdapter,
} from "../types";

/**
 * Google Drive adapter backed by a service account.
 *
 * Implemented against the REST API directly rather than the `googleapis`
 * package, which would add ~50 MB to the deployment for three endpoints.
 *
 * Operational notes:
 *  - A service account has no Drive storage quota of its own, so
 *    GDRIVE_FOLDER_ID must point at a folder on a **Shared Drive** (or a folder
 *    shared with the service account by a user who owns the quota).
 *  - Payloads are encrypted by the storage facade before they reach this
 *    adapter, so Google only ever holds ciphertext.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";
const FILES_URL = "https://www.googleapis.com/drive/v3/files";

type CachedToken = { value: string; expiresAt: number };

export class GoogleDriveStorageAdapter implements StorageAdapter {
  readonly name = "gdrive" as const;

  private token: CachedToken | undefined;

  private base64url(input: Buffer | string): string {
    return Buffer.from(input).toString("base64url");
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) {
      return this.token.value;
    }

    const env = getEnv();
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiry = issuedAt + 3600;

    const header = this.base64url(
      JSON.stringify({ alg: "RS256", typ: "JWT" }),
    );
    const claims = this.base64url(
      JSON.stringify({
        iss: env.GDRIVE_CLIENT_EMAIL,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: issuedAt,
        exp: expiry,
      }),
    );

    // Private keys are commonly stored with literal \n escapes in .env files.
    const privateKey = (env.GDRIVE_PRIVATE_KEY as string).replace(
      /\\n/g,
      "\n",
    );

    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claims}`);
    signer.end();
    const signature = signer.sign(privateKey).toString("base64url");

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${header}.${claims}.${signature}`,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Google Drive authentication failed (${response.status}): ${await response.text()}`,
      );
    }

    const payload = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.token = {
      value: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };
    return this.token.value;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.accessToken()}` };
  }

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    const env = getEnv();
    const boundary = `castle-${randomUUID()}`;

    const metadata = {
      name: input.key.replace(/\//g, "_"),
      parents: [env.GDRIVE_FOLDER_ID],
      appProperties: { storageKey: input.key, ...(input.metadata ?? {}) },
    };

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${input.contentType}\r\n\r\n`,
      ),
      input.body,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: {
        ...(await this.authHeaders()),
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: new Uint8Array(body),
    });

    if (!response.ok) {
      throw new Error(
        `Google Drive upload failed (${response.status}): ${await response.text()}`,
      );
    }

    const file = (await response.json()) as { id: string };
    return {
      key: input.key,
      handle: file.id,
      sizeBytes: input.body.byteLength,
    };
  }

  async get(handle: string): Promise<Buffer> {
    const response = await fetch(
      `${FILES_URL}/${encodeURIComponent(handle)}?alt=media&supportsAllDrives=true`,
      { headers: await this.authHeaders() },
    );
    if (!response.ok) {
      throw new Error(
        `Google Drive download failed (${response.status}): ${await response.text()}`,
      );
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(handle: string): Promise<void> {
    const response = await fetch(
      `${FILES_URL}/${encodeURIComponent(handle)}?supportsAllDrives=true`,
      { method: "DELETE", headers: await this.authHeaders() },
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`Google Drive delete failed (${response.status})`);
    }
  }

  async exists(handle: string): Promise<boolean> {
    const response = await fetch(
      `${FILES_URL}/${encodeURIComponent(handle)}?fields=id&supportsAllDrives=true`,
      { headers: await this.authHeaders() },
    );
    return response.ok;
  }

  async signedUrl(): Promise<string | null> {
    // Drive has no presigned-URL equivalent for private files; downloads are
    // streamed through the authenticated route handler instead.
    return null;
  }
}
