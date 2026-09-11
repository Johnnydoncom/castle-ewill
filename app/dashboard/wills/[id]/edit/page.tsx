import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { JourneyActions } from "@/components/will/JourneyActions";
import { JourneyBar } from "@/components/will/JourneyBar";
import { getProfile } from "@/lib/actions/guards";
import { listUserDocuments } from "@/lib/actions/documents";
import { readWill } from "@/lib/actions/will";
import {
  clampToReachable,
  previousStep,
  stepByNumber,
  TOTAL_STEPS,
  WILL_STEPS,
} from "@/lib/will/steps";
import {
  CompletionPill,
  StepHeading,
  StepProgress,
} from "@/components/will/WizardChrome";
import { ReviewSummary } from "@/components/will/ReviewSummary";
import {
  AboutYouStep,
  EstateStep,
  ReviewStep,
  WishesStep,
  WitnessesStep,
} from "@/components/will/StepForms";

export const metadata: Metadata = {
  title: "Will builder",
  robots: { index: false, follow: false },
};

export default async function WillEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const [{ id }, { step: stepParam }] = await Promise.all([params, searchParams]);

  /*
   * No identity gate here, deliberately.
   *
   * This used to redirect anyone without `is_kyc_verified` straight to the KYC
   * flow. Identity proofing moved to *after payment and before printing*, so
   * anyone may draft; the gate is on releasing the finished instrument, and it
   * lives in `WillJourney::printBlockedBy()` where the server can enforce it.
   */

  /*
   * The Will named in the URL, not "whichever one is in flight". With more than
   * one Will, every Edit link used to be a guess.
   */
  const read = await readWill(id);

  if (read.status === "not_found") notFound();

  const will = read.status === "found" ? read.will : null;

  if (!will) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-serif text-lg text-navy">
          We could not open your Will. Please refresh and try again.
        </p>
      </div>
    );
  }

  // Every link out of this page carries the Will it belongs to.
  const basePath = `/dashboard/wills/${will.id}/edit`;

  const requested = Number(stepParam);
  const hasValidStepParam =
    Number.isInteger(requested) && requested >= 1 && requested <= TOTAL_STEPS;

  const current = hasValidStepParam
    ? clampToReachable(requested, will.current_step)
    : Math.min(Math.max(will.current_step, 1), TOTAL_STEPS);

  /*
   * `?step=` is an unchecked query string — nothing stops someone requesting a
   * step past what they've actually reached. Only a draft has a step sequence
   * to jump ahead of at all. Redirecting rather than silently rendering the
   * clamped step keeps the address bar an honest description of what loaded.
   */
  if (will.status === "draft" && hasValidStepParam && current !== requested) {
    redirect(`${basePath}?step=${current}`);
  }

  const definition = stepByNumber(current) ?? WILL_STEPS[0];

  /*
   * Progress comes from the API, computed by the same rules that gate
   * submission. A locally computed ring showing 100% beside a server that
   * refuses the submission is worse than no ring at all.
   */
  const completions = will.progress?.steps ?? [];
  const percent = will.progress?.percent ?? will.completion_percent;

  const backHref =
    current > 1 ? `${basePath}?step=${previousStep(current)}` : undefined;

  /*
   * The photograph belongs to the account, not the Will, so it is read here
   * rather than off the Will. Only the first step uses it.
   */
  const documents = await listUserDocuments();

  /*
   * Whether the name on this Will is this account holder's own. It is, for
   * everybody but a lawyer. The server settles it either way — the form only
   * needs to know so it can show the name rather than ask for a spelling it is
   * going to replace.
   */
  const profile = await getProfile();

  const stepProps = {
    will,
    backHref,
    passportPhotoId:
      documents.find((record) => record.kind === "passport_photograph")?.id ??
      null,
    nameIsTheirs: !(profile?.may_name_another_testator ?? false),
    accountName: {
      first: profile?.first_name ?? "",
      middle: profile?.middle_name ?? "",
      last: profile?.last_name ?? "",
    },
  };

  /*
   * A submitted Will: no longer editable, but very much not finished.
   *
   * It shows the journey and its next action — the route back to paying,
   * verifying and printing — so a client whose session expired during checkout
   * is never left without a way back to payment.
   */
  if (will.status !== "draft") {
    return (
      <div className="space-y-8">
        <header className="border-b border-border pb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-10 bg-gold" />
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {will.reference}
            </p>
          </div>
          <h1 className="font-serif text-3xl text-navy sm:text-4xl">
            Your Will is written.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The answers are locked in. What remains is below — and you can pick
            it up here whenever you like.
          </p>
        </header>

        {will.journey && (
          <div className="space-y-6">
            <JourneyBar journey={will.journey} />
            <JourneyActions
              willId={will.id}
              journey={will.journey}
              pdfUrl={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/wills/${will.id}/pdf`}
            />
          </div>
        )}

        <ReviewSummary will={will} editBasePath={basePath} />
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mx-10 lg:-mt-10">
      <StepProgress
        steps={WILL_STEPS}
        current={current}
        completed={completions.filter((c) => c.complete).map((c) => c.step)}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <FileText className="mr-2 inline h-3 w-3" />
            {will.reference}
          </span>
          <CompletionPill percent={percent} />
        </div>

        <StepHeading step={definition} />

        <div className="mt-10">
          {/*
            Matched on the step's slug, not its number. The numbers moved and
            this list was updated late, which put the wrong form under the
            right heading. `definition` comes from the same table the backend
            mirrors.
          */}
          {definition.slug === "about-you" && <AboutYouStep {...stepProps} />}
          {definition.slug === "estate" && <EstateStep {...stepProps} />}
          {definition.slug === "wishes" && <WishesStep {...stepProps} />}
          {definition.slug === "witnesses" && <WitnessesStep {...stepProps} />}
          {definition.slug === "review" && (
            <ReviewStep {...stepProps}>
              {/*
                Nothing about the journey here. "Save & continue" commits the
                answers and lands on the Will's own page, which is where the
                journey bar, the review question and the payment button live.
              */}
              <ReviewSummary will={will} editBasePath={basePath} />
            </ReviewStep>
          )}
        </div>
      </div>
    </div>
  );
}
