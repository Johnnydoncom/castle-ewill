import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";

import { requireUser } from "@/lib/actions/guards";
import {
  getActiveVerification,
  getLatestVerification,
} from "@/lib/actions/verification";
import { LivenessCheck } from "@/components/verification/LivenessCheck";
import {
  getFullWill,
  getOrCreateDraft,
  toCompletionInput,
} from "@/lib/will/repository";
import { completionPercent, stepCompletions } from "@/lib/will/completion";
import {
  applicableSteps,
  previousStep,
  stepByNumber,
  TOTAL_STEPS,
} from "@/lib/will/steps";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
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
  const user = await requireUser();
  const { step: stepParam } = await searchParams;

  const draft = await getOrCreateDraft(user.id, user.name);
  const will = await getFullWill(draft.id, user.id);

  if (!will) {
    // getOrCreateDraft just wrote this row; an absence here means the record was
    // removed between the two reads.
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-serif text-lg text-navy">
          We could not open your Will. Please refresh and try again.
        </p>
      </div>
    );
  }

  const requested = Number(stepParam);
  const current =
    Number.isInteger(requested) && requested >= 1 && requested <= TOTAL_STEPS
      ? requested
      : will.currentStep;

  // Only needed on the final step, but resolved here so the server decides
  // what the review screen may offer.
  const verification =
    current === 9 ? await getActiveVerification(user.id) : null;
  const latestVerification =
    current === 9 ? await getLatestVerification(user.id) : null;

  const steps = applicableSteps(will.hasMinorChildren);
  const definition = stepByNumber(current) ?? steps[0];
  const completions = stepCompletions(toCompletionInput(will));
  const percent = completionPercent(toCompletionInput(will));

  const backStep = previousStep(current, will.hasMinorChildren);
  const backHref =
    current > 1 ? `/dashboard/will?step=${backStep}` : undefined;

  const stepProps = {
    will,
    help: definition.help,
    backHref,
  };

  // A submitted Will is read-only until a new version is started.
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
            Your Will is {WILL_STATUS_LABELS[will.status]?.toLowerCase()}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            This document is locked while it is with our review team. You will be
            notified as soon as the review is complete.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/api/wills/${will.id}/pdf`}
              className="inline-flex items-center gap-2 bg-navy px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Link>
          </div>
        </header>
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
          {current === 4 && <BeneficiariesStep {...stepProps} />}
          {current === 5 && <GuardianshipStep {...stepProps} />}
          {current === 6 && <BequestsStep {...stepProps} />}
          {current === 7 && <FuneralStep {...stepProps} />}
          {current === 8 && <WitnessesStep {...stepProps} />}
          {current === 9 && (
            <ReviewStep {...stepProps}>
              <ReviewSummary will={will} />

              {verification ? (
                <div className="flex items-start gap-3 border-l-2 border-success bg-success/5 px-5 py-4 text-sm text-navy">
                  <span aria-hidden className="mt-0.5 text-success">
                    &#10003;
                  </span>
                  <p className="leading-relaxed">
                    Identity verified. You can submit your Will below.
                  </p>
                </div>
              ) : latestVerification?.status === "pending" ? (
                <div className="border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm leading-relaxed text-navy">
                  Your identity check has been recorded and is awaiting review.
                  We will email you as soon as it is approved, and you can submit
                  your Will then.
                </div>
              ) : (
                <LivenessCheck />
              )}
            </ReviewStep>
          )}
        </div>
      </div>
    </div>
  );
}
