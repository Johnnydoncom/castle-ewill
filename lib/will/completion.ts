import { TOTAL_STEPS } from "./steps";

/**
 * Completion scoring for the progress ring on the dashboard.
 *
 * Each applicable step contributes an equal share. Guardianship is excluded
 * from the denominator when the testator has declared no minor children, so a
 * user who legitimately skips it can still reach 100%.
 */

export type CompletionInput = {
  fullLegalName?: string | null;
  dateOfBirth?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;

  declaredLastWill: boolean;
  revokesPriorWills: boolean;
  confirmedSoundMind: boolean;

  hasMinorChildren?: boolean | null;

  funeralPreference?: string | null;
  confirmedAccurate: boolean;

  executorCount: number;
  beneficiaryCount: number;
  guardianCount: number;
  bequestCount: number;
  witnessCount: number;
};

export type StepCompletion = {
  step: number;
  complete: boolean;
  applicable: boolean;
};

export function stepCompletions(input: CompletionInput): StepCompletion[] {
  const guardianshipApplies = input.hasMinorChildren !== false;

  return [
    {
      step: 1,
      applicable: true,
      complete: Boolean(
        input.fullLegalName &&
          input.dateOfBirth &&
          input.addressLine1 &&
          input.city &&
          input.state,
      ),
    },
    {
      step: 2,
      applicable: true,
      complete:
        input.declaredLastWill &&
        input.revokesPriorWills &&
        input.confirmedSoundMind,
    },
    { step: 3, applicable: true, complete: input.executorCount > 0 },
    { step: 4, applicable: true, complete: input.beneficiaryCount > 0 },
    {
      step: 5,
      applicable: guardianshipApplies,
      // Answering "no minor children" is itself a complete answer.
      complete:
        input.hasMinorChildren === false ||
        (input.hasMinorChildren === true && input.guardianCount > 0),
    },
    // Specific bequests are genuinely optional; the step counts as complete
    // once the testator has reached and passed it, which we infer from the
    // declaration being signed off.
    { step: 6, applicable: true, complete: input.bequestCount >= 0 && input.declaredLastWill },
    { step: 7, applicable: true, complete: Boolean(input.funeralPreference) },
    { step: 8, applicable: true, complete: input.witnessCount === 2 },
    { step: 9, applicable: true, complete: input.confirmedAccurate },
  ];
}

export function completionPercent(input: CompletionInput): number {
  const steps = stepCompletions(input).filter((s) => s.applicable);
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.complete).length;
  return Math.round((done / steps.length) * 100);
}

/** The first incomplete step — where "Continue" should drop the user. */
export function nextIncompleteStep(input: CompletionInput): number {
  const next = stepCompletions(input).find((s) => s.applicable && !s.complete);
  return next?.step ?? TOTAL_STEPS;
}

/**
 * Whether the Will may be submitted for review. Bequests are optional; every
 * other applicable step must be complete.
 */
export function canSubmit(input: CompletionInput): boolean {
  return stepCompletions(input)
    .filter((s) => s.applicable && s.step !== 6)
    .every((s) => s.complete);
}
