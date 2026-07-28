import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ShieldCheck, Scale, Clock, Star, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/castle-ewill-logo.png.asset.json";
import heroFamily from "@/assets/hero-family.jpg";
import signingHands from "@/assets/signing-hands.jpg";
import officeInterior from "@/assets/office-interior.jpg";
import legacyStill from "@/assets/legacy-still-life.jpg";
import fatherDaughter from "@/assets/father-daughter.jpg";
import advisorPortrait from "@/assets/advisor-portrait.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Castle eWill & Trust — Nigeria's Premium Online Will Platform" },
      {
        name: "description",
        content:
          "Create a legally-sound Will in minutes. Nigeria's most trusted online Will making platform — secure, lawyer-reviewed, and built for your legacy.",
      },
      { property: "og:title", content: "Castle eWill & Trust" },
      {
        property: "og:description",
        content: "Nigeria's premium online Will making platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <LegacyBanner />
      <PricingPreview />
      <Testimonials />
      <FAQPreview />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-navy">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Nigeria's #1 Online Will Platform
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-navy sm:text-6xl lg:text-7xl">
            Your legacy,
            <br />
            <span className="italic text-primary">secured with care.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Draft a legally-sound Will in under 20 minutes. Lawyer-reviewed,
            bank-grade secure, and made for Nigerian families.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="h-12 bg-navy px-6 text-navy-foreground shadow-elegant hover:bg-navy/90">
              <Link to="/">Start your Will<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 border-navy/20 px-6">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" />256-bit encryption</div>
            <div className="flex items-center gap-2"><Scale className="h-4 w-4 text-success" />Lawyer reviewed</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-success" />20-minute setup</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gold/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-elegant">
            <img
              src={heroFamily}
              alt="A multi-generational Nigerian family at home"
              width={1600}
              height={1200}
              className="h-[520px] w-full object-cover sm:h-[600px]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent p-6 pt-24">
              <div className="flex items-center gap-3">
                <img src={logoAsset.url} alt="" className="h-10 w-10 rounded-full ring-2 ring-gold/40" />
                <div>
                  <p className="font-serif text-navy-foreground">The Adeyemi family</p>
                  <p className="text-xs text-navy-foreground/70">Will completed in 18 minutes</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-elegant sm:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">Will secured</p>
                <p className="text-xs text-muted-foreground">Stored & lawyer-verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by thousands of Nigerian families
        </p>
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[["10,000+", "Wills created"], ["₦2.1B", "Assets protected"], ["4.9/5", "Client rating"], ["100%", "Legally compliant"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-serif text-3xl text-navy">{n}</div>
              <div className="mt-1 text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { image: signingHands, title: "Legally-sound documents", body: "Every Will is drafted to comply with the Nigerian Wills Act and reviewed by qualified estate lawyers." },
    { image: legacyStill, title: "Complete estate toolkit", body: "Beneficiaries, executors, guardians, assets, special instructions — all handled in one guided flow." },
    { image: officeInterior, title: "Backed by a real firm", body: "Castle is built with practising Nigerian solicitors, not just software engineers. Your Will is in expert hands." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Everything you need</p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">A complete estate toolkit</h2>
        <p className="mt-4 text-lg text-muted-foreground">Purpose-built for Nigerian families — from a first Will to a complex estate.</p>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {items.map((it) => (
          <article key={it.title} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant">
            <div className="relative h-56 overflow-hidden">
              <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent" />
            </div>
            <div className="p-8">
              <h3 className="font-serif text-xl text-navy">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Create your account", "Sign up in seconds with just your email. Verify and you're in."],
    ["Complete the guided wizard", "Answer simple questions about your family, assets and wishes."],
    ["Lawyer-verified & downloaded", "Review, sign and download your legally-binding document."],
  ];
  return (
    <section className="bg-navy-gradient py-24 text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">How it works</p>
          <h2 className="font-serif text-4xl sm:text-5xl">Three steps to peace of mind</h2>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map(([title, body], i) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient font-serif text-2xl text-navy">{i + 1}</div>
              <h3 className="font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm text-navy-foreground/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegacyBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative overflow-hidden rounded-3xl shadow-elegant">
          <img src={fatherDaughter} alt="A Nigerian father and daughter reading together" loading="lazy" className="h-[520px] w-full object-cover" />
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Why Castle</p>
          <h2 className="font-serif text-4xl text-navy sm:text-5xl">Protecting what matters — before it matters.</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            A Will is a love letter to the people you leave behind. Castle makes writing one dignified, private and simple —
            so your family is spared the courts, the disputes and the guessing.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Clear guardianship for minor children",
              "Precise beneficiary allocations, in your words",
              "A trusted executor briefed and ready",
              "A private vault for your final wishes",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/15">
                  <Check className="h-3.5 w-3.5 text-gold" />
                </div>
                <span className="text-foreground/85">{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 bg-navy text-navy-foreground hover:bg-navy/90">
            <Link to="/about">Read our story<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  const plans = [
    { name: "Essential", price: "₦25,000", desc: "For a straightforward Will", features: ["Guided Will wizard", "PDF download", "1 year of updates", "Email support"], cta: "Get started", featured: false },
    { name: "Family", price: "₦55,000", desc: "Most popular for families", features: ["Everything in Essential", "Lawyer review call", "Unlimited updates", "Priority support", "Guardianship clauses"], cta: "Choose Family", featured: true },
    { name: "Estate", price: "₦150,000", desc: "For complex estates", features: ["Everything in Family", "Dedicated estate lawyer", "Trust structures", "Executor briefing"], cta: "Talk to us", featured: false },
  ];
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Simple pricing</p>
          <h2 className="font-serif text-4xl text-navy sm:text-5xl">Transparent, one-time fees</h2>
          <p className="mt-4 text-lg text-muted-foreground">No subscriptions. No hidden fees. Pay once, protect forever.</p>
        </div>
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-3xl border p-8 transition-all ${p.featured ? "border-gold/50 bg-card shadow-elegant lg:-translate-y-4" : "border-border bg-card hover:shadow-soft"}`}>
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
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { quote: "The wizard is so simple. I had my Will ready in one lunch break, and the lawyer review gave me total confidence.", name: "Adaeze O.", role: "Doctor, Lagos" },
    { quote: "Finally, a Nigerian platform that feels world-class. The design alone convinced me to trust them with my estate.", name: "Ibrahim K.", role: "Entrepreneur, Abuja" },
    { quote: "As an executor for my father, this made a painful process manageable. Clear, dignified, professional.", name: "Chidinma E.", role: "Accountant, Port Harcourt" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-3xl shadow-elegant">
            <img src={advisorPortrait} alt="Castle estate advisor portrait" loading="lazy" className="h-[500px] w-full object-cover" />
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <p className="font-serif text-lg text-navy">Barr. Emeka Okafor</p>
            <p className="text-sm text-muted-foreground">Head of Estate Practice, Castle</p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Testimonials</p>
          <h2 className="font-serif text-4xl text-navy sm:text-5xl">Trusted by families across Nigeria</h2>
          <div className="mt-10 space-y-5">
            {items.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-border bg-card p-7 shadow-soft">
                <div className="mb-3 flex gap-0.5 text-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <blockquote className="font-serif text-lg leading-relaxed text-navy">"{t.quote}"</blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <div className="text-sm font-semibold text-navy">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQPreview() {
  const faqs = [
    ["Is a Will created on Castle legally binding in Nigeria?", "Yes. Every Will is drafted to comply with the Wills Act and reviewed by qualified Nigerian estate lawyers. Once signed and witnessed correctly, it is fully binding."],
    ["How long does it take to create a Will?", "Most clients finish in 15–20 minutes. You can save your progress and return anytime."],
    ["Can I update my Will later?", "Absolutely. Your account keeps your Will in a secure vault. Update, re-sign and re-download whenever life changes."],
    ["How secure is my data?", "We use AES-256 encryption, audited infrastructure and strict access controls — the same standards as leading banks."],
  ];
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">FAQs</p>
          <h2 className="font-serif text-4xl text-navy sm:text-5xl">Answers to common questions</h2>
        </div>
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-navy">
                {q}
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-navy transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" asChild><Link to="/faqs">See all FAQs</Link></Button>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl shadow-elegant">
        <img src={legacyStill} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
        <div className="relative p-10 text-center sm:p-16">
          <img src={logoAsset.url} alt="" className="mx-auto mb-6 h-16 w-16 rounded-full ring-2 ring-gold/40" />
          <h2 className="font-serif text-4xl text-navy-foreground sm:text-5xl">Your family deserves clarity.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-foreground/75">Start your legally-binding Will today — it takes less time than a coffee break.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-12 bg-gold-gradient px-8 font-semibold text-navy hover:opacity-90">Start your Will<ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button size="lg" variant="outline" className="h-12 border-white/30 bg-transparent px-8 text-navy-foreground hover:bg-white/10 hover:text-navy-foreground">Talk to an advisor</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
