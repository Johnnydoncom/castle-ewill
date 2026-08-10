import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSlides } from "@/components/site/HeroSlides";
import { PlanCard, PricingFootnotes } from "@/components/pricing/PlanCard";
import { getPriceList } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Castle eWill & Trust — Nigeria's Premium Online Will Platform",
  description:
    "Write your own Will online, in compliance with Nigerian law. Draft it, print it, and have a solicitor review it only if you want one.",
  openGraph: {
    title: "Castle eWill & Trust — Nigeria's Premium Online Will Platform",
    description:
      "Write your own Will online, in compliance with Nigerian law. Draft it, print it, and have a solicitor review it only if you want one.",
    type: "website",
  },
};

/**
 * Prices are read per request, so a change in the admin console is live on the
 * homepage immediately — and a build run without a reachable backend cannot
 * bake a stale price into static HTML.
 */
export const dynamic = "force-dynamic";

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

      <Assurances />
      <JournalPreview />
      <FAQPreview />
    </>
  );
}


function TrustBar() {
  const items = [
    "Compliant with Nigerian law",
    // "Solicitor reviewed" was a promise to every visitor, but review is an
    // optional extra — included with Premium, chargeable on Basic. Claiming it
    // universally sells a Basic client something they have not bought.
    "Optional solicitor review",
    "AES-256 encrypted vault",
    "Executor & guardian clauses",
    // Both of these were unqualified too. Free updates come with the annual
    // subscription (or a year of Premium), and the charge is per Will rather
    // than a flat one-off, since lodging is compulsory on top of Basic.
    "Free updates while subscribed",
    "Charged once, per Will",
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
  /*
   * Verifiable facts about the product, not invented metrics.
   *
   * These read "10,000+ Wills created / ₦2.1B assets protected / 4.9-5 client
   * rating / 18 min median completion" — none of which anyone has measured,
   * on a platform that has not launched. Fabricated performance figures are
   * the same fault as a fabricated testimonial, and on a regulated service
   * they are a good deal worse than an embarrassment. Replaced with claims
   * the codebase itself makes true.
   */
  const stats = [
    ["9", "Guided sections"],
    ["AES-256", "Encrypted at rest"],
    ["3", "Identity checks"],
    ["RC 9701348", "Registered in Nigeria"],
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
            Your Will, written
            <span className="italic text-primary"> by you.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Making a Will in Nigeria usually means an appointment, an hourly rate and a
            wait. Castle is a platform, not a law firm: you answer the questions yourself,
            in your own time, and print the finished document the same day. A solicitor
            reads it only if you ask for one — and only then do you pay for one.
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
              “Every question a Nigerian estate lawyer would ask — without the appointment.”
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
  /*
   * The seven stages a client actually moves through, matching `WillJourney`
   * on the backend exactly. Worth keeping in step with it: a page that
   * promises a stage the server does not recognise is a support ticket.
   *
   * Legal review is marked optional because it is — you can skip it with one
   * click and print the same day. That is the whole positioning of this
   * platform and the homepage should not imply a solicitor stands between you
   * and your own Will.
   */
  const steps = [
    { n: "01", title: "Prepare", body: "Answer nine guided sections, at your own pace. Nothing to pay to start, and nothing to book." },
    { n: "02", title: "Legal review", body: "Optional. Have a Nigerian solicitor read it clause by clause for a fixed fee — or skip it in one click.", optional: true },
    { n: "03", title: "Print", body: "Pay, confirm your identity once, then download the finished instrument — branded, sealed and ready to sign." },
    { n: "04", title: "Execute", body: "Sign it in front of two witnesses, who sign in front of you. We show you exactly how." },
    { n: "05", title: "Lodge", body: "We file the executed Will with the Probate Registry on your behalf." },
    { n: "06", title: "Protect", body: "Held in an encrypted vault and released only to the executors you named." },
    { n: "07", title: "Update", body: "Life changes. Amend and re-issue whenever you need to, free while your subscription runs." },
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
              Seven stages
            </span>
            <h2 className="mt-5 max-w-xl font-serif text-3xl leading-[1.05] sm:text-5xl">
              You write it. We make it hold up.
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

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="bg-navy/70 p-7 lg:p-8">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-serif text-base text-gold">{s.n}</span>
                {s.optional && (
                  <span className="text-[9px] uppercase tracking-[0.2em] text-navy-foreground/50">
                    Optional
                  </span>
                )}
              </div>
              <h3 className="mt-5 font-serif text-xl">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-navy-foreground/70">{s.body}</p>
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
      title: "Solicitor review, if you want it",
      body: "Have your Will read clause by clause by admitted Nigerian counsel before you sign. Optional on Basic, included with Premium.",
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
    { n: "03", title: "Counsel review", body: "Optional: a qualified solicitor checks every clause." },
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

/**
 * The real price list, read from the API.
 *
 * This section used to hard-code three invented tiers — Essential ₦25,000,
 * Family ₦55,000, Estate ₦150,000 — none of which the firm has ever sold. It
 * is the same fault as inventing a testimonial: a page must not make up what
 * a client will be charged. Prices now come from the `plans` table through
 * `getPriceList()`, and the totals are composed server-side, so the homepage
 * cannot drift from the pricing page or from the payment gateway.
 */
async function PricingPreview() {
  const prices = await getPriceList();

  if (prices.will.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
              Charged once, per Will
            </span>
            <h2 className="mt-5 max-w-xl font-serif text-3xl leading-[1.05] text-navy sm:text-5xl">
              Every figure, up front.
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

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {prices.will.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              quote={prices.quotes[plan.slug]}
              featured={plan.is_popular}
            >
              <Link
                href={`/register?plan=${plan.slug}`}
                className={`mt-8 flex h-13 items-center justify-center px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors ${plan.is_popular
                  ? "bg-gold text-navy hover:bg-gold/90"
                  : "bg-navy text-navy-foreground hover:bg-navy/90"
                  }`}
              >
                Choose {plan.name}
              </Link>
            </PlanCard>
          ))}
        </div>

        <PricingFootnotes
          lodging={prices.lodging}
          review={prices.review}
          subscription={prices.subscription}
        />

        {/*
          The professional rate.
          Advertised to everyone, because a lawyer has to be able to find out
          what the platform costs before opening an account. Buying at it is a
          different matter — that needs an enrolment number this office has
          checked against the roll, and the checkout enforces it.
        */}
        {prices.lawyerWill.length > 0 && (
          <div className="mt-16 border-t border-border pt-14">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-center">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
                  For legal practitioners
                </span>
                <h3 className="mt-5 max-w-lg font-serif text-2xl leading-[1.1] text-navy sm:text-4xl">
                  Drafting for your clients?
                </h3>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Practitioners draft on the platform at a per-Will rate, with no
                  subscription and no minimum volume. Register as a lawyer, give us
                  your Supreme Court enrolment number, and we will confirm it against
                  the roll before your first bill.
                </p>
                <Link
                  href="/register?type=lawyer"
                  className="mt-8 inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy"
                >
                  <span className="h-px w-8 bg-gold transition-all" />
                  Open a practitioner account
                </Link>
              </div>

              {prices.lawyerWill.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  quote={prices.quotes[plan.slug]}
                >
                  <Link
                    href="/register?type=lawyer"
                    className="mt-8 flex h-13 items-center justify-center bg-navy px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
                  >
                    Register as a lawyer
                  </Link>
                </PlanCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function FAQPreview() {
  const faqs = [
    [
      "Is a Will created on Castle legally binding in Nigeria?",
      "Yes. Every Will is drafted in compliance with the law, and once signed and witnessed correctly it is fully binding. You do not need a lawyer to make one here — a review by a qualified Nigerian estate lawyer is an optional paid extra, and is included with Premium.",
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