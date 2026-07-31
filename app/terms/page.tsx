import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions that govern your use of Castle eWill & Trust.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="font-serif text-5xl text-navy sm:text-6xl">Terms of Service</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: 28 July 2026</p>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none text-foreground/85">
          <p>These Terms govern your use of Castle eWill &amp; Trust. By creating an account, you agree to them.</p>
          <h2 className="font-serif text-navy">1. Services</h2>
          <p>Castle provides digital tools and legal review to help Nigerian residents draft, store and update Wills and related documents.</p>
          <h2 className="font-serif text-navy">2. Eligibility</h2>
          <p>You must be at least 18 years old and of sound mind to create a Will on Castle.</p>
          <h2 className="font-serif text-navy">3. Accuracy of information</h2>
          <p>You are responsible for the accuracy of the details you provide. Castle drafts documents based on your inputs.</p>
          <h2 className="font-serif text-navy">4. Legal advice</h2>
          <p>Castle offers legal drafting services and (on qualifying plans) lawyer review. It does not replace bespoke legal advice for complex estates.</p>
          <h2 className="font-serif text-navy">5. Fees &amp; refunds</h2>
          <p>Fees are one-time and non-refundable once a Will has been drafted and made available for download.</p>
          <h2 className="font-serif text-navy">6. Termination</h2>
          <p>You may close your account at any time. We reserve the right to terminate accounts that violate these Terms.</p>
          <h2 className="font-serif text-navy">7. Contact</h2>
          <p>Questions? Reach us at legal@castle-ewill.ng.</p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
