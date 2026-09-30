import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Plus } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { journeyStages } from "@/components/will/JourneyBar";
import { listWills } from "@/lib/actions/will";
import { getProfile, requireUser } from "@/lib/actions/guards";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";

export const metadata: Metadata = {
  title: "My Wills",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** What this Will is waiting on, in the client's words. */
const NEXT_ACTION: Record<string, string> = {
  incomplete: "Finish writing it",
  unpaid: "Payment is the next step",
  kyc_required: "Confirm your identity",
  passport_photograph_required: "Add your photograph",
  witnesses_required: "Checking your witnesses",
};

/**
 * The same, for a lawyer's list of client Wills. The identity check is still
 * their own; the photograph and the witnesses are the client's.
 */
const NEXT_ACTION_FOR_CLIENT: Record<string, string> = {
  ...NEXT_ACTION,
  passport_photograph_required: "Add your client's photograph",
  witnesses_required: "Checking the witnesses",
};

/**
 * Every Will the client holds.
 *
 * A client may have several — a Will they have printed, one they are amending,
 * one half-written — and until now the dashboard could only ever describe one
 * of them. Everything else in this section was built around a single Will and
 * quietly picked one for you, which is how a submitted Will became unreachable
 * behind a newly created empty draft.
 *
 * The Will is the object clients actually think in, so it is the object the
 * dashboard is organised around. Each row says where that Will stands and what
 * it is waiting on.
 */
export default async function WillsPage() {
  await requireUser();

  // The capability, not the role: the server answers "may they?" and this
  // screen renders that answer rather than re-deriving the rule.
  const profile = await getProfile();

  const wills = await listWills();

  /*
   * A lawyer's list is of their clients' Wills. "My Wills" and "Begin your
   * Will" describe a document they are the testator of, which is none of
   * these.
   */
  const forClient = profile?.may_name_another_testator ?? false;
  const nextAction = forClient ? NEXT_ACTION_FOR_CLIENT : NEXT_ACTION;

  return (
    <div className="space-y-10">
      <PageHead
        kicker={forClient ? "Your practice" : "Your documents"}
        title={forClient ? "Client Wills" : "My Wills"}
        blurb={
          forClient
            ? "Every Will you have drawn for a client, and what each one is waiting on."
            : profile?.may_hold_multiple_wills
              ? "Every Will you hold with us, and what each one is waiting on."
              : "Your Will, and what it is waiting on."
        }
      />

      {wills.length === 0 ? (
        <div className="border border-border bg-background py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <h2 className="mt-4 font-serif text-2xl text-navy">
            {forClient ? "No client Wills yet." : "No Will yet."}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {forClient
              ? "Five guided steps for each client. You can pause a Will and resume it at any point."
              : "Five guided steps, plain English throughout. You can pause and resume at any point."}
          </p>
          {/* No prefetch on a lawyer's: opening the new-Will route can create one. */}
          <Link
            href={forClient ? "/dashboard/will/new" : "/dashboard/will"}
            prefetch={forClient ? false : undefined}
            className="mt-6 inline-flex items-center gap-2 bg-navy px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            {forClient ? "Start a client's Will" : "Begin your Will"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-px border border-border bg-border">
            {wills.map((will) => {
              const stage = will.journey?.stage;
              const blocked = will.journey?.print_blocked_by;
              // Counted against this Will's own stages: a lawyer's has no
              // Legal review, so it is one of six rather than of seven.
              const stages = will.journey ? journeyStages(will.journey) : [];
              const stageNumber = stage ? stages.indexOf(stage) + 1 : null;

              return (
                <li key={will.id} className="bg-background">
                  <Link
                    href={`/dashboard/wills/${will.id}`}
                    className="group block p-6 transition-colors hover:bg-surface sm:p-7"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                        {will.reference}
                      </span>
                      <span className="border border-border px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {WILL_STATUS_LABELS[will.status] ?? will.status}
                      </span>
                    </div>

                    <h2 className="mt-3 font-serif text-xl text-navy">
                      {will.title}
                    </h2>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      {stageNumber && (
                        <span className="text-muted-foreground">
                          Stage {stageNumber} of {stages.length}
                        </span>
                      )}

                      <span className="text-muted-foreground">
                        {will.completion_percent}% complete
                      </span>

                      {/* What it is waiting on — the reason to open it. */}
                      {blocked && (
                        <span className="font-medium text-gold">
                          {nextAction[blocked] ?? "Needs attention"}
                        </span>
                      )}
                      {will.journey?.can_print && (
                        <span className="font-medium text-success">
                          Ready to print
                        </span>
                      )}

                      <span className="ml-auto text-navy transition-transform group-hover:translate-x-0.5">
                        Manage &rarr;
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/*
            Only a lawyer is offered another.

            A lawyer drafts for many clients at once, so they may start the
            next client's Will whatever the others are waiting on — each of
            those is continued from its own row above. Everybody else has one
            Will, and the server returns them to it rather than creating a
            second; keeping one current is the Update stage, not a new record.

            No prefetch: opening the new-Will route can create a Will.
          */}
          {profile?.may_hold_multiple_wills ? (
            <Link
              href="/dashboard/will/new"
              prefetch={false}
              className="inline-flex items-center gap-2 bg-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              <Plus className="h-4 w-4" />
              Start a new Will
            </Link>
          ) : (
            <Link
              href="/dashboard/will"
              className="inline-flex items-center gap-2 border border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
            >
              <Plus className="h-4 w-4" />
              Continue my Will
            </Link>
          )}
        </>
      )}
    </div>
  );
}
