import { describe, expect, it } from "vitest";

import {
  clampToReachable,
  sectionBySlug,
  stepForSection,
  WILL_STEPS,
} from "@/lib/will/steps";

/**
 * The wizard's shape, guarded.
 *
 * Faults here are invisible at runtime rather than loud: a review link built
 * from a stale number opens the wrong form, and a step order that disagrees
 * with the server sends a client back to a page they have already answered.
 */
describe("the step table", () => {
  it("numbers every step consecutively from one", () => {
    expect(WILL_STEPS.map((s) => s.step)).toEqual(
      WILL_STEPS.map((_, index) => index + 1),
    );
  });

  it("mirrors the server's steps and sections, in the same order", () => {
    /*
     * The same lists as `App\Support\WillSteps`. The residue comes straight
     * after the specific gifts, because it is whatever those gifts leave.
     */
    expect(
      WILL_STEPS.map((s) => [s.slug, s.sections.map((section) => section.slug)]),
    ).toEqual([
      ["about-you", ["personal", "declaration"]],
      ["estate", ["executors", "beneficiaries", "trustees", "assets"]],
      ["wishes", ["bequests", "residue", "funeral"]],
      ["witnesses", ["witnesses"]],
      ["review", ["review"]],
    ]);
  });

  it("gives every section a slug of its own and help of its own", () => {
    const sections = WILL_STEPS.flatMap((s) => [...s.sections]);

    expect(new Set(sections.map((s) => s.slug)).size).toBe(sections.length);
    expect(sections.every((s) => s.help.length > 0)).toBe(true);
  });

  it("finds the page a section is answered on", () => {
    expect(stepForSection("residue").slug).toBe("wishes");
    expect(sectionBySlug("beneficiaries").step).toBe(2);
  });

  it("never lets the address bar jump ahead of the Will", () => {
    expect(clampToReachable(5, 2)).toBe(2);
    expect(clampToReachable(1, 4)).toBe(1);
    expect(clampToReachable(0, 3)).toBe(1);
  });
});
