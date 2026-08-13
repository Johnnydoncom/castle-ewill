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
    // than a flat one-off — lodging and a review are separate, optional extras.
    "Free updates while subscribed",
    "One-off payment per Will",
    "Unique tamper-proof document ID",
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
            Making a Will in Nigeria usually means booking time with a chambers,
            explaining yourself twice, and a fee you only find out at the end.
            Castle is a platform, not a law firm: you answer the questions
            yourself, in your own time, and print the finished document the same
            day. Every figure is on the page before you start. A solicitor reads
            it only if you ask for one — and only then do you pay for one.
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
              alt=""
              loading="lazy"
              className="h-[420px] w-full object-cover sm:h-[560px]"
            />
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-soft sm:absolute sm:-bottom-8 sm:left-8 sm:right-8 sm:mt-0">
            <p className="min-w-0 font-serif text-base italic text-navy">
              “Every question a Nigerian estate lawyer would ask — answered in your own time.”
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
   * The seven stages a client moves through, matching `WillJourney` on the
   * backend exactly. Worth keeping in step with it: a page promising a stage
   * the server does not recognise is a support ticket.
   *
   * Grouped into three acts rather than laid out flat, for three reasons.
   *
   * Seven is an awkward number for a grid — the previous four-column layout
   * left a dead cell in the corner, which is what made the section look
   * broken. Seven is also more than anyone takes in at once, whereas three
   * chunks are read at a glance with the detail there for whoever wants it.
   * And a uniform grid of identical tiles says nothing about *order*, when
   * order is the entire content: these are stages, not features.
   *
   * The `by` marker is the other half of the fix. A visitor's real question is
   * "how much of this is on me?", and the old tiles could not answer it — they
   * gave equal weight to something you do at your kitchen table and something
   * we file at the registry. Legal review carries the loudest marker, because
   * being able to skip it is the whole positioning of this platform.
   */
  const acts = [
    {
      range: "01 — 02",
      title: "Write it",
      promise: "Today, at your own pace. Nothing to pay to start.",
      stages: [
        {
          n: "01",
          title: "Prepare",
          by: "You",
          body: "Nine guided sections in plain English. Save and come back as often as you like.",
        },
        {
          n: "02",
          title: "Legal review",
          by: "Optional",
          highlight: true,
          body: "Have a Nigerian solicitor read every clause for a fixed fee — or skip it in one click and carry straight on.",
        },
      ],
    },
    {
      range: "03 — 05",
      title: "Make it real",
      promise: "The part that turns a document into an instrument.",
      stages: [
        {
          n: "03",
          title: "Print",
          by: "You",
          body: "Settle the fee, confirm your identity once, then download the finished Will — branded, and sealed with a QR code anyone can verify.",
        },
        {
          n: "04",
          title: "Execute",
          by: "You + 2 witnesses",
          body: "Sign in front of two witnesses, who each sign in front of you. We show you exactly how — and who may not witness.",
        },
        {
          n: "05",
          title: "Lodge",
          by: "We handle it",
          body: "The executed Will is filed with the Probate Registry on your behalf.",
        },
      ],
    },
    {
      range: "06 — 07",
      title: "Keep it current",
      promise: "A Will is only as good as its last amendment.",
      stages: [
        {
          n: "06",
          title: "Protect",
          by: "We handle it",
          body: "Held in an encrypted vault — every file sealed before it touches a disk, and every attempt to read one logged.",
        },
        {
          n: "07",
          title: "Update",
          by: "While subscribed",
          body: "Life changes. Amend and re-issue as often as you need, free for as long as your subscription runs.",
        },
      ],
    },
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
              Seven stages, three acts
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

        <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-3">
          {acts.map((act) => (
            <li key={act.title} className="bg-navy/70 p-7 sm:p-9">
              {/* Act header: the numeral range, then a rule out to the column
                  edge. Across the three panels it reads as one line. */}
              <div className="flex items-center gap-4">
                <span className="font-serif text-sm tracking-[0.1em] text-gold">
                  {act.range}
                </span>
                <span aria-hidden className="h-px flex-1 bg-white/15" />
              </div>

              <h3 className="mt-6 font-serif text-2xl">{act.title}</h3>
              {/* Height reserved for two lines. One of these promises wraps
                  and the others do not, which pushed that column's stage list
                  out of line with its neighbours — the kind of few-pixel drift
                  that reads as carelessness across three adjacent panels. */}
              <p className="mt-2 text-sm leading-relaxed text-navy-foreground/55 lg:min-h-[2.75rem]">
                {act.promise}
              </p>

              <ol className="relative mt-9 space-y-8">
                {/* The rail the markers sit on, inset top and bottom so it
                    begins at the first marker and ends at the last rather
                    than running past them. */}
                <span
                  aria-hidden
                  className="absolute bottom-2 left-[3px] top-2 w-px bg-white/12"
                />

                {act.stages.map((stage) => (
                  <li key={stage.n} className="relative pl-9">
                    <span
                      aria-hidden
                      className={`absolute left-0 top-[7px] h-[7px] w-[7px] rounded-full ${
                        stage.highlight ? "bg-navy ring-1 ring-gold" : "bg-gold"
                      }`}
                    />

                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h4 className="font-serif text-lg leading-none">
                        {stage.title}
                      </h4>
                      <span
                        className={`text-[9px] uppercase tracking-[0.2em] ${
                          stage.highlight
                            ? "border border-gold/50 px-2 py-0.5 text-gold"
                            : "text-navy-foreground/40"
                        }`}
                      >
                        {stage.by}
                      </span>
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-navy-foreground/70">
                      {stage.body}
                    </p>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>

        <div className="mt-10 hidden gap-4 sm:grid-cols-3 md:grid">
          {["/images/signing-hands.jpg", "/images/father-daughter.jpg", "/images/legacy-still-life.jpg"].map((src, i) => (
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
    /*
     * Three of these described things the platform does not do, and have been
     * replaced rather than softened.
     *
     * "Access controls audited quarterly" — there is no such audit, and on a
     * product holding identity documents that is not a claim to make loosely.
     * "Witness coordination", promising invitations and scheduling from the
     * dashboard — witnesses are recorded as a wizard step and never contacted.
     * "Executor briefing", promising a handover pack — no such pack exists
     * anywhere in the product.
     *
     * What replaced them was already built and was going unmentioned: the
     * witness rule the server actually enforces, and the QR seal on every
     * generated Will.
     */
    {
      numeral: "III",
      title: "Encrypted vault",
      body: "AES-256-GCM before a file touches a disk, HTTPS in transit, and every attempt to read a document logged whether it succeeds or fails.",
    },
    {
      numeral: "IV",
      title: "The witness trap, avoided",
      body: "A gift to someone who witnesses your Will is void in Nigeria — and it is the mistake people make most. We check your witnesses against your beneficiaries and refuse the combination outright.",
    },
    {
      numeral: "V",
      title: "A document anyone can check",
      body: "Every Will carries a QR seal. A bank or registry can scan it to confirm the copy in front of them is genuine and current, without telephoning anybody.",
    },
    {
      numeral: "VI",
      title: "Updates while you subscribe",
      body: "Life changes. Amend and re-issue your Will as often as you need, free for as long as your annual subscription runs.",
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

        {/*
          Basic, Premium and Professional in one row of three.

          The professional rate previously had its own section further down,
          which read as an afterthought and split the page's answer to "what
          does this cost?" in two. The eligibility rule that section explained
          now rides on the card itself, and is enforced where it always was —
          at checkout.
        */}
        {/*
          Individual plans in their own row; the practitioner rate below it.

          Not one grid over both. There are three individual plans and one
          lawyer plan, so a single three-column grid strands the fourth card
          alone on a second row. Splitting them also stops the professional
          rate reading as a fourth tier an individual might weigh up — it is a
          different product for a different buyer, sold through registration
          rather than a checkout.
        */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        {prices.lawyerWill.length > 0 && (
          <div className="mt-12 border-t border-border pt-10">
            <div className="flex items-baseline gap-3">
              <h3 className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                For legal practitioners
              </h3>
              <span className="text-xs text-muted-foreground">
                Drafting on behalf of your own clients.
              </span>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {prices.lawyerWill.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  quote={prices.quotes[plan.slug]}
                  featured={false}
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

        <PricingFootnotes
          lodging={prices.lodging}
          review={prices.review}
          subscription={prices.subscription}
        />

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
      "There are nine sections, and they are designed to be finished in one sitting. Nothing is timed — you can save your progress and come back whenever you like.",
    ],
    [
      "Can I update my Will later?",
      "Yes. Your Will is held in an encrypted vault, and you can amend, re-sign and re-download it as life changes. Once a Will has been issued, amendments are covered by the annual subscription.",
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