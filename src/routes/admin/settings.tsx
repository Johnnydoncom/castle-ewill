import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Registry Settings — Castle eWill Admin" },
      {
        name: "description",
        content:
          "Configure plan pricing, solicitor roster and platform-wide compliance settings.",
      },
      { property: "og:title", content: "Registry Settings — Castle eWill Admin" },
      { property: "og:description", content: "Platform configuration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <>
      <PageHead
        kicker="Registry · Section V"
        title="Settings"
        blurb="Pricing, roster and compliance rules that govern every matter on the platform."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
          <h2 className="font-serif text-lg text-navy">Plan pricing</h2>
          <div className="mt-4 space-y-4">
            {[
              ["Essential", "25000"],
              ["Family", "55000"],
              ["Estate", "150000"],
            ].map(([plan, price]) => (
              <label key={plan} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="truncate text-sm text-navy">{plan}</span>
                <input
                  defaultValue={price}
                  className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-navy outline-none focus:border-gold"
                />
              </label>
            ))}
          </div>
          <Button className="mt-6 w-full bg-navy text-navy-foreground hover:bg-navy/90 sm:w-auto">
            Update pricing
          </Button>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
          <h2 className="font-serif text-lg text-navy">Solicitor roster</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Barr. Emeka Okafor", "Principal · Lagos"],
              ["Barr. T. Adeyemi", "Senior counsel · Abuja"],
              ["Barr. Ifeoma Nwachukwu", "Counsel · Port Harcourt"],
            ].map(([n, r]) => (
              <li key={n} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                <span className="min-w-0 truncate text-navy">{n}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {r}
                </span>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-6 w-full sm:w-auto">
            Invite solicitor
          </Button>
        </section>
      </div>
    </>
  );
}
