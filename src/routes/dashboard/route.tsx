import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const nav = [
  { to: "/dashboard", label: "Overview", numeral: "I" },
  { to: "/dashboard/will", label: "Will Builder", numeral: "II" },
  { to: "/dashboard/documents", label: "Documents", numeral: "III" },
  { to: "/dashboard/witnesses", label: "Witnesses", numeral: "IV" },
  { to: "/dashboard/advisors", label: "Advisors", numeral: "V" },
  { to: "/dashboard/settings", label: "Settings", numeral: "VI" },
] as const;

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <DashboardShell
      nav={nav}
      eyebrow="Chambers of"
      personName="Ada Okafor"
      personMeta="Testator · Member since 2026"
      headerKicker="Will Papers · Vol. I"
      headerTitle="Private Dashboard"
      footer={{
        title: "Counsel available",
        body: "Book a 20-minute review with a Nigerian estate lawyer.",
        cta: "Reserve time",
      }}
    />
  );
}
