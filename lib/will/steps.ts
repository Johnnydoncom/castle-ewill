/**
 * The guided questionnaire: four pages of questions, then a last look.
 *
 * A **step** is a page with one Save & continue. A **section** is one question
 * on it — who the executors are, how the residue is shared. Help text belongs
 * to the section, because a page asking four things needs four explanations.
 *
 * **These mirror `App\Support\WillSteps` and nothing else may restate them.**
 * The order lived in several places on both tiers and drifted twice, each time
 * showing up as "Save & Continue does nothing" — the cursor advanced past a
 * step the client had not reached and sent them back to it.
 *
 * The residue is shared out straight after the specific gifts, because it is
 * whatever those gifts leave.
 */
export const WILL_STEPS = [
  {
    step: 1,
    slug: "about-you",
    numeral: "I",
    title: "About you",
    eyebrow: "Start here",
    intro: "Begin with the person whose wishes we are recording — you.",
    sections: [
      {
        slug: "personal",
        title: "Personal details",
        help: "Use your names exactly as they appear on your identity documents. A mismatch is the most common cause of probate delay, and it is what an identity check is compared against.",
      },
      {
        slug: "declaration",
        title: "Declaration",
        help: "A Will must state that it is your last Will and revoke earlier ones, otherwise two documents may be read together and contradict each other.",
      },
    ],
  },
  {
    step: 2,
    slug: "estate",
    numeral: "II",
    title: "Executors, Trustees, Beneficiaries & Assets",
    eyebrow: "Who and what",
    intro:
      "The people who will act for you, the people who inherit, and what you own.",
    sections: [
      {
        slug: "executors",
        title: "Executors",
        help: "An executor gathers your assets, settles debts and distributes your estate. Appoint at least two executors. A beneficiary may also be an executor.",
      },
      {
        slug: "beneficiaries",
        title: "Beneficiaries",
        help: "Name everyone who should inherit and how you are related. If a beneficiary is under 18, appointment of a trusted guardian is desirable.",
      },
      {
        slug: "trustees",
        title: "Trustees",
        help: "Direct my executors to open a trust bank account, from which my estate is generally administered and the appointed guardian is provided with what my children need.",
      },
      {
        slug: "assets",
        title: "Your assets",
        help: "An estate nobody has written down is an estate your executor has to go looking for. Listing it here does not give it away; it tells the people acting for you what there is.",
      },
    ],
  },
  {
    step: 3,
    slug: "wishes",
    numeral: "III",
    title: "Gifts & wishes",
    eyebrow: "Who gets what",
    intro:
      "Particular gifts first, then how everything else is shared, then how you would like to be laid to rest.",
    sections: [
      {
        slug: "bequests",
        title: "Specific gifts",
        help: "Give particular items to particular people — or, if you would rather not name gifts item by item, leave the whole estate to your trustees to hold and manage for your beneficiaries on the shares you set below.",
      },
      {
        slug: "residue",
        title: "Residuary estate",
        help: "The residuary estate is everything left once specific gifts, debts and expenses are settled. Shares must total 100%.",
      },
      {
        slug: "funeral",
        title: "Funeral wishes",
        help: "Funeral wishes are a request rather than a binding direction, but a family with something in writing is a family with less to argue about.",
      },
    ],
  },
  {
    step: 4,
    slug: "witnesses",
    numeral: "IV",
    title: "Witnesses",
    eyebrow: "Two are required",
    intro: "Name the two people who will watch you sign.",
    sections: [
      {
        slug: "witnesses",
        title: "Witnesses",
        help: "Two witnesses must watch you sign and then sign in front of you. Neither may be a beneficiary, or that person's gift fails.",
      },
    ],
  },
  {
    step: 5,
    slug: "review",
    numeral: "V",
    title: "Review & confirm",
    eyebrow: "Last look",
    intro: "Read it through before you confirm it is accurate.",
    sections: [
      {
        slug: "review",
        title: "Review & confirm",
        help: "Nothing is final until you print and sign it in front of your witnesses.",
      },
    ],
  },
] as const;

export type WillStepDefinition = (typeof WILL_STEPS)[number];
export type WillStepSlug = WillStepDefinition["slug"];
export type WillSectionSlug = WillStepDefinition["sections"][number]["slug"];

export type WillSectionDefinition = {
  slug: WillSectionSlug;
  title: string;
  help: string;
  /** The step this section is answered on. */
  step: number;
};

/** Counted rather than written down. */
export const TOTAL_STEPS = WILL_STEPS.length;

/**
 * The table widened to one shape, so it can be searched.
 *
 * `as const` gives every step's sections a tuple type of its own, and a union
 * of differently-shaped tuples is awkward to iterate. The literal types above
 * are still what callers see.
 */
const STEPS: ReadonlyArray<{
  readonly step: number;
  readonly sections: ReadonlyArray<{ readonly slug: string; readonly title: string; readonly help: string }>;
}> = WILL_STEPS;

export function stepByNumber(step: number): WillStepDefinition | undefined {
  return WILL_STEPS.find((s) => s.step === step);
}

export function sectionBySlug(slug: WillSectionSlug): WillSectionDefinition {
  for (const step of STEPS) {
    const section = step.sections.find((s) => s.slug === slug);

    if (section) {
      return { slug, title: section.title, help: section.help, step: step.step };
    }
  }

  throw new Error(`Unknown Will section: ${slug}`);
}

/** The step a section is answered on. */
export function stepForSection(slug: WillSectionSlug): WillStepDefinition {
  return stepByNumber(sectionBySlug(slug).step)!;
}

export function previousStep(current: number): number {
  return Math.max(current - 1, 1);
}

/**
 * Clamps a requested `?step=` to what the Will has actually reached.
 *
 * `will.current_step` is the furthest step the server has recorded. Without
 * this, the query string is an unchecked way to view (and submit into) a step
 * the client hasn't reached. Going *back* stays unrestricted — only jumping
 * ahead of `current_step` is refused.
 */
export function clampToReachable(requested: number, currentStep: number): number {
  return Math.min(Math.max(requested, 1), currentStep, TOTAL_STEPS);
}
