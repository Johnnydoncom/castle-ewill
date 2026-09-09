import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  FileCheck2,
  Lock,
  ScanFace,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  alternates: { canonical: "/security" },
  title: "Security & Identity Verification",
  description:
    "How Castle eWill & Trust verifies who is registering a Will — document authentication, liveness detection and face matching, before any document is written or stored.",
};

const STEPS = [
  {
    numeral: "I",
    icon: FileCheck2,
    title: "A valid means of identification",
    body: "Your international passport, driver's licence, National ID (NIN) or voter's card — a government-issued document, not a self-declaration. You photograph it on camera, guided, rather than uploading a file.",
  },
  {
    numeral: "II",
    icon: Camera,
    title: "Your face, in the same session",
    body: "A short guided capture immediately after the document, so the face being compared and the document being checked come from one continuous session rather than two uploads that could have been assembled separately.",
  },
  {
    numeral: "III",
    icon: ScanFace,
    title: "A liveness check we do not mark ourselves",
    body: "Whether the person in front of the camera is live — rather than a photograph, a screen or a recording — is judged by our identity provider, not by code running in your browser. Client-side checks can be looked up and defeated; this one cannot be, from where an attacker sits.",
  },
  {
    numeral: "IV",
    icon: UserCheck,
    title: "Document authentication and a face match",
    body: "Your identity document is authenticated — its security features, machine-readable zone and barcodes checked, and the details printed on it extracted — then compared against your face. Every outcome is available for one of our administrators to review.",
  },
] as const;

const ASSURANCES = [
  {
    icon: Lock,
    title: "Encrypted at rest",
    body: "Your Will is encrypted (AES-256-GCM) before it touches storage. Verification photographs are not stored at all — they go to our identity provider and are never written to our disks.",
  },
  {
    icon: ShieldCheck,
    title: "Read on a need-to-know basis",
    body: "Every access to a stored document is checked against your account and logged, granted or refused. There is no general-purpose way to browse client documents.",
  },
  {
    icon: UserCheck,
    title: "A person reviews the outcome",
    body: "Automated checks decide fast, obvious cases. Anything less than certain — and every account, if the check is unavailable — is queued for a member of our team to look at personally.",
  },
] as const;

export default function SecurityPage() {
  return (
    <>
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:py-32">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
              Security &middot; Identity verification
            </span>
          </div>
          <h1 className="font-serif text-3xl leading-[1.2] sm:text-4xl lg:text-5xl">
            We take verification seriously,{" "}
            <span className="italic text-gold">
              because a Will is only as strong as the certainty of who made it.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-navy-foreground/75 sm:text-base">
            Before {COMPANY.name} will draft, store or release a single
            clause of your Will, we confirm that you are who you say you
            are. Not as a formality — as the safeguard that lets your
            family, your executors and, if it is ever questioned, a court,
            trust that the document is genuinely yours.
          </p>
        </div>
      </section>

      {/* Why it matters */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div>
            <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              Why we ask
            </p>
            <h2 className="font-serif text-3xl text-navy sm:text-4xl">
              A Will is often times contested{" "}
              <span className="italic text-primary">on one of two grounds.</span>
            </h2>
          </div>
          <div className="space-y-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Either the wishes it records are disputed, or the identity of
              the person who made it is. We cannot settle the first — that
              is between you and the people you name — but we can make the
              second beyond reasonable doubt.
            </p>
            <p>
              That is the entire purpose of the identity check every client
              completes before their Will can be printed: a
              government-issued document authenticated against its own
              security features, the face of the person holding it, and a
              live camera check tying the two together — all captured in
              one session. Not one signal — three, judged as a whole.
            </p>
            <p className="text-navy">
              We take this seriously enough to build it as a gate, not a
              suggestion: no Will is printed, and none of your details are
              committed to a document, until this check is complete.
            </p>
          </div>
        </div>
      </section>

      {/* The four-part check */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              What verification asks of you
            </p>
            <h2 className="font-serif text-4xl text-navy sm:text-5xl">
              Two documents,{" "}
              <span className="italic text-primary">one short check.</span>
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
              Done once, at the very start — before you write a single
              detail of your Will.
            </p>
          </div>

          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {STEPS.map((step) => (
              <div key={step.numeral} className="border-t-2 border-gold pt-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/40 bg-background">
                    <step.icon className="h-4 w-4 text-gold" />
                  </span>
                  <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                    Step {step.numeral}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-xl text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data handling assurances */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
            What happens to your documents
          </p>
          <h2 className="font-serif text-3xl text-navy sm:text-4xl">
            Verified once.{" "}
            <span className="italic text-primary">Protected always.</span>
          </h2>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {ASSURANCES.map((item) => (
            <div key={item.title}>
              <item.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-4 font-serif text-lg text-navy">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">
            Ready when you are.{" "}
            <span className="italic text-gold">Have your ID to hand.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-navy-foreground/70">
            Verification takes a few minutes. You will need your identity
            document to hand and a device with a camera.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 bg-gold px-10 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/faqs"
              className="inline-flex items-center border border-white/30 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-white/10"
            >
              Read our FAQs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
