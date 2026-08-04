import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireAdmin } from "@/lib/actions/guards";

/**
 * Never prerendered or cached: every page below reads the signed-in
 * administrator's session and live registry data. Without this, the build tries
 * to statically generate the console and fails against a database it should not
 * need at build time.
 */
export const dynamic = "force-dynamic";

/*
 * Ordered by how often the work is done, not alphabetically. Identity checks
 * sit above payments because a client blocked on one cannot submit their Will
 * at all — that queue going unwatched stops the product working.
 *
 * `permission: null` means every admin sees the link regardless of section
 * permissions — true only of Overview (aggregate counts, nothing
 * record-level) and Admins (gated separately, by `isSuperAdmin` below, since
 * "manage other admins" is not a delegable permission at all).
 */
export const adminNav = [
  { href: "/admin", label: "Overview", icon: "overview", permission: null },
  { href: "/admin/users", label: "Clients", icon: "clients", permission: "manage_clients" },
  { href: "/admin/wills", label: "Wills", icon: "wills", permission: "manage_wills" },
  { href: "/admin/verifications", label: "Identity", icon: "identity", permission: "manage_verifications" },
  { href: "/admin/payments", label: "Payments", icon: "payments", permission: "manage_payments" },
  { href: "/admin/messages", label: "Messages", icon: "messages", permission: "manage_messages" },
  { href: "/admin/settings", label: "Settings", icon: "settings", permission: "manage_settings" },
  { href: "/admin/admins", label: "Admins", icon: "admins", permission: null },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // There is no edge middleware — Laravel's session cookie is opaque to
  // Next, so this server-side check against `GET /me` is the only gate.
  // `/admin/login` sits outside the `(console)` group specifically so it is
  // never wrapped by this layout and never calls this.
  const admin = await requireAdmin();

  /*
   * Hiding a link a caller cannot use is UX, not the guarantee — every
   * section page re-checks on its own via `getProfile()`, and the API
   * itself refuses with 403 regardless of what this nav shows. But showing
   * a delegated admin a dozen links that all 403 would read as broken, not
   * scoped, so it is filtered here too.
   */
  const nav = adminNav.filter((item) => {
    if (item.href === "/admin/admins") return admin.isSuperAdmin;
    if (item.permission === null) return true;
    return admin.isSuperAdmin || admin.permissions?.includes(item.permission);
  });

  return (
    <DashboardShell
      nav={nav}
      eyebrow="Signed in as"
      personName={admin.name}
      personMeta={`${admin.email} · Administrator`}
      headerKicker="Castle eWill & Trust"
      headerTitle="Administrator Console"
      footer={{
        title: "Review queue",
        body: "Wills awaiting solicitor review appear here.",
        cta: "Open queue",
        href: "/admin/wills",
      }}
    >
      {children}
    </DashboardShell>
  );
}
