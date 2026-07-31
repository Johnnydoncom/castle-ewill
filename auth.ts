import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotp } from "@/lib/auth/totp";
import { openTotpSecret } from "@/lib/auth/two-factor";
import { recordAudit } from "@/lib/security/audit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  // Present only on the second leg of a two-factor sign-in.
  totp: z.string().optional(),
});

/** Number of consecutive failures before an account is temporarily locked. */
const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "Authentication code", type: "text" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();

        const [record] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Run the bcrypt comparison even when the user does not exist so that
        // response timing does not reveal which emails are registered.
        const passwordOk = await verifyPassword(
          parsed.data.password,
          record?.passwordHash,
        );

        if (!record) return null;

        if (record.status !== "active") {
          throw new Error("ACCOUNT_SUSPENDED");
        }

        if (record.lockedUntil && record.lockedUntil > new Date()) {
          throw new Error("ACCOUNT_LOCKED");
        }

        if (!passwordOk) {
          const attempts = record.failedLoginAttempts + 1;
          await db
            .update(users)
            .set({
              failedLoginAttempts: attempts,
              lockedUntil:
                attempts >= MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + LOCK_MINUTES * 60_000)
                  : null,
            })
            .where(eq(users.id, record.id));

          await recordAudit({
            userId: record.id,
            action: "auth.login_failed",
            entityType: "user",
            entityId: record.id,
            metadata: { attempts },
          });

          return null;
        }

        if (!record.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // Second factor. The password is already known-good at this point, so
        // failures here are reported distinctly from a bad password — the
        // password itself has not been called into question.
        if (record.twoFactorEnabled) {
          if (!record.twoFactorSecret) {
            // Enabled without a secret should be impossible; refuse rather
            // than silently downgrading the account to one factor.
            throw new Error("TWO_FACTOR_UNAVAILABLE");
          }

          const submitted = parsed.data.totp?.trim();
          if (!submitted) {
            throw new Error("TWO_FACTOR_REQUIRED");
          }

          const ok = verifyTotp(
            openTotpSecret(record.twoFactorSecret),
            submitted,
          );

          if (!ok) {
            await recordAudit({
              userId: record.id,
              action: "auth.two_factor_failed",
              entityType: "user",
              entityId: record.id,
            });
            throw new Error("TWO_FACTOR_INVALID");
          }
        }

        await db
          .update(users)
          .set({
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          })
          .where(eq(users.id, record.id));

        await recordAudit({
          userId: record.id,
          action: "auth.login",
          entityType: "user",
          entityId: record.id,
        });

        return {
          id: record.id,
          email: record.email,
          name: record.name ?? record.email,
          image: record.image ?? null,
          role: record.role,
          isEmailVerified: true,
        };
      },
    }),
  ],
});
