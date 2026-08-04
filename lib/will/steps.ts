/**
 * The nine-step guided questionnaire.
 *
 * Order and content follow the client's wireframe brief. Guardianship (step 5)
 * is conditional: it is skipped when the testator declares no minor children.
 */

export const WILL_STEPS = [
  {
    step: 1,
    slug: "personal",
    numeral: "I",
    title: "Personal details",
    eyebrow: "Start here",
    intro: "Begin with the person whose wishes we are recording — you.",
    help: "Use your full name exactly as it appears on your identity documents. A mismatch is the most common cause of probate delay.",
  },
  {
    step: 2,
    slug: "declaration",
    numeral: "II",
    title: "Declaration",
    eyebrow: "The testamentary clause",
    intro: "Confirm this document is your Last Will and Testament.",
    help: "A Will must state that it is your last Will and revoke earlier ones, otherwise two documents may be read together and contradict each other.",
  },
  {
    step: 3,
    slug: "executors",
    numeral: "III",
    title: "Executors",
    eyebrow: "Who will administer your estate",
    intro:
      "Choose who will carry out your wishes. We recommend at least two executors.",
    help: "An executor gathers your assets, settles debts and distributes what remains. A beneficiary may also serve as an executor.",
  },
  {
    step: 4,
    slug: "beneficiaries",
    numeral: "IV",
    title: "Beneficiaries",
    eyebrow: "Who inherits",
    intro: "Specify who inherits your estate, and in what proportion.",
    help: "Shares of the residuary estate must total exactly 100%. Name a contingent beneficiary in case someone predeceases you.",
  },
  {
    step: 5,
    slug: "guardianship",
    numeral: "V",
    title: "Guardianship",
    eyebrow: "For minor children",
    intro: "Appoint a guardian for any children under eighteen.",
    help: "Without an appointed guardian, the court decides who raises your children. Always name an alternate.",
    conditional: true,
  },
  {
    step: 6,
    slug: "bequests",
    numeral: "VI",
    title: "Specific bequests",
    eyebrow: "Particular gifts",
    intro:
      "List individual gifts of property or items, and who should receive them.",
    help: "Describe each item precisely enough that a stranger could identify it. Specific gifts are distributed before the residuary estate.",
  },
  {
    step: 7,
    slug: "funeral",
    numeral: "VII",
    title: "Funeral wishes",
    eyebrow: "Final arrangements",
    intro: "Record your preferences for your final arrangements.",
    help: "Funeral wishes are a guide to your family rather than a binding direction, but recording them removes painful guesswork.",
  },
  {
    step: 8,
    slug: "witnesses",
    numeral: "VIII",
    title: "Witnesses",
    eyebrow: "Attestation",
    intro: "Provide details of the two witnesses who will attest your Will.",
    help: "A witness — or the spouse of a witness — cannot inherit under the Will. A gift to a witness is void, even though the Will itself stays valid.",
  },
  {
    step: 9,
    slug: "review",
    numeral: "IX",
    title: "Review & confirm",
    eyebrow: "Final step",
    intro: "Check every entry, then generate your Will document.",
    help: "Read the summary carefully. Once generated, print the Will and sign it in the simultaneous presence of both witnesses.",
  },
] as const;

export type WillStepDefinition = (typeof WILL_STEPS)[number];
export type WillStepSlug = WillStepDefinition["slug"];

export const TOTAL_STEPS = WILL_STEPS.length;

export function stepBySlug(slug: string): WillStepDefinition | undefined {
  return WILL_STEPS.find((s) => s.slug === slug);
}

export function stepByNumber(step: number): WillStepDefinition | undefined {
  return WILL_STEPS.find((s) => s.step === step);
}

/**
 * Resolves the next step, honouring the conditional skip for guardianship.
 * `hasMinorChildren === false` jumps step 5 in both directions.
 */
export function nextStep(current: number, hasMinorChildren: boolean | null): number {
  const candidate = current + 1;
  if (candidate === 5 && hasMinorChildren === false) return 6;
  return Math.min(candidate, TOTAL_STEPS);
}

export function previousStep(
  current: number,
  hasMinorChildren: boolean | null,
): number {
  const candidate = current - 1;
  if (candidate === 5 && hasMinorChildren === false) return 4;
  return Math.max(candidate, 1);
}

/** Steps that apply to this particular Will, used to render the progress bar. */
export function applicableSteps(
  hasMinorChildren: boolean | null,
): WillStepDefinition[] {
  return WILL_STEPS.filter(
    (s) => !(s.step === 5 && hasMinorChildren === false),
  );
}

/**
 * Clamps a requested `?step=` to what the Will has actually reached.
 *
 * `will.current_step` is the furthest step the server has recorded — every
 * step before it is complete, and nothing after it has been touched yet.
 * Without this, the query string is an unchecked way to view (and submit
 * into) a step the wizard hasn't gated the person into yet, e.g. jumping
 * straight to Funeral Wishes while Guardianship and Bequests are still
 * blank. Going *back* to review or amend an earlier step stays unrestricted
 * — only jumping ahead of `current_step` is refused.
 */
export function clampToReachable(
  requested: number,
  currentStep: number,
  hasMinorChildren: boolean | null,
): number {
  let step = Math.min(Math.max(requested, 1), currentStep, TOTAL_STEPS);

  // Guardianship doesn't exist for this Will — land somewhere applicable
  // rather than rendering a step that was never meant to be reached.
  if (step === 5 && hasMinorChildren === false) {
    step = currentStep >= 6 ? 6 : 4;
  }

  return step;
}
