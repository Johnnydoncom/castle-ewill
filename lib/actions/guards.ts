
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
  /**
   * The three parts the whole name is composed from.
   *
   * The identity check is built from these, so a surname the software has to
   * guess at is a surname it can guess wrong.
   */
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: "user" | "admin";
  status: "active" | "suspended" | "deleted";
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_kyc_verified: boolean;
  /** Whether the platform is currently asking for each — admin-controlled. */
  requires_email_verification: boolean;
  requires_phone_verification: boolean;
  /**
   * Whether **any** of this account's Wills is currently subscribed.
   *
   * Coarse, and only useful as a coarse answer. A subscription belongs to a
   * Will, so anything deciding storage or amendments must read that Will's own
   * `has_active_subscription`.
   */
  has_active_subscription: boolean;
  subscription_expires_at: string | null;
  /** Platinum: may attach a recording of themselves reading their Will. */
  can_attach_will_video: boolean;
  /**
   * Whether this account may hold more than one Will.
   *
   * True for a verified lawyer, who draws Wills for clients. False for
   * everybody else: a person has one estate, and two Wills that both look
   * valid is the worst thing this product could hand an executor.
   */
  may_hold_multiple_wills: boolean;
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
  const read = await loadProfile();

  // A backend we could not reach is an error, not a sign-out.
  assertReachable(read);

  if (read.status !== "authenticated") {
    redirect("/login");
  }

  const { profile } = read;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? profile.email,
    role: profile.role,
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const read = await loadProfile();

  /*
   * An unreachable backend must not sign an administrator out. Before this,
   * a slow or briefly-down API produced the same `null` as "no session", and
   * the console bounced a valid admin straight back to the login form —
   * which looks exactly like a broken sign-in and is impossible to tell
   * apart from one.
   */
  assertReachable(read);

  // The admin console has its own sign-in page — an unauthenticated visitor
  // is sent there, not to the customer login, so they never see the wrong
  // form for the door they knocked on.
  if (read.status !== "authenticated") {
    redirect("/admin/login");
  }

  const { profile } = read;

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
export type ProfileRead =
  | { status: "authenticated"; profile: Profile }
  /** The backend answered, and said nobody is signed in. */
  | { status: "anonymous" }
  /** The backend did not answer. We do **not** know whether they are signed in. */
  | { status: "unavailable"; message: string };

/**
 * Reads `GET /me`, keeping "not signed in" and "could not tell" apart.
 *
 * This distinction is the whole point. Collapsing both to `null` — as this
 * did — means a backend that is merely slow or briefly down is
 * indistinguishable from a signed-out visitor, so every guard "helpfully"
 * redirects a perfectly valid session to the sign-in page. `lib/api/client`
 * returns 503 for a timeout or an unreachable host, and this deployment is a
 * Vercel function calling shared hosting across the public internet, so that
 * is a routine event rather than a hypothetical one.
 *
 * Signing somebody out because we could not reach the server for 15 seconds
 * is both wrong and, on an admin console, indistinguishable from the bug it
 * was mistaken for.
 */
export async function loadProfile(): Promise<ProfileRead> {
  const result = await api<{ data: Profile }>("/me");

  if (result.ok) {
    const profile = result.data?.data;

    return profile
      ? { status: "authenticated", profile }
      : { status: "unavailable", message: "The account record came back empty." };
  }

  /*
   * 401 is not a failure — it is the normal shape of "nobody is signed in",
   * and every anonymous visit to a public page that checks `currentUser()`
   * (login, register, pricing) hits it on purpose. Logging it would fire on
   * every ordinary page load.
   */
  if (result.status === 401 || result.status === 419) {
    return { status: "anonymous" };
  }

  console.error(`[api] read failed: /me — ${result.status} ${result.message}`);

  return { status: "unavailable", message: result.message };
}

/**
 * The signed-in account, or null.
 *
 * For callers that only want to *display* something differently — a public
 * page swapping "Sign in" for "Dashboard". It deliberately treats an
 * unreachable backend as "nobody", because the alternative is taking the
 * marketing site down over it. Guards must use `loadProfile()` instead: for
 * them the difference decides whether someone keeps their session.
 */
export async function getProfile(): Promise<Profile | null> {
  const read = await loadProfile();

  return read.status === "authenticated" ? read.profile : null;
}

/**
 * Turns a failed read into a thrown error rather than a redirect.
 *
 * Next renders the nearest error boundary, so the person sees "something went
 * wrong, try again" and keeps their session — instead of being quietly signed
 * out and sent to a login form that will tell them nothing is wrong.
 */
function assertReachable(read: ProfileRead): void {
  if (read.status === "unavailable") {
    throw new Error(`Could not verify your session: ${read.message}`);
  }
}
