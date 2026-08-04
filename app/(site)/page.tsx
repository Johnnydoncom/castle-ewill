import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSlides } from "@/components/site/HeroSlides";

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
    <>
      <HeroSlides />
      <TrustBar />
      <Proof />
      <Steps />
      <Features />

      <WhyCastle />
      <PricingPreview />
      <Testimonials />

      <Assurances />
      <JournalPreview />
      <FAQPreview />
    </>
  );
}


function TrustBar() {
  const items = [
    "Nigerian Wills Act compliant",
    "Solicitor reviewed",
    "AES-256 encrypted vault",
    "Executor & guardian clauses",
    "Unlimited updates",
    "One-time fee — no subscription",
  ];
  return (
    <div className="overflow-hidden border-b border-border bg-surface py-3.5">
      <div className="flex w-max animate-[ticker_38s_linear_infinite] gap-10 whitespace-nowrap pr-10">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-10">
            {items.map((t) => (
              <span
                key={t}
                className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-gold" />
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

function Proof() {
  const stats = [
    ["10,000+", "Wills created"],
    ["₦2.1B", "Assets protected"],
    ["4.9/5", "Client rating"],
    ["18 min", "Median completion"],
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-20">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 shrink-0 bg-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
              Why families choose Castle
            </span>
          </div>
          <h2 className="mt-6 font-serif text-3xl leading-[1.05] text-navy sm:text-5xl">
            Estate planning without the
            <span className="italic text-primary"> chambers, the wait, or the jargon.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Traditional Will writing in Nigeria means appointments, paperwork and fees
            that scale with confusion. Castle replaces that with a guided flow you can
            finish over lunch — and a solicitor who checks it before you sign.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
            {stats.map(([n, l]) => (
              <div key={l} className="bg-card px-6 py-7">
                <div className="font-serif text-3xl text-navy sm:text-4xl">{n}</div>
                <div className="mt-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] shadow-elegant">
            <img
              src="/images/office-interior.jpg"
              alt="Castle's estate practice office in Lagos"
              loading="lazy"
              className="h-[420px] w-full object-cover sm:h-[560px]"
            />
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-soft sm:absolute sm:-bottom-8 sm:left-8 sm:right-8 sm:mt-0">
            <p className="min-w-0 font-serif text-base italic text-navy">
              “Everything a Nigerian estate lawyer would ask you — in plain language.”
            </p>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-gold">
              Castle method
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    { n: "01", title: "Tell us about you", body: "Family, dependants, marriage and the assets you hold — answered as simple questions.", },
    { n: "02", title: "Decide who gets what", body: "Beneficiaries, guardians for children, executors, gifts and final wishes.", },
    { n: "03", title: "Sign, witness, store", body: "We guide the signing and witnessing, then seal the Will in your encrypted vault.", },
  ];
  return (
    <section className="relative overflow-hidden bg-navy py-20 text-navy-foreground lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(700px 400px at 90% 0%, color-mix(in oklab, var(--primary) 28%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
              Three steps
            </span>
            <h2 className="mt-5 max-w-xl font-serif text-3xl leading-[1.05] sm:text-5xl">
              From first question to signed testament.
            </h2>
          </div>
          <Link
            href="/register"
            className="group inline-flex items-center gap-3 self-start text-[12px] font-semibold uppercase tracking-[0.2em] text-gold lg:self-end"
          >
            <span className="h-px w-8 bg-current transition-all group-hover:w-14" />
            Begin now
          </Link>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="bg-navy/70 p-8 lg:p-10">
              <div className="font-serif text-base text-gold">Step {s.n}</div>
              <h3 className="mt-6 font-serif text-2xl">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-foreground/70">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 hidden md:grid gap-4 sm:grid-cols-3">
          {['/images/signing-hands.jpg', '/images/father-daughter.jpg', '/images/legacy-still-life.jpg'].map((src, i) => (
            <div key={i} className="overflow-hidden rounded-2xl">
              <Image
                src={src}
                alt=""
                loading="lazy"
                width={600}
                height={600}
                className="h-44 w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105 sm:h-56"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
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

function WhyCastle() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="relative order-2 overflow-hidden rounded-[2rem] shadow-elegant lg:order-1">
          <img
            src="/images/father-daughter.jpg"
            alt="A Nigerian father and daughter reading together"
            loading="lazy"
            width={600}
            height={600}
            className="h-[420px] w-full object-cover sm:h-[560px]"
          />
        </div>
        <div className="order-1 lg:order-2">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 shrink-0 bg-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
              What&rsquo;s inside
            </span>
          </div>
          <h2 className="mt-6 font-serif text-3xl leading-[1.05] text-navy sm:text-5xl">
            Protecting what matters — before it matters.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A Will is a love letter to the people you leave behind. Castle makes writing
            one dignified, private and simple — sparing your family the courts, the
            disputes and the guessing.
          </p>
          <ul className="mt-9 divide-y divide-border border-y border-border">
            {[
              "Clear guardianship for minor children",
              "Precise beneficiary allocations, in your words",
              "A trusted executor briefed and ready",
              "A private vault for your final wishes",
            ].map((f) => (
              <li key={f} className="flex items-start gap-4 py-4">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15">
                  <Check className="h-3.5 w-3.5 text-gold" />
                </span>
                <span className="min-w-0 text-foreground/85">{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/about"
            className="group mt-9 inline-flex items-center gap-3 rounded-full bg-navy px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-navy-foreground transition-all hover:shadow-elegant"
          >
            Read our story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
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
      features: ["Guided Will wizard", "PDF download", "1 year of updates", "Email support"],
      featured: false,
    },
    {
      name: "Family",
      price: "₦55,000",
      desc: "Most chosen by families",
      features: [
        "Everything in Essential",
        "Solicitor review call",
        "Unlimited updates",
        "Guardianship clauses",
        "Priority support",
      ],
      featured: true,
    },
    {
      name: "Estate",
      price: "₦150,000",
      desc: "For complex estates & trusts",
      features: ["Everything in Family", "Dedicated estate lawyer", "Trust structures", "Executor briefing"],
      featured: false,
    },
  ];
  return (
    <section className="border-y border-border bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
              One-time fees
            </span>
            <h2 className="mt-5 max-w-xl font-serif text-3xl leading-[1.05] text-navy sm:text-5xl">
              Pay once. No subscription, ever.
            </h2>
          </div>
          <Link
            href="/pricing"
            className="group inline-flex shrink-0 items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy"
          >
            <span className="h-px w-8 bg-gold transition-all group-hover:w-14" />
            Compare in full
          </Link>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-[1.75rem] border p-8 transition-all ${p.featured
                ? "border-gold/50 bg-navy text-navy-foreground shadow-elegant lg:-translate-y-4"
                : "border-border bg-card hover:-translate-y-1 hover:shadow-soft"
                }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy">
                  Most chosen
                </span>
              )}
              <h3 className={`font-serif text-2xl ${p.featured ? "" : "text-navy"}`}>{p.name}</h3>
              <p className={`mt-1 text-sm ${p.featured ? "text-navy-foreground/65" : "text-muted-foreground"}`}>
                {p.desc}
              </p>
              <div className="mt-7 flex items-baseline gap-2">
                <span className={`font-serif text-4xl ${p.featured ? "text-gold" : "text-navy"}`}>
                  {p.price}
                </span>
                <span className={`text-xs uppercase tracking-[0.18em] ${p.featured ? "text-navy-foreground/50" : "text-muted-foreground"}`}>
                  one-time
                </span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-gold" : "text-success"}`} />
                    <span className={p.featured ? "text-navy-foreground/80" : "text-foreground/80"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-9 inline-flex h-12 items-center justify-center rounded-full text-[13px] font-semibold uppercase tracking-[0.16em] transition-all ${p.featured
                  ? "bg-gold text-navy hover:shadow-gold"
                  : "border border-navy/15 text-navy hover:bg-navy hover:text-navy-foreground"
                  }`}
              >
                Choose {p.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function Testimonials() {
  const items = [
    {
      quote:
        "The wizard is so simple. I had my Will ready in one lunch break, and the solicitor review gave me total confidence.",
      name: "Adaeze O.",
      role: "Doctor, Lagos",
    },
    {
      quote:
        "Finally, a Nigerian platform that feels world-class. The clarity alone convinced me to trust them with my estate.",
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
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.3fr] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-32">
          <div className="overflow-hidden rounded-[2rem] shadow-elegant">
            <img
              src={`/images/advisor-portrait.jpg`}
              alt="Barr. Emeka Okafor, Head of Estate Practice at Castle"
              loading="lazy"
              className="h-[360px] w-full object-cover sm:h-[480px]"
            />
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-card p-6">
            <p className="font-serif text-lg text-navy">Barr. Emeka Okafor</p>
            <p className="text-sm text-muted-foreground">Head of Estate Practice, Castle</p>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
            Testimonials
          </span>
          <h2 className="mt-5 font-serif text-3xl leading-[1.05] text-navy sm:text-5xl">
            Trusted by families across Nigeria
          </h2>
          <div className="mt-10 space-y-5">
            {items.map((t) => (
              <figure key={t.name} className="rounded-[1.5rem] border border-border bg-card p-7 shadow-soft">
                <div className="mb-4 flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="font-serif text-lg leading-relaxed text-navy">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border pt-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-navy">{t.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-gold">
                    Verified client
                  </span>
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
    [
      "Is a Will created on Castle legally binding in Nigeria?",
      "Yes. Every Will is drafted to comply with the Wills Act and reviewed by qualified Nigerian estate lawyers. Once signed and witnessed correctly, it is fully binding.",
    ],
    [
      "How long does it take to create a Will?",
      "Most clients finish in 15–20 minutes. You can save your progress and return anytime.",
    ],
    [
      "Can I update my Will later?",
      "Absolutely. Your account keeps your Will in a secure vault. Update, re-sign and re-download whenever life changes.",
    ],
    [
      "How secure is my data?",
      "We use AES-256 encryption, audited infrastructure and strict access controls — the same standards as leading banks.",
    ],
  ];
  return (
    <section className="border-t border-border bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
              Questions
            </span>
            <h2 className="mt-5 font-serif text-3xl leading-[1.05] text-navy sm:text-4xl">
              Straight answers, no legalese.
            </h2>
            <Link
              href="/faqs"
              className="group mt-6 inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy"
            >
              <span className="h-px w-8 bg-gold transition-all group-hover:w-14" />
              All FAQs
            </Link>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-serif text-lg text-navy">
                  <span className="min-w-0">{q}</span>
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-navy transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}