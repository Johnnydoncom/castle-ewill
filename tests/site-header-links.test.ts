import { describe, expect, it } from "vitest";

import { headerDestinations } from "@/lib/site/header-links";

/**
 * The public header's two controls.
 *
 * They pointed at /login and /register whoever was looking, so a signed-in
 * client was asked to sign in again. Nothing about being signed in may send
 * anybody back to an auth page.
 */
describe("the public header", () => {
  it("asks a visitor to sign in or start a Will", () => {
    expect(headerDestinations(null)).toEqual({
      secondary: { href: "/login", label: "Sign in" },
      primary: { href: "/register", label: "Start your Will" },
    });
  });

  it("takes a signed-in client to their dashboard and their Will", () => {
    const links = headerDestinations({ name: "Olumide", role: "user" });

    expect(links.secondary).toEqual({ href: "/dashboard", label: "Dashboard" });
    expect(links.primary).toEqual({ href: "/dashboard/will", label: "Continue your Will" });
  });

  it("takes an administrator to the console, never the client dashboard", () => {
    const links = headerDestinations({ name: "Admin", role: "admin" });

    expect(links.secondary.href).toBe("/admin");
    expect(links.primary.href).toBe("/admin/wills");
  });

  it("never sends a signed-in account to an auth page", () => {
    for (const role of ["user", "admin"] as const) {
      const links = headerDestinations({ name: null, role });

      expect([links.secondary.href, links.primary.href]).not.toContain("/login");
      expect([links.secondary.href, links.primary.href]).not.toContain("/register");
    }
  });
});
