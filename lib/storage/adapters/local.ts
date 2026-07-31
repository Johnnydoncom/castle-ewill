import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { getEnv } from "@/lib/env";
import type {
  PutObjectInput,
  PutObjectResult,
  StorageAdapter,
} from "../types";

/**
 * Filesystem adapter for local development and single-node deployments with a
 * persistent volume. Not suitable for serverless or multi-instance hosting.
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly name = "local" as const;

  private root(): string {
    return path.resolve(process.cwd(), getEnv().STORAGE_LOCAL_DIR);
  }

  /** Rejects traversal so a crafted key cannot escape the storage root. */
  private resolve(key: string): string {
    const root = this.root();
    const target = path.resolve(root, key);
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return target;
  }

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    const target = this.resolve(input.key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, input.body, { mode: 0o600 });
    return {
      key: input.key,
      handle: input.key,
      sizeBytes: input.body.byteLength,
    };
  }

  async get(handle: string): Promise<Buffer> {
    return fs.readFile(this.resolve(handle));
  }

  async delete(handle: string): Promise<void> {
    await fs.rm(this.resolve(handle), { force: true });
  }

  async exists(handle: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(handle));
      return true;
    } catch {
      return false;
    }
  }

  async signedUrl(): Promise<string | null> {
    // Local files are streamed through the authenticated download route.
    return null;
  }
}
