import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { COMPANY, REVIEW_TRIGGERS } from "@/lib/company";
import { WILL_STEPS } from "@/lib/will/steps";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Will drafting, trust administration, a guided questionnaire, an encrypted digital vault and probate support from Castle eWill & Trust.",
};

/** Drawn from the "Features" section of the client brief. */
const SERVICES = [
  {
    numeral: "I",
    title: "Guided Will builder",
    body: "An interactive questionnaire, not a blank page. Instead of asking you to draft legal clauses, we ask who your beneficiaries are, who should administer your estate, and what you own. The system assembles a legally compliant Will from your answers.",
    points: [
      "Nine plain-English sections",
      "Inline explanations on every field",
      "Save a draft and resume at any time",
    ],
  },
  {
    numeral: "II",
    title: "Trusts and executor support",
    body: "Nominate executors, appoint trustees and name guardians for children under eighteen. We record alternates for each appointment, because the person you choose today may not be available when it matters.",
    points: [
      "Multiple and alternate executors",
      "Guardianship for minor children",
      "Trustee appointments",
    ],
  },
  {
    numeral: "III",
    title: "Encrypted digital vault",
    body: "Store your Will alongside the documents your executors will need — title deeds, share certificates, identity documents. Everything is encrypted before it leaves our servers.",
    points: [
      "AES-256-GCM encryption at rest",
      "Integrity checked on every download",
      "Released only to those you name",
    ],
  },
  {
    numeral: "IV",
    title: "Identity verification",
    body: "Email confirmation, phone verification and identity documents, so that the person making a Will is demonstrably the person named in it. A Will that cannot be shown to be yours is a Will that can be challenged.",
    points: [
      "Email and phone confirmation",
      "Passport photograph and valid ID",
      "Full audit trail",
    ],
  },
  {
    numeral: "V",
    title: "Review reminders",
    body: "A Will is not a document you write once. We prompt you to revisit it every twelve months, and after the life events that most often make a Will out of date.",
    points: REVIEW_TRIGGERS.map((t) => t.label),
  },
  {
    numeral: "VI",
    title: "Probate support",
    body: "Guidance for your executors when the time comes: what the registry expects, what to gather, and in what order. The handover pack is prepared in advance so nobody is starting from nothing.",
    points: [
      "Executor briefing pack",
      "Registry-ready documentation",
      "Guidance through the process",
    ],
  },
] as const;

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
              Services
            </span>
          </div>
          <h1 className="max-w-3xl font-serif text-4xl text-navy sm:text-5xl lg:text-6xl">
            Everything an estate needs,{" "}
            <span className="italic text-primary">in one place.</span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground">
            {COMPANY.legalName} exists to do one thing properly: {" "}
            {COMPANY.business.toLowerCase()}, prepared to the standard we would
            want for our own families.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
          {SERVICES.map((service) => (
            <article key={service.numeral} className="border-t-2 border-gold pt-8">
              <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                {service.numeral}
              </span>
              <h2 className="mt-3 font-serif text-2xl text-navy">
                {service.title}
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {service.body}
              </p>
              <ul className="mt-5 space-y-2">
                {service.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm text-navy/80"
                  >
                    <span className="text-gold">&mdash;</span>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* The nine steps, sourced from the same definition the wizard uses. */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              The process
            </p>
            <h2 className="font-serif text-3xl text-navy sm:text-4xl">
              Nine steps, <span className="italic text-primary">one sitting.</span>
            </h2>
          </div>
          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {WILL_STEPS.map((step) => (
              <li key={step.slug} className="border-t border-border pt-4">
                <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                  {step.numeral}
                </span>
                <h3 className="mt-2 font-serif text-lg text-navy">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.intro}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">
            Begin with the first question.{" "}
            <span className="italic text-gold">The rest follows.</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 bg-gold px-10 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90"
            >
              Begin your Will
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center border border-white/30 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
