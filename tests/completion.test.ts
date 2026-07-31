import { describe, expect, it } from "vitest";

import {
  canSubmit,
  completionPercent,
  nextIncompleteStep,
  type CompletionInput,
} from "@/lib/will/completion";
import { applicableSteps, nextStep, previousStep } from "@/lib/will/steps";

const empty: CompletionInput = {
  fullLegalName: null,
  dateOfBirth: null,
  addressLine1: null,
  city: null,
  state: null,
  declaredLastWill: false,
  revokesPriorWills: false,
  confirmedSoundMind: false,
  hasMinorChildren: null,
  funeralPreference: null,
  confirmedAccurate: false,
  executorCount: 0,
  beneficiaryCount: 0,
  guardianCount: 0,
  bequestCount: 0,
  witnessCount: 0,
};

const complete: CompletionInput = {
  fullLegalName: "Ada Okafor",
  dateOfBirth: "1985-04-02",
  addressLine1: "12 Bourdillon Road",
  city: "Ikoyi",
  state: "Lagos",
  declaredLastWill: true,
  revokesPriorWills: true,
  confirmedSoundMind: true,
  hasMinorChildren: true,
  funeralPreference: "burial",
  confirmedAccurate: true,
  executorCount: 2,
  beneficiaryCount: 3,
  guardianCount: 1,
  bequestCount: 2,
  witnessCount: 2,
};

describe("completion", () => {
  it("is 0% for an untouched draft", () => {
    expect(completionPercent(empty)).toBe(0);
  });

  it("is 100% for a fully answered will", () => {
    expect(completionPercent(complete)).toBe(100);
  });

  it("reaches 100% when guardianship is legitimately skipped", () => {
    const noChildren: CompletionInput = {
      ...complete,
      hasMinorChildren: false,
      guardianCount: 0,
    };
    expect(completionPercent(noChildren)).toBe(100);
  });

  it("does not let a missing guardian be hidden by the skip", () => {
    const needsGuardian: CompletionInput = {
      ...complete,
      hasMinorChildren: true,
      guardianCount: 0,
    };
    expect(completionPercent(needsGuardian)).toBeLessThan(100);
    expect(canSubmit(needsGuardian)).toBe(false);
  });

  it("points at the first unanswered step", () => {
    expect(nextIncompleteStep(empty)).toBe(1);
    expect(
      nextIncompleteStep({
        ...empty,
        fullLegalName: "Ada",
        dateOfBirth: "1985-04-02",
        addressLine1: "12 Bourdillon Road",
        city: "Ikoyi",
        state: "Lagos",
      }),
    ).toBe(2);
  });

  it("allows submission without specific bequests, which are optional", () => {
    expect(canSubmit({ ...complete, bequestCount: 0 })).toBe(true);
  });

  it("blocks submission when a witness is missing", () => {
    expect(canSubmit({ ...complete, witnessCount: 1 })).toBe(false);
  });
});

describe("step navigation", () => {
  it("skips guardianship in both directions when there are no minor children", () => {
    expect(nextStep(4, false)).toBe(6);
    expect(previousStep(6, false)).toBe(4);
  });

  it("visits guardianship when there are minor children", () => {
    expect(nextStep(4, true)).toBe(5);
    expect(previousStep(6, true)).toBe(5);
  });

  it("treats an unanswered guardianship question as applicable", () => {
    expect(nextStep(4, null)).toBe(5);
    expect(applicableSteps(null)).toHaveLength(9);
    expect(applicableSteps(false)).toHaveLength(8);
  });

  it("clamps at the boundaries", () => {
    expect(previousStep(1, true)).toBe(1);
    expect(nextStep(9, true)).toBe(9);
  });
});
