import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

/**
 * Server-side authorisation.
 *
 * The edge middleware already redirects anonymous traffic, but every page and
 * action re-checks here. Middleware is a convenience; this is the control.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? session.user.email ?? "",
    role: session.user.role ?? "user",
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/** Non-redirecting variant for server actions that return a FormState. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? session.user.email ?? "",
    role: session.user.role ?? "user",
  };
}
