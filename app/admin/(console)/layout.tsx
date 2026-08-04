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
 */
export const adminNav = [
  { href: "/admin", label: "Overview", icon: "overview" },
  { href: "/admin/users", label: "Clients", icon: "clients" },
  { href: "/admin/wills", label: "Wills", icon: "wills" },
  { href: "/admin/verifications", label: "Identity", icon: "identity" },
  { href: "/admin/payments", label: "Payments", icon: "payments" },
  { href: "/admin/messages", label: "Messages", icon: "messages" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
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

  return (
    <DashboardShell
      nav={adminNav}
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
