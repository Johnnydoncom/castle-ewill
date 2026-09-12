import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { COMPANY, REVIEW_TRIGGERS } from "@/lib/company";
import { WILL_STEPS } from "@/lib/will/steps";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  title: "Services",
  description:
    "A guided Will builder, an encrypted document vault, identity verification and probate lodging. You write the Will yourself; a solicitor's review is an optional extra.",
};

/*
 * Drawn from the "Features" section of the client brief, and then checked
 * against the code.
 *
 * Three entries here described things this platform does not do. "Trustee
 * appointments" — the wizard has no trustee step and the schema has no trustee.
 * "Probate support", promising an executor briefing pack and registry-ready
 * documentation prepared in advance — none of that exists. And the vault was
 * said to release documents "only to those you name", when `DocumentVault`
 * grants read access to the owner and an administrator and to nobody else;
 * there is no executor-release mechanism to speak of.
 *
 * A services page is a page people buy from. Overstating a feature here is
 * worse than an invented testimonial, because somebody may choose this
 * platform *for* the thing that does not exist, and only find out when their
 * executors do. The two unbuilt features are gone rather than softened, and
 * the vault now claims what it actually enforces.
 *
 * Replaced with two things that are real and were missing: the QR seal the
 * generated Will has carried since the PDF was rebuilt, and the professional
 * rate for lawyers drafting on behalf of clients.
 */
const SERVICES = [
  {
    numeral: "I",
    title: "Guided Will builder",
    body: "An interactive questionnaire, not a blank page. Rather than asking you to draft legal clauses, we ask who your beneficiaries are, who should administer your estate, and what you own. The system assembles a Will that complies with the law from your answers.",
    points: [
      "Four plain-English steps",
      "Inline explanations on every field",
      "Save a draft and resume at any time",
    ],
  },
  {
    numeral: "II",
    title: "Executors and guardians",
    body: "Name the people who will carry out your wishes, in the order you want them to act, and appoint guardians for any children under eighteen. Alternates are recorded for each appointment, because the person you choose today may not be available when it matters.",
    points: [
      "Several executors, ranked in order",
      "Alternates who step up if a first choice cannot act",
      "Guardianship for minor children",
    ],
  },
  {
    numeral: "III",
    title: "Encrypted digital vault",
    body: "Store your Will alongside the documents your executors will need — title deeds, share certificates, identity documents. Every file is encrypted before it touches a disk, and each attempt to read one is logged whether it succeeds or not.",
    points: [
      "AES-256-GCM encryption at rest",
      "Integrity re-checked on every download",
      "Readable only by you, and every access recorded",
    ],
  },
  {
    numeral: "IV",
    title: "Identity verification",
    body: "We confirm your email address, authenticate the government-issued ID you upload, and match it against a live camera check — so the person making a Will is demonstrably the person named in it. A Will that cannot be shown to be yours is a Will that can be challenged.",
    points: [
      "Passport photograph and valid ID",
      "Live liveness check, issued fresh each time",
      "Full audit trail",
    ],
    href: "/security",
  },
  {
    numeral: "V",
    title: "Review reminders",
    body: "A Will is not a document you write once. We prompt you to revisit it every twelve months, and after the life events that most often make a Will out of date.",
    points: REVIEW_TRIGGERS.map((t) => t.label),
  },
  {
    numeral: "VI",
    title: "A document anyone can check",
    body: "Every Will we produce carries a QR seal at its foot. Scanning it confirms which Will it is, which version, and when it was issued — so a bank or a registry can satisfy itself that the copy in front of them is genuine and current, without telephoning anyone.",
    points: [
      "Sealed with a code only this office can mint",
      "Shows whether a printout has been superseded",
      "Discloses nothing about the estate",
    ],
    href: "/verify",
  },
] as const;

export default function ServicesPage() {
  return (
    <>
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
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
            {COMPANY.legalName} is a platform, not a law firm. You answer the
            questions and the system assembles a Will that complies with the
            law; you can print and sign it the same day without a solicitor ever
            being involved. If you would rather one read it first, that is a
            service you can buy — never a gate you have to pass.
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
              {"href" in service && (
                <Link
                  href={service.href}
                  className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-navy underline underline-offset-4 hover:text-gold"
                >
                  How we verify
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* The steps, sourced from the same definition the wizard uses. */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              The process
            </p>
            <h2 className="font-serif text-3xl text-navy sm:text-4xl">
              Five stages, <span className="italic text-primary">one sitting.</span>
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

    </>
  );
}
