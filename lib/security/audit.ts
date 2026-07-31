import "server-only";

import { headers } from "next/headers";

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

export type AuditEntry = {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Appends an immutable audit record.
 *
 * Audit writes must never break the request they describe, so failures are
 * logged to stderr and swallowed. Request metadata is captured on a best-effort
 * basis — `headers()` is unavailable outside a request scope.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const h = await headers();
      ipAddress =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null;
      userAgent = h.get("user-agent");
    } catch {
      // Called outside a request context (e.g. a script) — metadata is optional.
    }

    await db.insert(auditLogs).values({
      id: newId(),
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      ipAddress: ipAddress?.slice(0, 64) ?? null,
      userAgent: userAgent?.slice(0, 512) ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    console.error("[audit] failed to record entry", entry.action, error);
  }
}

/** Reads the caller's IP for rate-limit keying. Falls back to a constant. */
export async function callerKey(prefix: string): Promise<string> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "unknown";
    return `${prefix}:${ip}`;
  } catch {
    return `${prefix}:unknown`;
  }
}
