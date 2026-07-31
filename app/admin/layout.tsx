import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireAdmin } from "@/lib/actions/guards";

export const adminNav = [
  { href: "/admin", label: "Overview", numeral: "I" },
  { href: "/admin/users", label: "Clients", numeral: "II" },
  { href: "/admin/wills", label: "Wills", numeral: "III" },
  { href: "/admin/payments", label: "Payments", numeral: "IV" },
  { href: "/admin/settings", label: "Settings", numeral: "V" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates /admin, but authorisation is re-asserted here so
  // the pages cannot be reached if the matcher is ever changed.
  const admin = await requireAdmin();

  return (
    <DashboardShell
      nav={adminNav}
      eyebrow="Registry of"
      personName={admin.name}
      personMeta={`${admin.email} · Administrator`}
      headerKicker="Will Papers · Registry"
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
