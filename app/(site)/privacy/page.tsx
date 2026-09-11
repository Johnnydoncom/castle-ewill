import { COMPANY } from "@/lib/company";
import type { Metadata } from "next";
import { PrivacyAccordion } from "./privacy-accordion";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy Policy",
  description:
    "How Castle eWill & Trust collects, uses and safeguards your personal information under the Nigeria Data Protection Act.",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Legal
          </p>
          <h1 className="font-serif text-5xl text-navy sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: 11 September 2026
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-base prose-headings:mb-2 max-w-none text-foreground/85">
          {/* ── Preamble (always visible) ─────────────────────── */}
          <p>
            This Privacy Policy regulates how Castle eWill &amp; Trust
            (&ldquo;Castle&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) will
            process the personal information of our data subjects such as:
            users, beneficiaries, executors, programme participants and visitors
            to this website.
          </p>
          <p>
            In line with the provisions of the Nigeria Data Protection Act (NDP
            Act), 2023, and other applicable data privacy laws and regulations,
            Castle eWill &amp; Trust maintains the privacy principles which
            govern how we collect, use, record, organise, structure, store,
            adapt or alter, retrieve, consult, disclose, disseminate, align,
            combine, restrict, erase or destroy and generally manage your
            personal data.
          </p>
        </div>

        {/* ── Accordion articles ──────────────────────────────── */}
        <PrivacyAccordion companyEmail={COMPANY.email} />

        {/* ── Attribution ─────────────────────────────────────── */}
        <div className="mt-10 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            This privacy policy is modelled on the{" "}
            <a
              href="https://ndpc.gov.ng/our-data-privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Nigeria Data Protection Commission (NDPC) Data Privacy Policy
            </a>{" "}
            and adapted for Castle eWill &amp; Trust in compliance with the
            Nigeria Data Protection Act, 2023.
          </p>
        </div>
      </article>
    </>
  );
}
