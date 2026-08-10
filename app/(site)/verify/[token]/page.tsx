import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, FileWarning, ShieldAlert } from "lucide-react";

import { api } from "@/lib/api/client";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Verify a document",
  description:
    "Confirm that a Castle eWill & Trust document is genuine and that it is the current version.",
  // A verification result is about one specific instrument. There is nothing
  // here worth indexing, and a search engine holding a cache of these would be
  // a slow leak of which references exist.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Outcome = "valid" | "superseded" | "withdrawn" | "unverified";

/**
 * What the page renders. `unreachable` is ours, not the API's, and it exists
 * because the two must never be confused: "we cannot reach the service" is a
 * problem with us, while "unverified" is an accusation that the document in
 * someone's hand is a forgery. Showing the second when we mean the first would
 * tell a registrar to reject a perfectly genuine Will.
 */
type Display = Outcome | "unreachable";

type Verification = {
  outcome: Outcome;
  reference?: string;
  version?: number;
  current_version?: number;
  issued_at?: string | null;
  is_executed?: boolean;
  message: string;
};

const PRESENTATION: Record<
  Display,
  { tone: string; icon: typeof BadgeCheck; heading: string }
> = {
  unreachable: {
    tone: "border-border bg-surface text-navy",
    icon: FileWarning,
    heading: "Verification unavailable",
  },
  valid: {
    tone: "border-success/40 bg-success/5 text-success",
    icon: BadgeCheck,
    heading: "Genuine and current",
  },
  superseded: {
    // Amber, not green and not red. The document is authentic; relying on it
    // would still be a mistake. Collapsing that into either extreme would
    // mislead in one direction or the other.
    tone: "border-gold/50 bg-gold/5 text-gold",
    icon: FileWarning,
    heading: "Genuine, but superseded",
  },
  withdrawn: {
    tone: "border-gold/50 bg-gold/5 text-gold",
    icon: FileWarning,
    heading: "Record no longer held",
  },
  unverified: {
    tone: "border-destructive/40 bg-destructive/5 text-destructive",
    icon: ShieldAlert,
    heading: "Could not be verified",
  },
};

export default async function VerifyDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await api<{ data: Verification }>(
    `/wills/verify/${encodeURIComponent(token)}`,
    { authenticated: false },
  );

  /*
   * A 404 from this endpoint is a *result*, not a failure — it is how "this is
   * not one of ours" is reported — so the body is read on both branches. They
   * carry different shapes: `ok` gives the whole envelope, while the error
   * branch has already unwrapped `data` for us. Only a genuinely unreachable
   * backend falls through to null, which is why an unreachable service must
   * not be rendered as "not genuine" — see the message below.
   */
  const verification: Verification | null = result.ok
    ? (result.data?.data ?? null)
    : ((result.data as Verification | undefined) ?? null);

  const outcome: Display = verification?.outcome ?? "unreachable";
  const { tone, icon: Icon, heading } = PRESENTATION[outcome];

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
      <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
        Document authentication
      </span>
      <h1 className="mt-5 font-serif text-3xl leading-[1.05] text-navy sm:text-5xl">
        Verification result
      </h1>

      <div className={`mt-10 border p-6 sm:p-8 ${tone}`}>
        <div className="flex items-start gap-4">
          <Icon className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-serif text-xl">{heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy/80">
              {verification?.message ??
                "We could not reach the verification service just now. This says nothing about the document itself — please try again shortly."}
            </p>
          </div>
        </div>
      </div>

      {verification?.reference && (
        <dl className="mt-10 divide-y divide-border border-y border-border">
          {[
            ["Reference", verification.reference],
            [
              "Version on this copy",
              verification.version ? String(verification.version) : "—",
            ],
            [
              "Current version",
              verification.current_version
                ? String(verification.current_version)
                : "—",
            ],
            [
              "Issued",
              verification.issued_at
                ? new Date(verification.issued_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-4"
            >
              <dt className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {label}
              </dt>
              <dd className="text-sm text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
        This check confirms only that a document was issued by{" "}
        {COMPANY.legalName} and which version it is. It deliberately reveals
        nothing about the contents or the person who made it. If something here
        does not match the document in your hand, contact us at{" "}
        <a
          href={`mailto:${COMPANY.email}`}
          className="text-navy underline underline-offset-4"
        >
          {COMPANY.email}
        </a>
        .
      </p>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy"
      >
        <span className="h-px w-8 bg-gold" />
        Back to Castle eWill
      </Link>
    </section>
  );
}
