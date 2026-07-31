import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getEnv } from "@/lib/env";
import type {
  PutObjectInput,
  PutObjectResult,
  StorageAdapter,
} from "../types";

/**
 * S3-compatible adapter. Verified against Cloudflare R2 and AWS S3; also works
 * with MinIO for local integration testing.
 */
export class S3StorageAdapter implements StorageAdapter {
  readonly name = "s3" as const;

  private clientInstance: S3Client | undefined;

  private client(): S3Client {
    if (this.clientInstance) return this.clientInstance;
    const env = getEnv();
    this.clientInstance = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY as string,
      },
      forcePathStyle: Boolean(env.S3_ENDPOINT),
    });
    return this.clientInstance;
  }

  private bucket(): string {
    return getEnv().S3_BUCKET as string;
  }

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    await this.client().send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        Metadata: input.metadata,
      }),
    );
    return {
      key: input.key,
      handle: input.key,
      sizeBytes: input.body.byteLength,
    };
  }

  async get(handle: string): Promise<Buffer> {
    const result = await this.client().send(
      new GetObjectCommand({ Bucket: this.bucket(), Key: handle }),
    );
    if (!result.Body) throw new Error(`Object not found: ${handle}`);
    const bytes = await result.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(handle: string): Promise<void> {
    await this.client().send(
      new DeleteObjectCommand({ Bucket: this.bucket(), Key: handle }),
    );
  }

  async exists(handle: string): Promise<boolean> {
    try {
      await this.client().send(
        new HeadObjectCommand({ Bucket: this.bucket(), Key: handle }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async signedUrl(
    handle: string,
    expiresInSeconds: number,
  ): Promise<string | null> {
    return getSignedUrl(
      this.client(),
      new GetObjectCommand({ Bucket: this.bucket(), Key: handle }),
      { expiresIn: expiresInSeconds },
    );
  }
}
