import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { CalendarClock, Mail, MessageSquare, Phone } from "lucide-react";

import { db } from "@/lib/db";
import { willRevisions } from "@/lib/db/schema";
import { requireUser } from "@/lib/actions/guards";
import { getOrCreateDraft } from "@/lib/will/repository";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
import { COMPANY } from "@/lib/company";
import { PageHead } from "@/components/dashboard/PageHead";

export const metadata: Metadata = {
  title: "Counsel",
  robots: { index: false, follow: false },
};

export default async function AdvisorsPage() {
  const user = await requireUser();
  const will = await getOrCreateDraft(user.id, user.name);

  // The reviewer's own notes, recorded against each revision. These are the
  // real review log — nothing here is illustrative.
  const revisions = await db
    .select()
    .from(willRevisions)
    .where(eq(willRevisions.willId, will.id))
    .orderBy(willRevisions.version);

  const inReview = will.status === "submitted" || will.status === "under_review";

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Section V"
        title="Counsel"
        blurb="Where your Will stands with our review team, and how to reach us when you need to talk it through."
      />

      <section className="border border-border bg-background p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {will.reference}
            </p>
            <h2 className="mt-2 font-serif text-xl text-navy">
              {inReview
                ? "Your Will is with our review team."
                : will.status === "approved"
                  ? "Your Will has been approved."
                  : will.status === "executed"
                    ? "Your Will is recorded as executed."
                    : "Your Will is still a draft."}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {inReview
                ? "We will email you as soon as the review is complete. No action is needed from you in the meantime."
                : will.status === "draft"
                  ? "Submit it from the final step of the builder when you are ready, and a reviewer will look it over."
                  : "Any notes from your reviewer appear below."}
            </p>
          </div>
          <span className="shrink-0 border border-border px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {WILL_STATUS_LABELS[will.status] ?? will.status}
          </span>
        </div>

        {will.status === "draft" && (
          <Link
            href="/dashboard/will"
            className="mt-6 inline-block bg-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            Continue drafting
          </Link>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-xl text-navy">Review log</h2>
        </div>

        {revisions.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-14 text-center">
            <p className="text-sm italic text-muted-foreground">
              No review notes yet. They will appear here once your Will has been submitted and
              looked at.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border bg-background">
            {revisions.map((revision) => (
              <li key={revision.id} className="grid gap-2 px-5 py-4 sm:flex sm:gap-6">
                <span className="w-32 shrink-0 font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {revision.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy">
                    {revision.summary ?? `Revision ${revision.version} recorded`}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    Revision {revision.version}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-xl text-navy">Speak to someone</h2>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          If something in your Will needs discussing — a complex estate, property abroad, or a
          beneficiary arrangement you are unsure about — talk to us before you sign rather than
          after.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <a
            href={COMPANY.phoneHref}
            className="inline-flex items-center gap-2 text-navy underline-offset-4 hover:underline"
          >
            <Phone className="h-4 w-4 text-gold" />
            {COMPANY.phone}
          </a>
          <a
            href={`mailto:${COMPANY.email}`}
            className="inline-flex items-center gap-2 text-navy underline-offset-4 hover:underline"
          >
            <Mail className="h-4 w-4 text-gold" />
            {COMPANY.email}
          </a>
        </div>

        <Link
          href="/contact"
          className="mt-6 inline-block border border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          Send a message
        </Link>
      </section>
    </div>
  );
}
