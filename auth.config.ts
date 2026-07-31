import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe portion of the Auth.js configuration.
 *
 * The middleware runs on the edge runtime where `mysql2` and `bcryptjs` are
 * unavailable, so anything touching the database lives in `auth.ts` instead.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/dashboard",
    verifyRequest: "/verify-email",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh the JWT once per day
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "user";
        token.isEmailVerified = Boolean(
          (user as { isEmailVerified?: boolean }).isEmailVerified,
        );
      }

      // Allow `updateSession()` to refresh the display name without re-login.
      if (trigger === "update" && session && typeof session === "object") {
        const next = session as { name?: string };
        if (next.name) token.name = next.name;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
