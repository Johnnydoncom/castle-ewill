/**
 * Password policy — pure, dependency-light, safe to import anywhere.
 *
 * These live apart from `lib/auth/password.ts` deliberately. That module is
 * marked `server-only` because it carries bcrypt; the strength meter in
 * `components/auth/FormControls.tsx` is a client component and the sign-up
 * schema is shared by both sides. Importing the guarded module from the client
 * fails the production bundle, and the fix is to move the pure half out —
 * never to delete the guard.
 */

import { z } from "zod";

/** bcrypt work factor. Shared so the seed script cannot drift from the app. */
export const PASSWORD_COST = 12;

/**
 * At least 10 characters with a mix of cases and a digit.
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
