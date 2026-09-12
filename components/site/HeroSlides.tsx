'use client'
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";

type Slide = {
  index: string;
  tab: string;
  kicker: string;
  title: React.ReactNode;
  body: string;
  image: string;
  alt: string;
  caption: string;
  meta: string;
  cta: { label: string; to: string };
};

const SLIDES: Slide[] = [
  {
    index: "01",
    tab: "Your Will",
    kicker: "Wills, made plainly",
    title: (
      <>
        Write the document
        <br />
        your family will
        <br />
        <span className="italic text-gold">thank you for.</span>
      </>
    ),
    body: "Answer straightforward questions and we turn them into a Will drafted in compliance with the law. You write it yourself and print it the same day; a solicitor's review is there if you want one, at extra cost.",
    image: '/images/hero-family.jpg',
    alt: "A Nigerian family together at home",
    /*
     * Not "The Adeyemi family, Lagos — Will completed in 18 minutes".
     *
     * That named a client who does not exist, over a stock photograph, beside
     * a completion time nobody has measured on a platform that has not
     * launched. It is the same fault as an invented testimonial, and on a
     * service handling estates it is worse than an embarrassment. Replaced
     * with a description of the picture and a claim the product actually
     * makes true.
     */
    caption: "Everyone your Will speaks for",
    meta: "Four guided steps, in your own words",
    cta: { label: "Start your Will", to: "/register" },
  },
  {
    index: "02",
    tab: "Guardianship",
    kicker: "For the people who need you",
    title: (
      <>
        Name who raises
        <br />
        your children
        <br />
        <span className="italic text-gold">if you cannot.</span>
      </>
    ),
    body: "Appoint guardians, set aside funds for school fees, and leave instructions in your own words — so nothing is left to a courtroom's interpretation.",
    image: '/images/father-daughter.jpg',
    alt: "A Nigerian father reading with his daughter",
    caption: "Guardianship clauses",
    meta: "Included on every family plan",
    cta: { label: "See what's covered", to: "/services" },
  },
  {
    index: "03",
    tab: "Vault",
    kicker: "Sealed, stored, findable",
    title: (
      <>
        Signed properly.
        <br />
        Kept safely.
        <br />
        <span className="italic text-gold">Found instantly.</span>
      </>
    ),
    body: "Step-by-step signing and witnessing guidance, then an AES-256 vault that releases your Will only to the executors you name.",
    image: '/images/signing-hands.jpg',
    alt: "Hands signing a legal document with a fountain pen",
    caption: "Execution & storage",
    meta: "Bank-grade encryption, Nigerian jurisdiction",
    cta: { label: "How it works", to: "/services" },
  },
];

const DURATION = 7000;

export function HeroSlides() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAt = useRef(0);

  const go = useCallback((i: number) => {
    setActive((i + SLIDES.length) % SLIDES.length);
    startedAt.current = Date.now();
    setProgress(0);
  }, []);

  useEffect(() => {
    if (paused) return;
    // Seeded here rather than in a `useRef(Date.now())` initialiser: reading the
    // clock during render is impure and unstable under concurrent rendering.
    // Only seed on first run, so resuming keeps the timestamp the mouse-leave
    // handler rewound to.
    if (startedAt.current === 0) startedAt.current = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      if (elapsed >= DURATION) {
        setActive((a) => (a + 1) % SLIDES.length);
        startedAt.current = Date.now();
        setProgress(0);
      } else {
        setProgress(elapsed / DURATION);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft") go(active - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  const slide = SLIDES[active];

  return (
    <section
      className="relative overflow-hidden bg-navy text-navy-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        startedAt.current = Date.now() - progress * DURATION;
        setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Castle eWill introduction"
    >
      {/* soft field of light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(900px 520px at 12% -10%, color-mix(in oklab, var(--primary) 32%, transparent), transparent 62%), radial-gradient(700px 480px at 95% 110%, color-mix(in oklab, var(--gold) 16%, transparent), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 lg:pb-16 lg:pt-20">
        {/* Copy */}
        <div className="lg:col-span-6">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 shrink-0 bg-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
              {slide.kicker}
            </span>
          </div>

          <h1
            key={`t-${active}`}
            className="mt-7 animate-in fade-in slide-in-from-bottom-3 font-serif text-[2.75rem] leading-[0.98] tracking-[-0.03em] duration-700 sm:text-6xl lg:text-[3.5rem]"
          >
            {slide.title}
          </h1>

          <p
            key={`b-${active}`}
            className="mt-7 max-w-lg animate-in fade-in duration-1000 text-base leading-relaxed text-navy-foreground/75 sm:text-lg"
          >
            {slide.body}
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={slide.cta.to as "/register"}
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-gold px-8 text-[13px] font-semibold uppercase tracking-[0.18em] text-navy transition-all hover:bg-gold/90 hover:shadow-gold"
            >
              {slide.cta.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {/*
              "From ₦25,000" was hard-coded here and had stopped being true —
              no plan has sold at that figure since the pricing model changed,
              and the cheapest Will is ₦40,000. A price on a hero is a promise,
              and one typed into a component drifts silently from the `plans`
              table that actually bills people.

              It now says where to look rather than restating a number this
              file cannot keep correct. The pricing page renders the live
              figures from the API.
            */}
            <Link
              href="/pricing"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/20 px-8 text-[13px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/85 transition-colors hover:border-gold/60 hover:text-gold"
            >
              See pricing
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/*
            Slide selector.

            Three hairline rules that fill with gold as the slide's timer runs,
            beside the name of the slide you are on. It replaced a full-width
            grid of three bordered tabs which, on a hero whose whole job is the
            headline and the call to action, was spending a lot of vertical
            space restating what the headline already said.

            Each rule keeps a 40x24 hit area even though it draws as a 1px
            line — the target has to be tappable, and only the paint is
            delicate. Shown at every width now; the tab grid was hidden below
            `md`, which left phone users with no way to reach slides two and
            three at all.
          */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
              {SLIDES.map((s, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={s.index}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${s.index} — ${s.tab}`}
                    onClick={() => go(i)}
                    className="group relative h-6 w-10"
                  >
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 transition-colors ${isActive
                          ? "bg-white/25"
                          : "bg-white/20 group-hover:bg-white/45"
                        }`}
                    />
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-gold transition-[width] duration-100 ease-linear"
                        style={{ width: `${Math.min(progress, 1) * 100}%` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Only the current slide is named. Three labels at once is the
                thing being removed, not relocated. */}
            <span className="text-[10px] uppercase tracking-[0.28em] text-navy-foreground/55">
              {SLIDES[active].tab}
            </span>
          </div>
        </div>

        {/* Image plate */}
        <div className="relative lg:col-span-6">
          <div className="relative">
            <span aria-hidden className="absolute -left-3 -top-3 h-8 w-8 border-l border-t border-gold/60" />
            <span aria-hidden className="absolute -bottom-3 -right-3 h-8 w-8 border-b border-r border-gold/60" />

            <div className="relative overflow-hidden rounded-tr-[2rem] rounded-bl-[2rem]">
              {SLIDES.map((s, i) => (
                <Image
                  key={s.index}
                  src={s.image}
                  alt={i === active ? s.alt : ""}
                  aria-hidden={i !== active}
                  width={800}
                  height={600}
                  priority={i === active}
                  className={`h-[380px] w-full object-cover transition-all duration-[900ms] ease-out sm:h-[520px] lg:h-[580px] ${i === active
                    ? "relative scale-100 opacity-100"
                    : "absolute inset-0 scale-105 opacity-0"
                    }`}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />

              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">
                    {slide.caption}
                  </div>
                  <div className="mt-1.5 font-serif text-base italic text-navy-foreground/90 sm:text-lg">
                    {slide.meta}
                  </div>
                </div>
                <div className="hidden shrink-0 rounded-full border border-gold/40 px-3 py-1 font-serif text-[11px] text-gold sm:block">
                  {slide.index} / 0{SLIDES.length}
                </div>
              </figcaption>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
