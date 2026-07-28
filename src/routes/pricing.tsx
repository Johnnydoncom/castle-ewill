import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import legacyStill from "@/assets/legacy-still-life.jpg";

const plans = [
  { name: "Essential", price: "₦25,000", desc: "For a straightforward Will", features: ["Guided Will wizard", "PDF download", "1 year of updates", "Email support"], cta: "Get started", featured: false },
  { name: "Family", price: "₦55,000", desc: "Most popular for families", features: ["Everything in Essential", "Lawyer review call", "Unlimited updates", "Priority support", "Guardianship clauses", "Secure vault storage"], cta: "Choose Family", featured: true },
  { name: "Estate", price: "₦150,000", desc: "For complex estates", features: ["Everything in Family", "Dedicated estate lawyer", "Trust structures", "Executor briefing", "Annual review", "In-person meeting"], cta: "Talk to us", featured: false },
];

const compare = [
  ["Guided Will wizard", true, true, true],
  ["PDF download", true, true, true],
  ["Lawyer review call", false, true, true],
  ["Unlimited updates", "1 year", true, true],
  ["Trust structures", false, false, true],
  ["Dedicated advisor", false, false, true],
  ["Priority support", false, true, true],
] as const;

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Castle eWill & Trust" },
      { name: "description", content: "Simple, one-time pricing for Wills and estate planning services in Nigeria." },
      { property: "og:title", content: "Castle Pricing" },
      { property: "og:description", content: "Transparent, one-time pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Pricing</p>
          <h1 className="font-serif text-5xl text-navy sm:text-6xl">
            One price. <span className="italic text-primary">Total peace.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            No subscriptions. No hidden fees. Pay once, protect forever.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-3xl border p-8 ${p.featured ? "border-gold/50 bg-card shadow-elegant lg:-translate-y-4" : "border-border bg-card hover:shadow-soft"}`}>
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-gradient px-3 py-1 text-xs font-semibold text-navy">Most popular</div>
              )}
              <h3 className="font-serif text-2xl text-navy">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-serif text-4xl text-navy">{p.price}</span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>
              <Button className={`mt-6 w-full ${p.featured ? "bg-navy text-navy-foreground hover:bg-navy/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{p.cta}</Button>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl text-navy sm:text-4xl">Compare plans</h2>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-navy">
              <tr>
                <th className="px-6 py-4 font-semibold">Feature</th>
                <th className="px-6 py-4 font-semibold">Essential</th>
                <th className="px-6 py-4 font-semibold">Family</th>
                <th className="px-6 py-4 font-semibold">Estate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {compare.map((row) => (
                <tr key={row[0] as string}>
                  <td className="px-6 py-4 text-foreground/85">{row[0]}</td>
                  {row.slice(1).map((v, i) => (
                    <td key={i} className="px-6 py-4">
                      {v === true ? <Check className="h-4 w-4 text-success" /> : v === false ? <span className="text-muted-foreground">—</span> : <span className="text-navy">{v as string}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-elegant">
          <img src={legacyStill} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-navy/85" />
          <div className="relative p-12 text-center text-navy-foreground sm:p-16">
            <h2 className="font-serif text-4xl sm:text-5xl">Not sure which plan is right?</h2>
            <p className="mx-auto mt-4 max-w-xl text-navy-foreground/75">Book a free 15-minute discovery call with an advisor.</p>
            <Button size="lg" asChild className="mt-8 bg-gold-gradient px-8 font-semibold text-navy hover:opacity-90">
              <Link to="/contact">Book free call</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
