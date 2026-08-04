
import "server-only";

import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

/**
 * The account as the backend currently sees it.
 *
 * Distinct from `SessionUser` only in shape, not in freshness — both now come
 * straight from `GET /me`, re-read from the database on every call, so a role
 * change or a suspension takes effect on the very next request rather than at
 * the next sign-in.
 */
export type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: "user" | "admin";
  status: "active" | "suspended" | "deleted";
  is_email_verified: boolean;
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string | null;
  last_login_at?: string | null;
};

/**
 * Server-side authorisation.
 *
 * There is no edge-level pre-check: authentication is Laravel's own Sanctum
 * session cookie, which is opaque to Next (there is nothing to decode at the
 * edge, unlike the old NextAuth JWT), so the one and only gate is this
 * cookie-forwarded call to `GET /me` on every protected page.
 */
export async function requireUser(): Promise<SessionUser> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? profile.email,
    role: profile.role,
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/** Non-redirecting variant for pages that only want to know who is signed in. */
export async function currentUser(): Promise<SessionUser | null> {
  const profile = await getProfile();
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? profile.email,
    role: profile.role,
  };
}

/**
 * The live account record.
 *
 * Returns null when the backend cannot be reached or there is no session —
 * which is the honest answer, and better than rendering a settings page full
 * of stale values.
 */
export async function getProfile(): Promise<Profile | null> {
  const result = await api<{ data: Profile }>("/me");

  if (!result.ok) {
    /*
     * A 401 here is not a failure — it is the normal shape of "nobody is
     * signed in", and every anonymous visit to a public page that checks
     * `currentUser()` (the login/register pages, `pricing`) hits it on
     * purpose. Logging it as an error would fire on every ordinary page
     * load; only a genuinely unexpected response is worth the noise.
     */
    if (result.status !== 401) {
      console.error(`[api] read failed: /me — ${result.message}`);
    }
    return null;
  }

  return result.data?.data ?? null;
}
