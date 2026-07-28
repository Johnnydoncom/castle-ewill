import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Castle eWill & Trust" },
      { name: "description", content: "How Castle collects, uses and safeguards your personal information." },
      { property: "og:title", content: "Castle Privacy Policy" },
      { property: "og:description", content: "Our privacy commitment to you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage title="Privacy Policy" tag="Legal" />,
});

export function LegalPage({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">{tag}</p>
          <h1 className="font-serif text-5xl text-navy sm:text-6xl">{title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: 28 July 2026</p>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none text-foreground/85">
          <p>
            Castle eWill & Trust ("Castle", "we", "our") is committed to protecting the privacy of every user who
            entrusts us with their legacy. This policy explains what information we collect, how we use it, and the
            rights you have under the Nigeria Data Protection Act.
          </p>
          <h2 className="font-serif text-navy">1. Information we collect</h2>
          <p>We collect the information you provide when creating your account and Will, including personal, family, beneficiary and asset details.</p>
          <h2 className="font-serif text-navy">2. How we use it</h2>
          <p>Your information is used solely to draft, store and support your legal documents, and to communicate with you about your account.</p>
          <h2 className="font-serif text-navy">3. Security</h2>
          <p>All data is encrypted at rest and in transit using AES-256. Access is strictly limited and audited.</p>
          <h2 className="font-serif text-navy">4. Sharing</h2>
          <p>We never sell your data. We share only with your explicit consent — for example, with reviewing lawyers or nominated executors.</p>
          <h2 className="font-serif text-navy">5. Your rights</h2>
          <p>You may access, correct, export or delete your personal data at any time from your account settings.</p>
          <h2 className="font-serif text-navy">6. Contact</h2>
          <p>Questions? Reach our Data Protection Officer at privacy@castle-ewill.ng.</p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
