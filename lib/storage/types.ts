/** Provider-agnostic contract for the document vault. */

export type StorageProviderName = "local" | "s3" | "gdrive";

export type PutObjectInput = {
  /** Logical path, e.g. `users/<id>/identity/<uuid>.pdf`. */
  key: string;
  body: Buffer;
  contentType: string;
  /** Provider-visible metadata. Never put sensitive values here. */
  metadata?: Record<string, string>;
};

export type PutObjectResult = {
  key: string;
  /** Provider-native handle (S3 key, Drive file id, relative path). */
  handle: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  readonly name: StorageProviderName;
  put(input: PutObjectInput): Promise<PutObjectResult>;
  get(handle: string): Promise<Buffer>;
  delete(handle: string): Promise<void>;
  exists(handle: string): Promise<boolean>;
  /**
   * Time-limited direct download URL. Adapters that cannot issue one return
   * null and callers fall back to streaming through the application.
   */
  signedUrl(handle: string, expiresInSeconds: number): Promise<string | null>;
}
