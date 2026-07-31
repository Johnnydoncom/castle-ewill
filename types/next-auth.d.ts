import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      /**
       * Whether the account has completed email verification.
       * Named distinctly from Auth.js's own `emailVerified`, which the adapter
       * types as `Date | null`.
       */
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "admin";
    isEmailVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "admin";
    isEmailVerified?: boolean;
  }
}

export {};
