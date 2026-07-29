import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wills/new")({
  head: () => ({
    meta: [
      { title: "Will Builder — Castle eWill & Trust" },
      {
        name: "description",
        content:
          "Draft your Will step by step. Nine considered sections, guided by counsel.",
      },
      { property: "og:title", content: "Will Builder — Castle eWill & Trust" },
      {
        property: "og:description",
        content: "Nine-step guided Will drafting.",
      },
    ],
  }),
  component: WizardPage,
});

const steps = [
  {
    n: "I",
    title: "Personal particulars",
    intro: "Begin with the person whose wishes we are recording — you.",
    fields: [
      { id: "fullname", label: "Full legal name", placeholder: "Ada Chinelo Okafor" },
      { id: "dob", label: "Date of birth", type: "date" },
      { id: "nin", label: "National Identification Number", placeholder: "12345678901" },
      { id: "address", label: "Residential address", placeholder: "12 Bourdillon Rd, Ikoyi, Lagos", full: true },
      { id: "marital", label: "Marital status", placeholder: "Married" },
    ],
  },
  {
    n: "II",
    title: "Family & dependents",
    intro: "Name your spouse and any children or dependents you wish to consider.",
    fields: [
      { id: "spouse", label: "Spouse's full name", placeholder: "Emeka Okafor", full: true },
      { id: "children", label: "Children (comma-separated)", placeholder: "Zara, Kene", full: true },
      { id: "deps", label: "Other dependents", placeholder: "None", full: true },
    ],
  },
  {
    n: "III",
    title: "Estate & assets",
    intro: "A ledger of what you own — property, accounts, businesses, valuables.",
    fields: [
      { id: "real", label: "Real property", placeholder: "House at 12 Bourdillon Rd", full: true },
      { id: "bank", label: "Bank accounts", placeholder: "GTBank, Zenith", full: true },
      { id: "biz", label: "Business interests", placeholder: "Okafor Consulting Ltd (60%)", full: true },
    ],
  },
  {
    n: "IV",
    title: "Beneficiaries",
    intro: "Those to whom your estate will pass. Percentages must total 100%.",
    fields: [
      { id: "b1", label: "Beneficiary 1 · name", placeholder: "Emeka Okafor" },
      { id: "s1", label: "Share (%)", placeholder: "50" },
      { id: "b2", label: "Beneficiary 2 · name", placeholder: "Zara Okafor" },
      { id: "s2", label: "Share (%)", placeholder: "25" },
    ],
  },
  {
    n: "V",
    title: "Guardianship",
    intro: "Should minor children remain, name a guardian you trust with their upbringing.",
    fields: [
      { id: "guardian", label: "Primary guardian", placeholder: "Chidi Nwosu", full: true },
      { id: "guardian2", label: "Alternate guardian", placeholder: "Ify Adeleke", full: true },
    ],
  },
  {
    n: "VI",
    title: "Executors",
    intro: "The person or firm who will carry out your wishes. Two executors is customary.",
    fields: [
      { id: "e1", label: "Primary executor", placeholder: "Barr. T. Adeyemi", full: true },
      { id: "e2", label: "Co-executor", placeholder: "Emeka Okafor", full: true },
    ],
  },
  {
    n: "VII",
    title: "Specific bequests",
    intro: "Items of particular meaning — jewellery, art, heirlooms — assigned by name.",
    fields: [
      { id: "gift1", label: "Item", placeholder: "My father's wristwatch" },
      { id: "to1", label: "To", placeholder: "Kene Okafor" },
      { id: "gift2", label: "Item", placeholder: "Personal library" },
      { id: "to2", label: "To", placeholder: "University of Lagos" },
    ],
  },
  {
    n: "VIII",
    title: "Funeral wishes",
    intro: "Optional. A brief note on your preferences — burial, cremation, service.",
    fields: [
      { id: "funeral", label: "Wishes", placeholder: "Simple burial in Awka, close family only.", full: true, textarea: true },
    ],
  },
  {
    n: "IX",
    title: "Review & sign",
    intro: "Your draft is ready for counsel review, followed by witnessed signature.",
    fields: [],
  },
];

function WizardPage() {
  const [current, setCurrent] = useState(3); // step IV
  const step = steps[current];
  const pct = Math.round(((current + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-surface">
      {/* Masthead */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size={32} />
          <div className="hidden text-center sm:block">
            <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              Will Papers · Vol. I
            </p>
            <p className="font-serif text-sm text-navy">Guided Drafting</p>
          </div>
          <Link
            to="/dashboard"
            className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-navy"
          >
            Save & exit →
          </Link>
        </div>
        <div className="h-[2px] w-full bg-border">
          <div
            className="h-full bg-gold-gradient transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[240px_1fr]">
        {/* Ledger of steps */}
        <aside className="hidden lg:block">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Contents
          </p>
          <ol className="mt-4 space-y-1">
            {steps.map((s, i) => {
              const isDone = i < current;
              const isCurrent = i === current;
              return (
                <li key={s.n}>
                  <button
                    onClick={() => setCurrent(i)}
                    className={`flex w-full items-baseline gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      isCurrent
                        ? "bg-navy text-navy-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-navy"
                    }`}
                  >
                    <span
                      className={`w-6 font-serif text-[10px] uppercase tracking-[0.2em] ${
                        isCurrent
                          ? "text-gold"
                          : isDone
                            ? "text-gold/70"
                            : "text-muted-foreground/50"
                      }`}
                    >
                      {s.n}
                    </span>
                    <span className={isCurrent ? "font-medium" : ""}>{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Sheet */}
        <section className="relative">
          {/* Editorial "paper" */}
          <div className="relative rounded-2xl border border-border bg-background p-8 shadow-soft sm:p-12">
            <div className="pointer-events-none absolute inset-4 border border-border/50" />

            <div className="relative">
              <div className="flex items-baseline justify-between border-b border-border pb-6">
                <div>
                  <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
                    Article {step.n} · of IX
                  </p>
                  <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-navy">
                    {step.title}
                  </h1>
                </div>
                <span className="font-serif text-6xl italic text-gold/30">
                  §{step.n}
                </span>
              </div>

              <p className="mt-6 max-w-xl text-sm italic leading-relaxed text-muted-foreground">
                {step.intro}
              </p>

              {current < steps.length - 1 ? (
                <form
                  className="mt-10 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2"
                  onSubmit={(e) => e.preventDefault()}
                >
                  {step.fields.map((f) => (
                    <div
                      key={f.id}
                      className={f.full ? "sm:col-span-2" : ""}
                    >
                      <label
                        htmlFor={f.id}
                        className="font-serif text-[10px] uppercase tracking-[0.3em] text-navy"
                      >
                        {f.label}
                      </label>
                      {f.textarea ? (
                        <textarea
                          id={f.id}
                          rows={4}
                          placeholder={f.placeholder}
                          className="mt-2 w-full border-0 border-b border-border bg-transparent px-0 py-2 font-serif text-lg text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/50 focus:border-gold focus:outline-none focus:ring-0"
                        />
                      ) : (
                        <input
                          id={f.id}
                          type={f.type ?? "text"}
                          placeholder={f.placeholder}
                          className="mt-2 w-full border-0 border-b border-border bg-transparent px-0 py-2 font-serif text-lg text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/50 focus:border-gold focus:outline-none focus:ring-0"
                        />
                      )}
                    </div>
                  ))}
                </form>
              ) : (
                <ReviewPanel />
              )}

              <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-navy disabled:opacity-40"
                >
                  ← Previous article
                </button>
                <p className="hidden font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:block">
                  Auto-saved · a moment ago
                </p>
                {current < steps.length - 1 ? (
                  <Button
                    onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
                    className="bg-navy text-navy-foreground hover:bg-navy/90"
                  >
                    Continue →
                  </Button>
                ) : (
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
                    Send for counsel review
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Counsel note */}
          <div className="mt-6 flex items-start gap-4 rounded-xl border border-gold/30 bg-gold/5 p-5">
            <span className="font-serif text-2xl italic text-gold">"</span>
            <div>
              <p className="text-sm leading-relaxed text-navy">
                Beneficiary shares must sum to 100%. If a beneficiary predeceases
                you, name a substitute in the notes.
              </p>
              <p className="mt-1 font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Note from counsel
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="mt-10 space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          Summary
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {[
            ["Testator", "Ada Chinelo Okafor"],
            ["Marital status", "Married"],
            ["Dependents", "2 children"],
            ["Beneficiaries", "3 named"],
            ["Guardian", "Chidi Nwosu"],
            ["Executors", "2 named"],
            ["Specific bequests", "4 items"],
            ["Witnesses required", "2 (to be invited)"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between border-b border-border pb-2">
              <dt className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {k}
              </dt>
              <dd className="font-serif text-sm text-navy">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ol className="space-y-3 text-sm">
        {[
          "Counsel reviews within 24 hours",
          "Any suggested amendments returned to you",
          "Two witnesses invited to sign",
          "Sealed copy stored in encrypted vault",
        ].map((t, i) => (
          <li key={t} className="flex items-baseline gap-4">
            <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-gold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-navy">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
