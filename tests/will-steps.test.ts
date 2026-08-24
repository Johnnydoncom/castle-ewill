import { describe, expect, it } from "vitest";

import { WILL_STEPS } from "@/lib/will/steps";

/**
 * The wizard's shape, guarded.
 *
 * Two faults here were invisible at runtime rather than loud: a step whose
 * field prefix did not match what the action collected saved nothing while
 * reporting success, and a review link built from a stale literal opened the
 * wrong form. Both are cheap to assert and expensive to notice.
 */
describe("the step table", () => {
  it("numbers every step consecutively from one", () => {
    expect(WILL_STEPS.map((s) => s.step)).toEqual(
      WILL_STEPS.map((_, index) => index + 1),
    );
  });

  it("keeps the order an estate is actually settled in", () => {
    /*
     * Appoint the people, name who benefits, establish what there is, then say
     * who gets what. A gift needs a recipient before it needs a thing, which is
     * why beneficiaries come before assets and assets before bequests.
     */
    expect(WILL_STEPS.map((s) => s.slug)).toEqual([
      "personal",
      "declaration",
      "executors",
      "beneficiaries",
      "assets",
      "bequests",
      "trustees",
      "guardianship",
      "funeral",
      "witnesses",
      "review",
    ]);
  });

  it("gives every step a slug of its own", () => {
    const slugs = WILL_STEPS.map((s) => s.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
