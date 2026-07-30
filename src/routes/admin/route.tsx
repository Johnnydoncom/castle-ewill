import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const adminNav = [
  { to: "/admin", label: "Overview", numeral: "I" },
  { to: "/admin/users", label: "Clients", numeral: "II" },
  { to: "/admin/wills", label: "Wills", numeral: "III" },
  { to: "/admin/payments", label: "Payments", numeral: "IV" },
  { to: "/admin/settings", label: "Settings", numeral: "V" },
] as const;

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <DashboardShell
      nav={adminNav}
      eyebrow="Registry of"
      personName="Castle Administration"
      personMeta="Barr. E. Okafor · Principal"
      headerKicker="Will Papers · Registry"
      headerTitle="Administrator Console"
      footer={{
        title: "Queue",
        body: "6 Wills awaiting solicitor review this week.",
        cta: "Open review queue",
      }}
    />
  );
}
