import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { JourneyActions } from "@/components/will/JourneyActions";
import { JourneyBar } from "@/components/will/JourneyBar";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/actions/guards";
import { listUserDocuments } from "@/lib/actions/documents";
import { readWill } from "@/lib/actions/will";
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
  AssetsStep,
  BeneficiariesStep,
  BequestsStep,
  DeclarationStep,
  ExecutorsStep,
  FuneralStep,
  GuardianshipStep,
  PersonalStep,
  ReviewStep,
  TrusteesStep,
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
   * flow, mirroring a `kyc.verified` middleware that guarded the backend's
   * `wills` routes. That middleware was removed when identity proofing moved
   * to *after payment and before printing* — but this redirect was left
   * behind, so the wizard still bounced every new client to a document check
   * before they had written a word. Anyone may draft; the gate is on releasing
   * the finished instrument, and it lives in `WillJourney::printBlockedBy()`
   * where the server can enforce it.
   */

  /*
   * The Will named in the URL, not "whichever one is in flight".
   *
   * The builder used to open `getOrCreateDraft()` and had no Will in its
   * address at all, so with more than one Will every Edit link was a guess —
   * pressing Edit on one Will could open another. The id is now part of the
   * route, so a link, a bookmark and a back button all mean the same document.
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
    redirect(`${basePath}?step=${current}`);
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
    current > 1 ? `${basePath}?step=${backStep}` : undefined;

  /*
   * The photograph belongs to the account, not the Will, so it is read here
   * rather than off the Will. Only the first step uses it.
   */
  const documents = await listUserDocuments();

  /*
   * Whether the name on this Will is this account holder's own.
   *
   * It is, for everybody but a lawyer: theirs is the identity checked against
   * the name the account was opened in. The server settles it either way — the
   * form only needs to know so it can show the name rather than ask for a
   * spelling it is going to replace.
   */
  const profile = await getProfile();

  const stepProps = {
    will,
    help: definition.help,
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

        <ReviewSummary will={will} editBasePath={basePath} />
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

        {/*
          Every step but the last draws its heading here.

          The review step draws its own, because it is the one step that can
          replace it: when the identity check takes the page, "Review &
          confirm - read it through" is no longer what the client is doing,
          and leaving it above the camera put two headings on screen at once.
        */}
        {definition.slug !== "review" && <StepHeading step={definition} />}

        <div className="mt-10">
          {/*
            Matched on the step's slug, not its number.
            
            The numbers moved twice and this list was updated late both times,
            which put the wrong form under the right heading. `definition`
            comes from the same table the backend mirrors.
          */}
          {definition.slug === "personal" && <PersonalStep {...stepProps} />}
          {definition.slug === "declaration" && <DeclarationStep {...stepProps} />}
          {definition.slug === "executors" && <ExecutorsStep {...stepProps} />}
          {definition.slug === "beneficiaries" && <BeneficiariesStep {...stepProps} />}
          {definition.slug === "assets" && <AssetsStep {...stepProps} />}
          {definition.slug === "bequests" && <BequestsStep {...stepProps} />}
          {definition.slug === "trustees" && <TrusteesStep {...stepProps} />}
          {definition.slug === "guardianship" && <GuardianshipStep {...stepProps} />}
          {definition.slug === "funeral" && <FuneralStep {...stepProps} />}
          {definition.slug === "witnesses" && <WitnessesStep {...stepProps} />}
          {definition.slug === "review" && (
            <ReviewStep
              {...stepProps}
              heading={<StepHeading step={definition} />}
            >
              <ReviewSummary will={will} editBasePath={basePath} />

              {/*
                Nothing about the journey here any more.

                This step used to carry the journey bar and its next action —
                a card saying payment was next, above a button that goes to
                payment. "Save & continue" commits the answers and lands on the
                Will's own page, which is that card's destination and where the
                bar, the review question and the payment button all live. Shown
                here as well, they were the same two things twice, a click
                apart.
              */}
            </ReviewStep>
          )}
        </div>
      </div>
    </div>
  );
}
