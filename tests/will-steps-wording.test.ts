import { describe, expect, it } from "vitest";

import {
  WILL_STEPS,
  sectionBySlug,
  sectionHelp,
  sectionTitle,
  stepIntro,
  stepTitle,
  type WillSectionSlug,
} from "@/lib/will/steps";
import { willVoice, type WillVoice } from "@/lib/will/voice";

/**
 * A lawyer drafts for a client, so every step speaks of "your client";
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

  it("speaks of the client on every step, not only the first", () => {
    // Step 1 was tailored and the rest were not: a lawyer was told to name
    // "the two people who will watch you sign".
    for (const step of WILL_STEPS) {
      expect(stepIntro(step, true)).toContain("your client");
    }

    const witnesses = WILL_STEPS.find((step) => step.slug === "witnesses")!;

    expect(stepIntro(witnesses)).toBe("Name the two people who will watch you sign.");
    expect(stepIntro(witnesses, true)).toBe(
      "Name the two people who will watch your client sign.",
    );
  });

  it("never tells a lawyer the estate, the executors or the witnesses are theirs", () => {
    const theirs = /\byour (assets|estate|executors?|trustees|beneficiaries|witnesses|names)\b|\bmy (executors|estate|children)\b|\bwatch you sign\b|\bacting for you\b/i;

    for (const step of WILL_STEPS) {
      expect(stepTitle(step, true)).not.toMatch(theirs);
      expect(stepIntro(step, true)).not.toMatch(theirs);

      for (const section of step.sections) {
        const slug = section.slug as WillSectionSlug;

        expect(sectionTitle(slug, true)).not.toMatch(theirs);
        expect(sectionHelp(slug, true)).not.toMatch(theirs);
      }
    }
  });

  it("heads the asset register with whose assets they are", () => {
    expect(sectionTitle("assets")).toBe("Your assets");
    expect(sectionTitle("assets", true)).toBe("Your client's assets");
    // Where the two read the same, the one title serves both.
    expect(sectionTitle("executors", true)).toBe(sectionBySlug("executors").title);
  });

  it("leaves the sections that address nobody as they are", () => {
    expect(sectionHelp("residue", true)).toBe(sectionBySlug("residue").help);
    expect(sectionHelp("funeral", true)).toBe(sectionBySlug("funeral").help);
  });
});

/** Every string in a voice, whatever group it sits in. */
function lines(voice: WillVoice): string[] {
  return Object.values(voice).flatMap((group) => Object.values(group));
}

describe("form wording for a Will drawn for a client", () => {
  it("keeps the testator's own words for the testator", () => {
    const own = willVoice();

    expect(own.declaration.lastWillLead).toBe("I declare this document to be my");
    expect(own.photograph.note).toContain("your Will");
    expect(willVoice(false)).toBe(own);
  });

  it("asks a lawyer for a photograph of their client", () => {
    expect(willVoice(true).photograph.note).toContain(
      "Use a recent passport photograph of your client against a plain background",
    );
    expect(willVoice(true).photograph.alt).toBe("Your client's passport photograph");
  });

  it("has a lawyer attest for their client, never for themselves", () => {
    const { declaration, review } = willVoice(true);

    expect(declaration.lastWillLead).toBe("My client declares this document to be their");
    expect(declaration.soundMind).toMatch(/^My client is of sound mind/);
    expect(declaration.revokes).toMatch(/^My client revokes/);
    expect(review.confirmAccurate).toContain("my client's instructions");
  });

  it("never has a lawyer say the Will, the estate or the executors are their own", () => {
    const theirs = /\bmy (Will|whole estate|estate|executors|trustees|beneficiaries|children|wishes|updated Will)\b|\byour (Will|executors|trustees|own words|updated Will)\b|\bI (declare|revoke|am of|have nothing|would rather)\b|\bwhat you own\b/;

    for (const line of lines(willVoice(true))) {
      expect(line).not.toMatch(theirs);
    }
  });

  it("offers a lawyer no review when lodging an update", () => {
    // Legal review is not offered on a lawyer's Will, so nothing mentions one.
    for (const line of lines(willVoice(true))) {
      expect(line).not.toMatch(/review/i);
    }
  });
});
