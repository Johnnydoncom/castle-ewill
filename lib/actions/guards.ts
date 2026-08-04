
import "server-only";

import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  /** Only ever populated by `requireAdmin()` — a superadmin passes every permission check. */
  isSuperAdmin?: boolean;
  /** Only ever populated by `requireAdmin()`. Full catalog when `isSuperAdmin`. */
  permissions?: string[];
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
  is_kyc_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string | null;
  last_login_at?: string | null;
  /** Present only on the caller's own record when `role: "admin"` — see UserResource. */
  is_superadmin?: boolean;
  permissions?: string[];
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
  const profile = await getProfile();

  // The admin console has its own sign-in page — an unauthenticated visitor
  // is sent there, not to the customer login, so they never see the wrong
  // form for the door they knocked on.
  if (!profile) {
    redirect("/admin/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? profile.email,
    role: profile.role,
    isSuperAdmin: profile.is_superadmin ?? false,
    permissions: profile.permissions ?? [],
  };
}

/**
 * The section-level counterpart to `requireAdmin()`.
 *
 * `requireAdmin()` only establishes *an* admin session; it says nothing
 * about which console sections this particular admin may use. Every section
 * page calls this instead, so a delegated admin who pastes in a URL they
 * were not granted is sent back to Overview rather than shown an empty
 * table that looks like "no records" instead of "no access". The API's own
 * `permission:` middleware is the actual guarantee — this is what keeps the
 * page from rendering a broken screen in the meantime.
 */
export async function requireAdminPermission(permission: string): Promise<SessionUser> {
  const admin = await requireAdmin();

  if (!admin.isSuperAdmin && !admin.permissions?.includes(permission)) {
    redirect("/admin");
  }

  return admin;
}

/** The admin-management screens — superadmin only, never a delegable permission. */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const admin = await requireAdmin();

  if (!admin.isSuperAdmin) {
    redirect("/admin");
  }

  return admin;
}

/**
 * The customer-portal counterpart to `requireAdmin()`: signed in, and not an
 * administrator. An admin account has no Will of its own to draft, so
 * `/dashboard` has nothing for it — sent to `/admin` instead, the same way
 * `requireAdmin()` sends a non-admin back to `/dashboard`. Neither role can
 * end up on the other's console by visiting a URL directly.
 */
export async function requireCustomer(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role === "admin") {
    redirect("/admin");
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
