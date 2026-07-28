import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import signingHands from "@/assets/signing-hands.jpg";
import legacyStill from "@/assets/legacy-still-life.jpg";
import fatherDaughter from "@/assets/father-daughter.jpg";
import officeInterior from "@/assets/office-interior.jpg";

const services = [
  {
    image: signingHands,
    name: "Online Will Drafting",
    tag: "Most popular",
    body: "Our 9-step guided wizard produces a legally-binding Will tailored to Nigerian law — in under 20 minutes.",
    features: ["Personal & family details", "Beneficiary allocations", "Executor nominations", "Guardianship clauses", "Special instructions", "Lawyer review"],
  },
  {
    image: legacyStill,
    name: "Estate Planning",
    tag: "Advisory",
    body: "Bespoke succession planning for entrepreneurs, professionals and high-net-worth families.",
    features: ["1-on-1 lawyer consultation", "Multi-asset structuring", "Trust design", "Tax-aware planning", "Cross-border considerations"],
  },
  {
    image: fatherDaughter,
    name: "Guardianship Planning",
    tag: "For parents",
    body: "Nominate the right people to care for your minor children — with clarity and legal weight.",
    features: ["Primary & backup guardians", "Financial provisions", "Care instructions", "Guardian briefing pack"],
  },
  {
    image: officeInterior,
    name: "Trust Structures",
    tag: "For estates",
    body: "Establish living or testamentary trusts to preserve, protect and pass on your assets across generations.",
    features: ["Trust deed drafting", "Trustee selection", "Beneficiary schedules", "Ongoing administration support"],
  },
];

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Castle eWill & Trust" },
      { name: "description", content: "Wills, estate planning, guardianship and trust services for Nigerian families." },
      { property: "og:title", content: "Castle Services" },
      { property: "og:description", content: "Legacy services for Nigerian families." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-32">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Services</p>
          <h1 className="font-serif text-5xl leading-[1.05] text-navy sm:text-6xl lg:text-7xl">
            A service for every <span className="italic text-primary">legacy.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            From a simple Will to a multi-generational estate — we cover the full arc of succession planning.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {services.map((s, i) => (
            <article key={s.name} className={`grid gap-10 lg:grid-cols-2 lg:items-center ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}>
              <div>
                <div className="overflow-hidden rounded-3xl shadow-elegant">
                  <img src={s.image} alt={s.name} loading="lazy" className="h-[420px] w-full object-cover" />
                </div>
              </div>
              <div>
                <span className="inline-flex rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">{s.tag}</span>
                <h2 className="mt-4 font-serif text-4xl text-navy">{s.name}</h2>
                <p className="mt-4 text-lg text-muted-foreground">{s.body}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 bg-navy text-navy-foreground hover:bg-navy/90">
                  <Link to="/contact">Book a call<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
