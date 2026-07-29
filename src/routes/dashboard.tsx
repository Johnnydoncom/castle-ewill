import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import fatherDaughter from "@/assets/father-daughter.jpg";
import legacyStill from "@/assets/legacy-still-life.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Castle eWill & Trust" },
      {
        name: "description",
        content:
          "Your private chambers. Track drafting progress, witnesses, and sealed documents.",
      },
      { property: "og:title", content: "Dashboard — Castle eWill & Trust" },
      {
        property: "og:description",
        content: "Your private Will dashboard.",
      },
    ],
  }),
  component: DashboardPage,
});

const steps = [
  { n: "01", label: "Personal particulars", done: true },
  { n: "02", label: "Family & dependents", done: true },
  { n: "03", label: "Estate & assets", done: true },
  { n: "04", label: "Beneficiaries", done: false, current: true },
  { n: "05", label: "Guardianship", done: false },
  { n: "06", label: "Executors", done: false },
  { n: "07", label: "Specific bequests", done: false },
  { n: "08", label: "Funeral wishes", done: false },
  { n: "09", label: "Review & sign", done: false },
];

const activity = [
  { date: "29 Jul 2026", event: "Draft auto-saved", meta: "Section 3 · Estate" },
  { date: "27 Jul 2026", event: "Counsel review returned", meta: "2 suggestions" },
  { date: "22 Jul 2026", event: "Witness invited", meta: "Chidi Nwosu" },
  { date: "18 Jul 2026", event: "Account opened", meta: "Enrolment complete" },
];

function DashboardPage() {
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <DashboardShell>
      {/* Masthead */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-10 bg-gold" />
            <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              Overview · Monday, 29 July 2026
            </p>
          </div>
          <h1 className="font-serif text-5xl leading-tight tracking-tight text-navy">
            Good morning, <span className="italic">Ada.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Your draft is <strong className="text-navy">{pct}% complete</strong>.
            Four more sections until it is ready for witness signature.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-navy text-navy-foreground hover:bg-navy/90"
        >
          <Link to="/wills/new">Resume drafting →</Link>
        </Button>
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Progress ledger */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-background p-8">
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Ledger of Progress
              </p>
              <h2 className="mt-1 font-serif text-2xl text-navy">
                The Ada Okafor Last Will & Testament
              </h2>
            </div>
            <span className="font-serif text-3xl text-navy">
              {pct}
              <span className="text-lg text-muted-foreground">%</span>
            </span>
          </div>

          <div className="mb-8 h-[2px] w-full overflow-hidden bg-border">
            <div
              className="h-full bg-gold-gradient"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ol className="divide-y divide-border">
            {steps.map((s) => (
              <li
                key={s.n}
                className="flex items-center gap-5 py-3.5"
              >
                <span
                  className={`font-serif text-sm tracking-[0.2em] ${
                    s.done
                      ? "text-gold"
                      : s.current
                        ? "text-navy"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {s.n}
                </span>
                <span
                  className={`flex-1 text-sm ${
                    s.done
                      ? "text-muted-foreground line-through decoration-gold/60"
                      : s.current
                        ? "font-medium text-navy"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {s.done && (
                  <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-gold">
                    Signed off
                  </span>
                )}
                {s.current && (
                  <Link
                    to="/wills/new"
                    className="rounded-full bg-navy px-3 py-1 text-[11px] font-medium text-navy-foreground hover:bg-navy/90"
                  >
                    Continue
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Sidebar cards */}
        <div className="space-y-6">
          {/* Editorial card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <div className="relative h-40">
              <img
                src={fatherDaughter}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
              <p className="absolute bottom-3 left-4 font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Plate IV · Guardianship
              </p>
            </div>
            <div className="p-5">
              <p className="font-serif text-xs uppercase tracking-[0.25em] text-navy">
                A note from counsel
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                "When naming a guardian, choose someone whose values align with
                yours — not merely their availability."
              </p>
              <p className="mt-3 text-xs italic text-muted-foreground">
                — Barrister T. Adeyemi
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Sealed Vault
            </p>
            <h3 className="mt-1 font-serif text-lg text-navy">Documents</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Draft Will v.3", "PDF · 214 KB"],
                ["Asset inventory", "PDF · 88 KB"],
                ["ID — passport", "IMG · 1.1 MB"],
              ].map(([n, m]) => (
                <li key={n} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="text-navy">{n}</p>
                    <p className="text-[11px] text-muted-foreground">{m}</p>
                  </div>
                  <button className="text-[11px] text-navy underline underline-offset-4 hover:text-gold">
                    Open
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Activity + Witnesses */}
      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-background p-8 lg:col-span-3">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Journal
          </p>
          <h3 className="mt-1 font-serif text-xl text-navy">Recent activity</h3>
          <ul className="mt-6 space-y-4">
            {activity.map((a) => (
              <li key={a.date + a.event} className="flex gap-6 border-b border-border pb-4 last:border-0">
                <span className="w-28 shrink-0 font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {a.date}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-navy">{a.event}</p>
                  <p className="text-xs text-muted-foreground">{a.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-navy bg-navy p-8 text-navy-foreground lg:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-gold" />
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Witnesses
            </p>
          </div>
          <img
            src={legacyStill}
            alt=""
            className="mb-6 h-32 w-full rounded-lg object-cover opacity-60"
          />
          <h3 className="font-serif text-2xl leading-tight">
            Two witnesses required at signing.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-navy-foreground/75">
            Under Nigerian law, your Will must be signed in the presence of two
            adult witnesses who are not beneficiaries.
          </p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between border-b border-navy-foreground/15 pb-2">
              <span className="text-sm">Chidi Nwosu</span>
              <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-gold">
                Confirmed
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-navy-foreground/15 pb-2">
              <span className="text-sm text-navy-foreground/60">Awaiting</span>
              <button className="font-serif text-[10px] uppercase tracking-[0.25em] text-gold hover:underline">
                Invite +
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
