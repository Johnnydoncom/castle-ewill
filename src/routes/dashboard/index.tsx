import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import fatherDaughter from "@/assets/father-daughter.jpg";
import legacyStill from "@/assets/legacy-still-life.jpg";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — Castle eWill Dashboard" },
      {
        name: "description",
        content:
          "Your private chambers. Track drafting progress, witnesses, and sealed documents.",
      },
      { property: "og:title", content: "Overview — Castle eWill Dashboard" },
      { property: "og:description", content: "Your private Will dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardOverview,
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

function DashboardOverview() {
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <>
      {/* Masthead */}
      <div className="grid gap-6 border-b border-border pb-8 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-10 shrink-0 bg-gold" />
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Overview · 29 July 2026
            </p>
          </div>
          <h1 className="font-serif text-3xl leading-tight tracking-tight text-navy sm:text-5xl">
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
          className="w-full bg-navy text-navy-foreground hover:bg-navy/90 sm:w-auto"
        >
          <Link to="/wills/new">Resume drafting →</Link>
        </Button>
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-3 lg:gap-8">
        <section className="rounded-2xl border border-border bg-background p-5 sm:p-8 lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Ledger of Progress
              </p>
              <h2 className="mt-1 font-serif text-xl text-navy sm:text-2xl">
                The Ada Okafor Last Will &amp; Testament
              </h2>
            </div>
            <span className="font-serif text-3xl text-navy">
              {pct}
              <span className="text-lg text-muted-foreground">%</span>
            </span>
          </div>

          <div className="mb-8 h-[2px] w-full overflow-hidden bg-border">
            <div className="h-full bg-gold-gradient" style={{ width: `${pct}%` }} />
          </div>

          <ol className="divide-y divide-border">
            {steps.map((s) => (
              <li key={s.n} className="flex items-center gap-3 py-3.5 sm:gap-5">
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
                  className={`min-w-0 flex-1 text-sm ${
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
                  <span className="shrink-0 font-serif text-[10px] uppercase tracking-[0.25em] text-gold">
                    Signed
                  </span>
                )}
                {s.current && (
                  <Link
                    to="/wills/new"
                    className="shrink-0 rounded-full bg-navy px-3 py-1 text-[11px] font-medium text-navy-foreground hover:bg-navy/90"
                  >
                    Continue
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <div className="relative h-40">
              <img src={fatherDaughter} alt="" className="h-full w-full object-cover" />
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
                <li
                  key={n}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-navy">{n}</p>
                    <p className="text-[11px] text-muted-foreground">{m}</p>
                  </div>
                  <Link
                    to="/dashboard/documents"
                    className="shrink-0 text-[11px] text-navy underline underline-offset-4 hover:text-gold"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Activity + Witnesses */}
      <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-5 lg:gap-8">
        <section className="rounded-2xl border border-border bg-background p-5 sm:p-8 lg:col-span-3">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Journal
          </p>
          <h3 className="mt-1 font-serif text-xl text-navy">Recent activity</h3>
          <ul className="mt-6 space-y-4">
            {activity.map((a) => (
              <li
                key={a.date + a.event}
                className="grid gap-1 border-b border-border pb-4 last:border-0 sm:flex sm:gap-6"
              >
                <span className="w-28 shrink-0 font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {a.date}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy">{a.event}</p>
                  <p className="text-xs text-muted-foreground">{a.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-navy bg-navy p-5 text-navy-foreground sm:p-8 lg:col-span-2">
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
          <h3 className="font-serif text-xl leading-tight sm:text-2xl">
            Two witnesses required at signing.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-navy-foreground/75">
            Under Nigerian law, your Will must be signed in the presence of two
            adult witnesses who are not beneficiaries.
          </p>
          <Link
            to="/dashboard/witnesses"
            className="mt-6 inline-block font-serif text-[10px] uppercase tracking-[0.25em] text-gold hover:underline"
          >
            Manage witnesses →
          </Link>
        </section>
      </div>
    </>
  );
}
