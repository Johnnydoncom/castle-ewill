import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  FileSignature,
  Users,
  Lock,
  Scale,
  Clock,
  Check,
  ArrowRight,
  Star,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/castle-ewill-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Castle eWill & Trust — Nigeria's Premium Online Will Platform" },
      {
        name: "description",
        content:
          "Create a legally-sound Will in minutes. Castle eWill & Trust is Nigeria's most trusted online Will making platform — secure, lawyer-reviewed, and built for your legacy.",
      },
      { property: "og:title", content: "Castle eWill & Trust" },
      {
        property: "og:description",
        content:
          "Nigeria's premium online Will making platform. Protect your legacy in minutes.",
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
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
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
            <Button
              size="lg"
              asChild
              className="h-12 bg-navy px-6 text-navy-foreground shadow-elegant hover:bg-navy/90"
            >
              <Link to="/">
                Start your Will
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 border-navy/20 px-6"
            >
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              256-bit encryption
            </div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-success" />
              Lawyer reviewed
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              20-minute setup
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 -z-10 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative rounded-3xl border border-border bg-card p-8 shadow-elegant">
            <div className="mb-6 flex items-center justify-between">
              <Logo linked={false} />
              <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                Draft saved
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-medium text-navy">Will progress</span>
                  <span className="text-muted-foreground">72%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary to-gold" />
                </div>
              </div>
              {[
                ["Personal information", true],
                ["Family details", true],
                ["Beneficiaries", true],
                ["Executors & guardians", false],
                ["Review & sign", false],
              ].map(([label, done]) => (
                <div
                  key={label as string}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      done ? "bg-success text-success-foreground" : "border border-border bg-background"
                    }`}
                  >
                    {done && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <span
                    className={`text-sm ${
                      done ? "text-navy" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
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
          {[
            ["10,000+", "Wills created"],
            ["₦2.1B", "Assets protected"],
            ["4.9/5", "Client rating"],
            ["100%", "Legally compliant"],
          ].map(([n, l]) => (
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
    {
      icon: FileSignature,
      title: "Guided Will wizard",
      body: "Nine simple steps walk you through Personal Info, Family, Beneficiaries, Executors, Assets, Guardians and more.",
    },
    {
      icon: Scale,
      title: "Nigerian law compliant",
      body: "Every clause is drafted and reviewed by qualified Nigerian estate lawyers to hold up in any Probate Registry.",
    },
    {
      icon: Lock,
      title: "Bank-grade security",
      body: "AES-256 encryption at rest and in transit. Your documents are stored with the same standards as top-tier banks.",
    },
    {
      icon: Users,
      title: "Beneficiaries & guardians",
      body: "Assign spouses, children, dependents and appoint guardians — with clear percentages and fallback rules.",
    },
    {
      icon: ShieldCheck,
      title: "Executor management",
      body: "Nominate trusted executors, add contact details, and empower them with the instructions they'll need.",
    },
    {
      icon: Clock,
      title: "Update anytime",
      body: "Life changes — so should your Will. Edit, re-sign and re-download whenever you need to.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
          Everything you need
        </p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">
          A complete estate toolkit
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Purpose-built for Nigerian families — from a first Will to a complex estate.
        </p>
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="group rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant"
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-navy-foreground transition-colors group-hover:bg-gradient-to-br group-hover:from-navy group-hover:to-primary">
              <it.icon className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl text-navy">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {it.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Create your account", "Sign up in seconds with just your email. Verify and you're in."],
    ["Complete the guided wizard", "Answer simple questions about your family, assets and wishes."],
    ["Lawyer-verified & downloaded", "Review the drafted Will, sign and download your legally-binding document."],
  ];
  return (
    <section className="bg-navy-gradient py-24 text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
            How it works
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl">
            Three steps to peace of mind
          </h2>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map(([title, body], i) => (
            <div key={title} className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient font-serif text-2xl text-navy">
                {i + 1}
              </div>
              <h3 className="font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm text-navy-foreground/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  const plans = [
    {
      name: "Essential",
      price: "₦25,000",
      desc: "For a straightforward Will",
      features: ["Guided Will wizard", "PDF download", "1 year of updates", "Email support"],
      cta: "Get started",
      featured: false,
    },
    {
      name: "Family",
      price: "₦55,000",
      desc: "Most popular for families",
      features: [
        "Everything in Essential",
        "Lawyer review call",
        "Unlimited updates",
        "Priority support",
        "Guardianship clauses",
      ],
      cta: "Choose Family",
      featured: true,
    },
    {
      name: "Estate",
      price: "₦150,000",
      desc: "For complex estates",
      features: [
        "Everything in Family",
        "Dedicated estate lawyer",
        "Trust structures",
        "Executor briefing",
      ],
      cta: "Talk to us",
      featured: false,
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
          Simple pricing
        </p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">
          Transparent, one-time fees
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          No subscriptions. No hidden fees. Pay once, protect forever.
        </p>
      </div>
      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-3xl border p-8 transition-all ${
              p.featured
                ? "border-gold/50 bg-card shadow-elegant lg:-translate-y-4"
                : "border-border bg-card hover:shadow-soft"
            }`}
          >
            {p.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-gradient px-3 py-1 text-xs font-semibold text-navy">
                Most popular
              </div>
            )}
            <h3 className="font-serif text-2xl text-navy">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-serif text-4xl text-navy">{p.price}</span>
              <span className="text-sm text-muted-foreground">one-time</span>
            </div>
            <Button
              className={`mt-6 w-full ${
                p.featured
                  ? "bg-navy text-navy-foreground hover:bg-navy/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {p.cta}
            </Button>
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
  );
}

function Testimonials() {
  const items = [
    {
      quote:
        "The wizard is so simple. I had my Will ready in one lunch break, and the lawyer review gave me total confidence.",
      name: "Adaeze O.",
      role: "Doctor, Lagos",
    },
    {
      quote:
        "Finally, a Nigerian platform that feels world-class. The design alone convinced me to trust them with my estate.",
      name: "Ibrahim K.",
      role: "Entrepreneur, Abuja",
    },
    {
      quote:
        "As an executor for my father, this made a painful process manageable. Clear, dignified, professional.",
      name: "Chidinma E.",
      role: "Accountant, Port Harcourt",
    },
  ];
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2 className="font-serif text-4xl text-navy sm:text-5xl">
            Trusted by families across Nigeria
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card p-8 shadow-soft"
            >
              <div className="mb-4 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="font-serif text-lg leading-relaxed text-navy">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <div className="text-sm font-semibold text-navy">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
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
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
          FAQs
        </p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">
          Answers to common questions
        </h2>
      </div>
      <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map(([q, a]) => (
          <details key={q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-navy">
              {q}
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-navy transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link to="/faqs">See all FAQs</Link>
        </Button>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-navy-gradient p-12 text-center shadow-elegant sm:p-16">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        <img
          src={logoAsset.url}
          alt=""
          className="mx-auto mb-6 h-16 w-16 rounded-full"
        />
        <h2 className="font-serif text-4xl text-navy-foreground sm:text-5xl">
          Your family deserves clarity.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-foreground/70">
          Start your legally-binding Will today — it takes less time than a coffee break.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            className="h-12 bg-gold-gradient px-8 font-semibold text-navy hover:opacity-90"
          >
            Start your Will
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white/20 bg-transparent px-8 text-navy-foreground hover:bg-white/10"
          >
            Talk to an advisor
          </Button>
        </div>
      </div>
    </section>
  );
}
