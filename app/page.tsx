import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Star } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Castle eWill & Trust — Nigeria's Premium Online Will Platform",
  description:
    "Create a legally-sound Will in minutes. Nigeria's most trusted online Will making platform — secure, lawyer-reviewed, and built for your legacy.",
  openGraph: {
    title: "Castle eWill & Trust — Nigeria's Premium Online Will Platform",
    description:
      "Create a legally-sound Will in minutes. Nigeria's most trusted online Will making platform — secure, lawyer-reviewed, and built for your legacy.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <TrustBar />
        <Features />
        <Assurances />
        <HowItWorks />
        <JournalPreview />
        <LegacyBanner />
        <PricingPreview />
        <Testimonials />
        <FAQPreview />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-navy-foreground">
      {/* paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }}
      />
      {/* huge background monogram */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 select-none font-serif text-[42rem] leading-none text-gold/[0.045] lg:block"
      >
        C
      </div>

      {/* Editorial cover */}
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-7">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">
              The Will Papers &middot; Issue 001
            </span>
          </div>

          <h1 className="font-serif text-[3.25rem] leading-[0.95] tracking-[-0.02em] sm:text-7xl lg:text-[6.25rem]">
            Write the
            <br />
            <span className="italic text-gold">document</span>
            <br />
            your family
            <br />
            will thank you
            <br />
            <span className="relative inline-block">
              for.
              <span className="absolute -bottom-2 left-0 h-[3px] w-full bg-gold" />
            </span>
          </h1>

          <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-md font-serif text-lg italic leading-relaxed text-navy-foreground/75">
              A Nigerian estate house, reimagined for the browser. Draft a legally-binding Will in
              under twenty minutes — reviewed by qualified solicitors, sealed in an encrypted vault.
            </p>
            <div className="hidden font-serif text-6xl leading-none text-gold/40 sm:block">§</div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button
              size="lg"
              asChild
              className="group h-14 rounded-none bg-gold px-8 font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy hover:bg-gold/90"
            >
              <Link href="/register">
                Begin your Will
                <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-3 text-sm uppercase tracking-[0.25em] text-navy-foreground/80 hover:text-gold"
            >
              <span className="h-px w-8 bg-current transition-all group-hover:w-14" />
              Read the pricing sheet
            </Link>
          </div>
        </div>

        {/* Right: editorial plate */}
        <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
          <div className="relative overflow-hidden rounded-sm">
            <Image
              src="/images/hero-family.jpg"
              alt="A Nigerian family at home"
              width={600}
              height={700}
              className="h-[560px] w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="font-serif text-[9px] uppercase tracking-[0.4em] text-gold">
                Plate I &mdash; The Family
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "Nigerian-law compliant",
    "Bank-grade encryption",
    "Lawyer-reviewed",
    "Available 24/7",
    "Probate-registry ready",
  ];
  return (
    <div className="border-y border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-2 font-serif text-[10px] uppercase tracking-[0.3em] text-navy/70"
          >
            <span className="h-1 w-1 rounded-full bg-gold" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      numeral: "I",
      title: "Guided Will wizard",
      body: "Nine considered sections, each explained in plain English. No legal jargon — just clarity.",
    },
    {
      numeral: "II",
      title: "Solicitor review",
      body: "Every Will is checked by admitted Nigerian counsel before it is sealed and stored.",
    },
    {
      numeral: "III",
      title: "Encrypted vault",
      body: "AES-256 encryption at rest and in transit. Access controls audited quarterly.",
    },
    {
      numeral: "IV",
      title: "Witness coordination",
      body: "Invite your two required witnesses directly from the dashboard — we manage the scheduling.",
    },
    {
      numeral: "V",
      title: "Executor briefing",
      body: "A comprehensive handover pack prepared for your executor, ready the moment it is needed.",
    },
    {
      numeral: "VI",
      title: "Unlimited updates",
      body: "Life changes. Update your Will at any time on qualifying plans — no additional fee.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
          Features
        </p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">
          Everything your Will needs.{" "}
          <span className="italic text-primary">Nothing it doesn&apos;t.</span>
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.numeral}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-elegant"
          >
            <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {f.numeral}
            </span>
            <h3 className="mt-3 font-serif text-xl text-navy">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Assurances() {
  return (
    <section className="bg-navy-gradient py-24 text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">
              Our assurances
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl">Yours, and yours alone.</h2>
            <p className="mt-6 max-w-lg text-navy-foreground/70">
              Your Will, your data, your family&apos;s future — protected by design, not just
              policy. Castle is built so that even we cannot access your documents without your
              explicit instruction.
            </p>
          </div>
          <div className="space-y-4">
            {[
              [
                "Zero-knowledge storage",
                "Your documents are encrypted before they reach our servers.",
              ],
              [
                "No data brokering",
                "We have never sold personal data and our charter prohibits it.",
              ],
              ["Independent escrow", "Documents are held in escrow with a neutral legal partner."],
              ["NDPA compliant", "Fully aligned with the Nigeria Data Protection Act 2023."],
            ].map(([title, body]) => (
              <div
                key={title as string}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-serif text-sm font-medium">{title as string}</p>
                  <p className="mt-1 text-xs text-navy-foreground/65">{body as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Create account", body: "Three fields. No credit card." },
    { n: "02", title: "Draft your Will", body: "Nine guided sections, plain English throughout." },
    { n: "03", title: "Counsel review", body: "A qualified solicitor checks every clause." },
    { n: "04", title: "Sign & seal", body: "Two witnesses, your signature, encrypted vault." },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
          How it works
        </p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">
          Four steps. <span className="italic text-primary">One afternoon.</span>
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.n} className="relative">
            {i < steps.length - 1 && (
              <div className="absolute left-full top-8 hidden h-px w-6 bg-border lg:block" />
            )}
            <div className="rounded-2xl border border-border bg-surface p-8">
              <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Step {s.n}
              </span>
              <h3 className="mt-3 font-serif text-xl text-navy">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JournalPreview() {
  const posts = [
    {
      tag: "Wills 101",
      title: "What happens if you die without a Will in Nigeria?",
      href: "/blog",
    },
    { tag: "Guardianship", title: "Choosing the right guardian for your children", href: "/blog" },
    {
      tag: "Estate planning",
      title: "5 clauses every Nigerian Will should include",
      href: "/blog",
    },
  ];

  return (
    <section className="border-t border-border bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              The Journal
            </p>
            <h2 className="font-serif text-3xl text-navy sm:text-4xl">Notes on legacy.</h2>
          </div>
          <Link
            href="/blog"
            className="hidden text-sm uppercase tracking-widest text-muted-foreground hover:text-navy sm:block"
          >
            All articles &rarr;
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-soft"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                {p.tag}
              </span>
              <h3 className="mt-3 font-serif text-xl leading-snug text-navy group-hover:text-primary">
                {p.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegacyBanner() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src="/images/legacy-still-life.jpg"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-navy/88" />
      <div className="relative mx-auto max-w-4xl px-4 py-28 text-center text-navy-foreground sm:px-6">
        <p className="mb-4 font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
          Your legacy
        </p>
        <h2 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
          The document you write today <span className="italic text-gold">shapes the peace</span>{" "}
          your family carries forever.
        </h2>
        <Button
          size="lg"
          asChild
          className="mt-10 h-14 rounded-none bg-gold px-10 font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy hover:bg-gold/90"
        >
          <Link href="/register">Begin your Will today</Link>
        </Button>
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
      features: ["Guided wizard", "PDF download", "1 year updates"],
      featured: false,
    },
    {
      name: "Family",
      price: "₦55,000",
      desc: "Most popular for families",
      features: ["Lawyer review", "Unlimited updates", "Secure vault"],
      featured: true,
    },
    {
      name: "Estate",
      price: "₦150,000",
      desc: "For complex estates",
      features: ["Dedicated lawyer", "Trust structures", "Annual review"],
      featured: false,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Pricing</p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">
          One price. <span className="italic text-primary">Total peace.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">No subscriptions. Pay once.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-3xl border p-8 ${
              p.featured
                ? "border-gold/50 bg-card shadow-elegant lg:-translate-y-3"
                : "border-border bg-card"
            }`}
          >
            {p.featured && (
              <div className="mb-4 inline-flex rounded-full bg-gold-gradient px-3 py-1 text-xs font-semibold text-navy">
                Most popular
              </div>
            )}
            <h3 className="font-serif text-2xl text-navy">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-serif text-3xl text-navy">{p.price}</span>
              <span className="text-sm text-muted-foreground">one-time</span>
            </div>
            <ul className="mt-6 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className={`mt-6 w-full ${
                p.featured
                  ? "bg-navy text-navy-foreground hover:bg-navy/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Link href="/pricing">Get started</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      quote:
        "Castle made the whole process dignified. I felt like I was at an actual estate firm, not filling in a web form.",
      name: "Adaeze O.",
      role: "Lagos, Family plan",
      stars: 5,
    },
    {
      quote:
        "I had put this off for years. Castle made it simple — and honestly, beautiful. My Will was reviewed in 24 hours.",
      name: "Tunde A.",
      role: "Abuja, Estate plan",
      stars: 5,
    },
    {
      quote:
        "The lawyer review was what sold me. Knowing a real barrister checked every clause gave our family peace of mind.",
      name: "Ngozi B.",
      role: "Port Harcourt, Family plan",
      stars: 5,
    },
  ];

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2 className="font-serif text-4xl text-navy sm:text-5xl">Words from our clients.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card p-8 shadow-soft"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="font-serif text-lg leading-relaxed text-navy">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-semibold text-navy">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
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
    [
      "Is a Will created on Castle legally binding?",
      "Yes. Every Will is drafted in line with the Wills Act and reviewed by qualified Nigerian estate lawyers.",
    ],
    [
      "How long does it take?",
      "Most clients finish in 15–20 minutes. You can save progress and return anytime.",
    ],
    [
      "Can I update my Will later?",
      "Yes — unlimited updates on Family and Estate plans. Simply log in, revise and re-sign.",
    ],
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">FAQs</p>
        <h2 className="font-serif text-4xl text-navy sm:text-5xl">Common questions.</h2>
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map(([q, a]) => (
          <details key={q} className="group px-8 py-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-navy">
              {q}
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-navy transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/faqs"
          className="text-sm uppercase tracking-widest text-muted-foreground hover:text-navy"
        >
          See all questions &rarr;
        </Link>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-border bg-navy py-24 text-navy-foreground">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="mb-4 font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
          Begin today
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl">
          Your family&apos;s peace of mind <span className="italic text-gold">starts here.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-navy-foreground/70">
          Join thousands of Nigerian families who have secured their legacy with Castle.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="h-14 rounded-none bg-gold px-10 font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy hover:bg-gold/90"
          >
            <Link href="/register">Begin your Will</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-14 rounded-none border-white/30 px-8 text-[13px] uppercase tracking-[0.2em] text-navy-foreground hover:bg-white/10"
          >
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
