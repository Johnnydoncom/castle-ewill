import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Castle eWill Dashboard" },
      {
        name: "description",
        content:
          "Manage your Castle profile, security preferences, notifications and billing.",
      },
      { property: "og:title", content: "Settings — Castle eWill Dashboard" },
      { property: "og:description", content: "Profile, security and billing settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      <input
        defaultValue={value}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-navy outline-none focus:border-gold"
      />
    </label>
  );
}

function SettingsPage() {
  return (
    <>
      <PageHead
        kicker="Section VI"
        title="Settings"
        blurb="Your particulars, security posture and billing history — all in one ledger."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-background p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-serif text-lg text-navy">Personal particulars</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value="Ada Chinelo Okafor" />
            <Field label="Email" value="ada.okafor@example.com" />
            <Field label="Phone" value="+234 802 000 0000" />
            <Field label="City" value="Lagos" />
          </div>
          <Button className="mt-6 w-full bg-navy text-navy-foreground hover:bg-navy/90 sm:w-auto">
            Save changes
          </Button>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-background p-6">
            <h2 className="font-serif text-lg text-navy">Security</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Two-factor authentication", "Enabled"],
                ["Vault encryption", "AES-256"],
                ["Last sign-in", "29 Jul 2026 · Lagos"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                  <span className="min-w-0 truncate text-muted-foreground">{k}</span>
                  <span className="shrink-0 text-navy">{v}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-background p-6">
            <h2 className="font-serif text-lg text-navy">Billing</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Family plan · ₦55,000 one-time · paid 18 Apr 2026
            </p>
            <button className="mt-3 text-xs text-navy underline underline-offset-4 hover:text-gold">
              Download receipt
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
