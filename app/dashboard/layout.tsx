import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireCustomer } from "@/lib/actions/guards";

/** Per-user data throughout — never prerendered, never cached across requests. */
export const dynamic = "force-dynamic";

const nav = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/dashboard/will", label: "Will Builder", icon: "will" },
  { href: "/dashboard/documents", label: "Documents", icon: "documents" },
  { href: "/dashboard/witnesses", label: "Witnesses", icon: "witnesses" },
  { href: "/dashboard/advisors", label: "Advisors", icon: "advisors" },
  { href: "/dashboard/payments", label: "Billing", icon: "payments" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCustomer();

  return (
    <DashboardShell
      nav={nav}
      eyebrow="Signed in as"
      personName={user.name}
      personMeta={user.email}
      headerKicker="Castle eWill & Trust"
      headerTitle="Private Dashboard"
      footer={{
        title: "Counsel available",
        body: "Book a 20-minute review with a Nigerian estate lawyer.",
        cta: "Reserve time",
        href: "/contact",
      }}
    >
      {children}
    </DashboardShell>
  );
}
