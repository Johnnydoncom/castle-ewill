import { describe, expect, it } from "vitest";

import { WILL_STEPS, sectionBySlug, sectionHelp, stepIntro, stepTitle } from "@/lib/will/steps";

/**
 * A lawyer drafts for a client, so the first step speaks of "your client";
 * everybody else is the testator and is still addressed as "you".
 */
describe("wizard wording for a Will drawn for a client", () => {
  const aboutYou = WILL_STEPS[0];

  it("titles the first step for the testator themselves by default", () => {
    expect(stepTitle(aboutYou)).toBe("About you");
    expect(stepIntro(aboutYou)).toContain("— you.");
    expect(sectionHelp("personal")).toBe(sectionBySlug("personal").help);
  });

  it("titles the first step for a lawyer's client", () => {
    expect(stepTitle(aboutYou, true)).toBe("About your client");
    expect(stepIntro(aboutYou, true)).toContain("your client");
    expect(sectionHelp("personal", true)).toContain("your client's names");
    expect(sectionHelp("declaration", true)).not.toContain("your last Will");
  });

  it("leaves every other step as it is", () => {
    for (const step of WILL_STEPS.slice(1)) {
      expect(stepTitle(step, true)).toBe(step.title);
      expect(stepIntro(step, true)).toBe(step.intro);
    }

    expect(sectionHelp("executors", true)).toBe(sectionBySlug("executors").help);
  });
});
