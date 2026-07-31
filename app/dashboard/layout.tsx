import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireUser } from "@/lib/actions/guards";

const nav = [
  { href: "/dashboard", label: "Overview", numeral: "I" },
  { href: "/dashboard/will", label: "Will Builder", numeral: "II" },
  { href: "/dashboard/documents", label: "Documents", numeral: "III" },
  { href: "/dashboard/witnesses", label: "Witnesses", numeral: "IV" },
  { href: "/dashboard/advisors", label: "Advisors", numeral: "V" },
  { href: "/dashboard/settings", label: "Settings", numeral: "VI" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <DashboardShell
      nav={nav}
      eyebrow="Chambers of"
      personName={user.name}
      personMeta={user.email}
      headerKicker="Will Papers · Vol. I"
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
