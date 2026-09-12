import type { Viewer } from "@/hooks/use-viewer";

export type HeaderLink = { href: string; label: string };

/**
 * Where the public header's two controls point, for whoever is looking.
 *
 * They were fixed at `/login` and `/register`, so a client who was already
 * signed in was asked to sign in again, and the primary button offered to
 * start a Will they had already started.
 *
 * A pure function with its own test, because the header is a cached, static
 * component correcting itself after hydration — the sort of place where a
 * regression shows up as a signed-in client being sent back to the sign-in
 * page, and nowhere in a test run.
 *
 * Two controls in every case, so the header's geometry never changes: a text
 * link and the primary pill.
 */
export function headerDestinations(viewer: Viewer | null): {
  secondary: HeaderLink;
  primary: HeaderLink;
} {
  if (viewer === null) {
    return {
      secondary: { href: "/login", label: "Sign in" },
      primary: { href: "/register", label: "Start your Will" },
    };
  }

  // An administrator has their own console, and the client dashboard refuses
  // them — see the dual dashboard guards.
  if (viewer.role === "admin") {
    return {
      secondary: { href: "/admin", label: "Admin console" },
      primary: { href: "/admin/wills", label: "Review queue" },
    };
  }

  return {
    secondary: { href: "/dashboard", label: "Dashboard" },
    primary: { href: "/dashboard/will", label: "Continue your Will" },
  };
}
