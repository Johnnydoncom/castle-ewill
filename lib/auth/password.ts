import "server-only";

import bcrypt from "bcryptjs";
import { z } from "zod";

const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  // Always run a comparison so that a missing hash costs the same as a wrong
  // password — this prevents user enumeration through response timing.
  const target = hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
  const ok = await bcrypt.compare(plain, target);
  return Boolean(hash) && ok;
}

/**
 * Password policy: at least 10 characters with a mix of cases and a digit.
 * Deliberately favours length over exotic symbol requirements (NIST SP 800-63B).
 */
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200, "Password must be at most 200 characters")
  .refine((v) => /[a-z]/.test(v), "Include at least one lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Include at least one uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Include at least one number");

/** 0–4 strength score used by the client-side meter. */
export function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 10) score++;
  if (value.length >= 14) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}
