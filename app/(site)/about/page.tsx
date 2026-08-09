import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  CLIENT_COMMITMENTS,
  COMPANY,
  CORE_VALUES,
  ETHICAL_COMMITMENTS,
  FOUNDING_BELIEF,
  MISSION,
  PRIVACY_PRINCIPLES,
  VISION,
} from "@/lib/company";

export const metadata: Metadata = {
  title: "About",
  description: `${COMPANY.legalName} — our vision, mission, values and the commitments we make to every client.`,
};

export default function AboutPage() {
  return (
    <>
      {/* Founding belief */}
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:py-32">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
              About &middot; {COMPANY.legalName}
            </span>
          </div>
          <p className="font-serif text-2xl leading-[1.45] sm:text-3xl lg:text-4xl">
            {COMPANY.shortName} {" "} eWill &amp; Trust Ltd. is founded upon a simple
            but enduring belief:{" "}
            <span className="italic text-gold">{FOUNDING_BELIEF}</span>
          </p>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {[
            { kicker: "Vision", body: VISION },
            { kicker: "Mission", body: MISSION },
          ].map((item) => (
            <div key={item.kicker} className="border-t-2 border-gold pt-8">
              <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
                {item.kicker}
              </p>
              <p className="mt-5 font-serif text-xl leading-relaxed text-navy sm:text-2xl">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core values */}
      <section className="border-y border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              Core values
            </p>
            <h2 className="font-serif text-4xl text-navy sm:text-5xl">
              Eight commitments we{" "}
              <span className="italic text-primary">do not trade away.</span>
            </h2>
          </div>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((value, index) => (
              <div key={value.name} className="border-t border-border pt-5">
                <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-serif text-lg text-navy">
                  {value.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ethics + client commitments */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              Our ethical commitment
            </p>
            <h2 className="font-serif text-3xl text-navy">
              {COMPANY.legalName} shall{" "}
              <span className="italic text-primary">never knowingly:</span>
            </h2>
            <ul className="mt-8 space-y-3">
              {ETHICAL_COMMITMENTS.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-border pb-3 text-sm text-navy/85"
                >
                  <span className="font-serif text-gold">&times;</span>
                  <span>{item};</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              Our commitment to clients
            </p>
            <h2 className="font-serif text-3xl text-navy">
              We <span className="italic text-primary">undertake to:</span>
            </h2>
            <ul className="mt-8 space-y-3">
              {CLIENT_COMMITMENTS.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-border pb-3 text-sm text-navy/85"
                >
                  <span className="font-serif text-gold">&mdash;</span>
                  <span>{item};</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/office-interior.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-navy/90" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-navy-foreground sm:px-6">
          <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
            Privacy and data protection
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl">
            We recognise privacy as a{" "}
            <span className="italic text-gold">
              fundamental organisational value.
            </span>
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {PRIVACY_PRINCIPLES.map((principle) => (
              <li
                key={principle}
                className="border-l-2 border-gold/50 pl-5 text-sm leading-relaxed text-navy-foreground/80"
              >
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Registered particulars */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="border border-border bg-surface p-10">
          <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
            Registered particulars
          </p>
          <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Registered name", COMPANY.legalName],
              ["RC number", COMPANY.rcNumber],
              ["Nature of business", COMPANY.business],
              ["Registered address", COMPANY.address],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-navy">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 border-t border-border pt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-navy px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              Speak with our team
            </Link>
          </div>
        </div>
      </section>

    </>
  );
}
