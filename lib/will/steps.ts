/**
 * The nine-step guided questionnaire.
 *
 * Order and content follow the client's wireframe brief. Guardianship (step 5)
 * is conditional: it is skipped when the testator declares no minor children.
 */

/**
 * The guided questionnaire, in the order an estate is actually settled.
 *
 * Appoint the people, name who benefits, establish what there is, then say who
 * gets what. Beneficiaries before assets because a gift needs a recipient;
 * assets before bequests because a gift needs a thing.
 *
 * **These numbers mirror `App\Support\WillSteps` and nothing else may restate
 * them.** The order lived in several places on both tiers and drifted twice,
 * each time showing up as "Save & Continue does nothing" — the cursor advanced
 * past a step the client had not reached and sent them back to it.
 *
 * Guardianship is conditional: skipped when the testator declares no minor
 * children.
 */
export const WILL_STEPS = [
  {
    step: 1,
    slug: "personal",
    numeral: "I",
    title: "Personal details",
    eyebrow: "Start here",
    intro: "Begin with the person whose wishes we are recording — you.",
    help: "Use your names exactly as they appear on your identity documents. A mismatch is the most common cause of probate delay, and it is what an identity check is compared against.",
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
    intro: "Choose who will carry out your wishes. At least two are required.",
    help: "An executor gathers your assets, settles debts and distributes what remains. Two are required: if a sole executor dies first or cannot act, the estate goes to the court for an administrator you did not choose. A beneficiary may also serve as an executor.",
  },
  {
    step: 4,
    slug: "beneficiaries",
    numeral: "IV",
    title: "Beneficiaries",
    eyebrow: "Who inherits",
    intro:
      "Name everyone who should inherit, how you are related, and the share of your residuary estate each takes.",
    help: "The residuary estate is everything left once specific gifts, debts and expenses are settled. Shares must total 100%. A witness must never be a beneficiary — the gift fails, though the Will stands.",
  },
  {
    step: 5,
    slug: "assets",
    numeral: "V",
    title: "Your assets",
    eyebrow: "What you own",
    intro:
      "List what you own — land and buildings, vehicles, accounts, personal effects, jewellery and anything else of value.",
    help: "An estate nobody has written down is an estate your executor has to go looking for. Listing it here does not give it away; it tells the people acting for you what there is.",
  },
  {
    step: 6,
    slug: "bequests",
    numeral: "VI",
    title: "Specific gifts",
    eyebrow: "Who gets what",
    intro:
      "Give particular items to particular people — or leave the whole estate to your trustees to hold and manage.",
    help: "This is the point of a Will, so it has to be answered. If you would rather not name gifts item by item, choose to leave everything to your trustees: they hold the estate and manage it for your beneficiaries on the shares you have already set.",
  },
  {
    step: 7,
    slug: "trustees",
    numeral: "VII",
    title: "Trustees",
    eyebrow: "Who holds the estate",
    intro:
      "Trustees hold your estate and manage it for your beneficiaries. Most people appoint their executors.",
    help: "An executor winds your estate up and hands it over; a trustee keeps holding it, which is what a young beneficiary or a share paid out over time requires. You can also direct that a trust bank account be opened — that is where a guardian's money for your children comes from.",
  },
  {
    step: 8,
    slug: "guardianship",
    numeral: "VIII",
    title: "Guardianship",
    eyebrow: "For children under 18",
    intro: "Appoint someone to care for your children if they are still minors.",
    help: "Only applies if you have children under 18. Name a guardian you have actually asked — an appointment nobody agreed to is the first thing a court sets aside.",
  },
  {
    step: 9,
    slug: "funeral",
    numeral: "IX",
    title: "Funeral wishes",
    eyebrow: "Your instructions",
    intro: "Say how you would like to be laid to rest.",
    help: "Funeral wishes are a request rather than a binding direction, but a family with something in writing is a family with less to argue about.",
  },
  {
    step: 10,
    slug: "witnesses",
    numeral: "X",
    title: "Witnesses",
    eyebrow: "Two are required",
    intro: "Name the two people who will watch you sign.",
    help: "Two witnesses must watch you sign and then sign in front of you. Neither may be a beneficiary, or that person's gift fails.",
  },
  {
    step: 11,
    slug: "review",
    numeral: "XI",
    title: "Review & confirm",
    eyebrow: "Last look",
    intro: "Read it through before you confirm it is accurate.",
    help: "Nothing is final until you print and sign it in front of your witnesses.",
  },
] as const;

export type WillStepDefinition = (typeof WILL_STEPS)[number];
export type WillStepSlug = WillStepDefinition["slug"];

/** Eleven, counted rather than written down. */
export const TOTAL_STEPS = WILL_STEPS.length;

/**
 * The conditional step, named rather than numbered.
 *
 * It was written as a literal `5` in four places here. When the order moved it
 * would have skipped whichever step happened to be fifth — which, after this
 * reorder, is the asset register.
 */
export const GUARDIANSHIP_STEP =
  WILL_STEPS.find((s) => s.slug === "guardianship")!.step;

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
  if (candidate === GUARDIANSHIP_STEP && hasMinorChildren === false) {
    return GUARDIANSHIP_STEP + 1;
  }
  return Math.min(candidate, TOTAL_STEPS);
}

export function previousStep(
  current: number,
  hasMinorChildren: boolean | null,
): number {
  const candidate = current - 1;
  if (candidate === GUARDIANSHIP_STEP && hasMinorChildren === false) {
    return GUARDIANSHIP_STEP - 1;
  }
  return Math.max(candidate, 1);
}

/** Steps that apply to this particular Will, used to render the progress bar. */
export function applicableSteps(
  hasMinorChildren: boolean | null,
): WillStepDefinition[] {
  return WILL_STEPS.filter(
    (s) => !(s.step === GUARDIANSHIP_STEP && hasMinorChildren === false),
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
  if (step === GUARDIANSHIP_STEP && hasMinorChildren === false) {
    step = currentStep >= 6 ? 6 : 4;
  }

  return step;
}
