import "server-only";

import { createHash } from "node:crypto";
import { and, eq, isNull, lt, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";
import { newId, newOpaqueToken, newNumericCode } from "@/lib/ids";

export type TokenPurpose =
  | "email_verification"
  | "password_reset"
  | "phone_otp"
  | "two_factor";

const TTL_MINUTES: Record<TokenPurpose, number> = {
  email_verification: 60 * 24, // 24 hours
  password_reset: 60, // 1 hour
  phone_otp: 10,
  two_factor: 5,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a single-use token. Any previously outstanding token for the same
 * user and purpose is invalidated so only the newest link ever works.
 */
export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<{ token: string; expiresAt: Date }> {
  await db
    .update(authTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(authTokens.userId, userId),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.consumedAt),
      ),
    );

  const token =
    purpose === "phone_otp" || purpose === "two_factor"
      ? newNumericCode(6)
      : newOpaqueToken(32);

  const expiresAt = new Date(Date.now() + TTL_MINUTES[purpose] * 60_000);

  await db.insert(authTokens).values({
    id: newId(),
    userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Validates and atomically consumes a token.
 * Returns the owning user id, or null when the token is unknown, expired or
 * already used.
 */
export async function consumeToken(
  token: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const tokenHash = hashToken(token);

  const [row] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.consumedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;

  const result = await db
    .update(authTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(authTokens.id, row.id), isNull(authTokens.consumedAt)));

  // If another request consumed it first, treat this attempt as invalid.
  const affected = (result as unknown as { affectedRows?: number })
    .affectedRows;
  if (affected === 0) return null;

  return row.userId;
}

/** Housekeeping — safe to call from a cron route. */
export async function purgeExpiredTokens(): Promise<void> {
  await db.delete(authTokens).where(lt(authTokens.expiresAt, new Date()));
}
