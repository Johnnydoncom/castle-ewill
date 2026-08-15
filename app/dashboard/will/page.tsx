import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { JourneyActions } from "@/components/will/JourneyActions";
import { JourneyBar } from "@/components/will/JourneyBar";
import { getOrCreateDraft } from "@/lib/actions/will";
import {
  applicableSteps,
  clampToReachable,
  previousStep,
  stepByNumber,
  TOTAL_STEPS,
} from "@/lib/will/steps";
import {
  CompletionPill,
  StepHeading,
  StepProgress,
} from "@/components/will/WizardChrome";
import { ReviewSummary } from "@/components/will/ReviewSummary";
import {
  BeneficiariesStep,
  BequestsStep,
  DeclarationStep,
  ExecutorsStep,
  FuneralStep,
  GuardianshipStep,
  PersonalStep,
  ReviewStep,
  WitnessesStep,
} from "@/components/will/StepForms";

export const metadata: Metadata = {
  title: "Will builder",
  robots: { index: false, follow: false },
};

export default async function WillBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step: stepParam } = await searchParams;

  /*
   * No identity gate here, deliberately.
   *
   * This used to redirect anyone without `is_kyc_verified` straight to the KYC
   * flow, mirroring a `kyc.verified` middleware that guarded the backend's
   * `wills` routes. That middleware was removed when identity proofing moved
   * to *after payment and before printing* — but this redirect was left
   * behind, so the wizard still bounced every new client to a document check
   * before they had written a word. Anyone may draft; the gate is on releasing
   * the finished instrument, and it lives in `WillJourney::printBlockedBy()`
   * where the server can enforce it.
   */

  // Scoped to the caller by the API. Returns the active draft, creating one on
  // first visit, with every child collection and the computed progress.
  const will = await getOrCreateDraft();

  if (!will) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-serif text-lg text-navy">
          We could not open your Will. Please refresh and try again.
        </p>
      </div>
    );
  }

  const requested = Number(stepParam);
  const hasValidStepParam =
    Number.isInteger(requested) && requested >= 1 && requested <= TOTAL_STEPS;

  const current = hasValidStepParam
    ? clampToReachable(requested, will.current_step, will.has_minor_children)
    : will.current_step;

  /*
   * `?step=` is an unchecked query string — nothing stops someone from
   * requesting a step past what they've actually reached (e.g. `?step=7`
   * while Guardianship and Bequests are still blank). Only a draft has a
   * step sequence to jump ahead of at all; the read-only summary below
   * ignores `current_step` entirely, so there's nothing to enforce there.
   * Redirecting rather than silently rendering the clamped step keeps the
   * address bar an honest description of what actually loaded.
   */
  if (will.status === "draft" && hasValidStepParam && current !== requested) {
    redirect(`/dashboard/will?step=${current}`);
  }

  /*
   * Only needed on the final step. Fetched here rather than inside the review
   * component so the *server* decides what that screen may offer — and note
   * that this only governs what is rendered: the submission endpoint enforces
   * the same gate regardless of what this page shows.
   */

  const steps = applicableSteps(will.has_minor_children);
  const definition = stepByNumber(current) ?? steps[0];

  /*
   * Progress comes from the API, computed by the same rules that gate
   * submission. A locally computed ring showing 100% beside a server that
   * refuses the submission is worse than no ring at all.
   */
  const completions = will.progress?.steps ?? [];
  const percent = will.progress?.percent ?? will.completion_percent;

  const backStep = previousStep(current, will.has_minor_children);
  const backHref =
    current > 1 ? `/dashboard/will?step=${backStep}` : undefined;

  const stepProps = {
    will,
    help: definition.help,
    backHref,
  };

  /*
   * A submitted Will: no longer editable, but very much not finished.
   *
   * This screen used to say "locked while it is with our review team, you will
   * be notified when the review is complete" and offer a Download PDF button.
   * All three were wrong once review became optional and payment moved ahead
   * of printing: nobody is necessarily reviewing it, no notification is coming,
   * and the download 402s until the Will is paid for and its owner identified.
   *
   * A client whose session expired during checkout landed here and found no
   * way back to payment at all. So it now shows the journey and its next
   * action — the same components the final wizard step uses — which is the
   * route back to paying, verifying and printing.
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

        <ReviewSummary will={will} />
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mx-10 lg:-mt-10">
      <StepProgress
        steps={steps}
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
          {current === 1 && <PersonalStep {...stepProps} />}
          {current === 2 && <DeclarationStep {...stepProps} />}
          {current === 3 && <ExecutorsStep {...stepProps} />}
          {/* 4 is specific bequests and 6 the residuary shares — gifts are
              made before what remains is divided. See lib/will/steps.ts. */}
          {current === 4 && <BequestsStep {...stepProps} />}
          {current === 5 && <GuardianshipStep {...stepProps} />}
          {current === 6 && <BeneficiariesStep {...stepProps} />}
          {current === 7 && <FuneralStep {...stepProps} />}
          {current === 8 && <WitnessesStep {...stepProps} />}
          {current === 9 && (
            <ReviewStep {...stepProps}>
              <ReviewSummary will={will} />

              {/*
                What used to sit here was an identity check and a "submit"
                button: identity gated submission, and printing came later.
                That order is reversed now — anyone may draft, then pay, then
                be identified, then print — so this step shows the journey and
                its next action instead. The liveness capture itself lives at
                /dashboard/kyc, which `JourneyActions` links to when it is
                actually the next thing owed.
              */}
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
            </ReviewStep>
          )}
        </div>
      </div>
    </div>
  );
}
