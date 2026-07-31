/** Shared, edge-safe role helpers. No database or Node-only imports here. */

export type Role = "user" | "admin";

export const ROLES: readonly Role[] = ["user", "admin"] as const;

export function isRole(value: unknown): value is Role {
  return value === "user" || value === "admin";
}

export function isAdmin(role: unknown): boolean {
  return role === "admin";
}

/** Route prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = ["/dashboard", "/wills", "/admin"] as const;

/** Route prefixes that require the `admin` role. */
export const ADMIN_PREFIXES = ["/admin"] as const;

/** Routes that an already-authenticated visitor should be redirected away from. */
export const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export function requiresAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function requiresAdmin(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
