import { describe, expect, it } from "vitest";

import {
  LANDMARK,
  THRESHOLD,
  eyeAspectRatio,
  mouthAspectRatio,
  satisfies,
  smileRatio,
  yawRatio,
  type Point,
} from "@/lib/verification/landmarks";
import { pickChallenges } from "@/lib/verification";
import { ALL_CHALLENGES } from "@/lib/verification/types";

/** Synthetic 468-point mesh with the handful of landmarks we actually read. */
function face({
  noseX = 0.5,
  mouthGap = 0.02,
  mouthWidth = 0.1,
  eyeGap = 0.02,
} = {}): Point[] {
  const p: Point[] = Array.from({ length: 471 }, () => ({ x: 0.5, y: 0.5 }));
  p[LANDMARK.leftEyeOuter] = { x: 0.4, y: 0.4 };
  p[LANDMARK.rightEyeOuter] = { x: 0.6, y: 0.4 };
  p[LANDMARK.noseTip] = { x: noseX, y: 0.5 };
  p[LANDMARK.leftEyeTop] = { x: 0.42, y: 0.4 - eyeGap / 2 };
  p[LANDMARK.leftEyeBottom] = { x: 0.42, y: 0.4 + eyeGap / 2 };
  p[LANDMARK.rightEyeTop] = { x: 0.58, y: 0.4 - eyeGap / 2 };
  p[LANDMARK.rightEyeBottom] = { x: 0.58, y: 0.4 + eyeGap / 2 };
  p[LANDMARK.mouthTop] = { x: 0.5, y: 0.62 - mouthGap / 2 };
  p[LANDMARK.mouthBottom] = { x: 0.5, y: 0.62 + mouthGap / 2 };
  p[LANDMARK.mouthLeft] = { x: 0.5 - mouthWidth / 2, y: 0.62 };
  p[LANDMARK.mouthRight] = { x: 0.5 + mouthWidth / 2, y: 0.62 };
  return p;
}

describe("a neutral face satisfies nothing", () => {
  const neutral = face();

  it("has approximately zero yaw", () => {
    expect(Math.abs(yawRatio(neutral))).toBeLessThan(0.05);
  });

  it.each(["turn_left", "turn_right", "open_mouth", "smile"] as const)(
    "does not satisfy %s",
    (challenge) => {
      expect(satisfies(challenge, neutral)).toBe(false);
    },
  );

  it("does not satisfy blink without an observed blink", () => {
    expect(satisfies("blink", neutral, false)).toBe(false);
  });
});

describe("deliberate movements are detected", () => {
  it("detects a head turn in each direction", () => {
    expect(satisfies("turn_left", face({ noseX: 0.44 }))).toBe(true);
    expect(satisfies("turn_right", face({ noseX: 0.56 }))).toBe(true);
  });

  it("does not accept a left turn as a right turn", () => {
    expect(satisfies("turn_right", face({ noseX: 0.44 }))).toBe(false);
    expect(satisfies("turn_left", face({ noseX: 0.56 }))).toBe(false);
  });

  it("distinguishes an open mouth from parted lips", () => {
    expect(satisfies("open_mouth", face({ mouthGap: 0.07 }))).toBe(true);
    expect(satisfies("open_mouth", face({ mouthGap: 0.03 }))).toBe(false);
  });

  it("detects a smile by mouth width", () => {
    expect(satisfies("smile", face({ mouthWidth: 0.21 }))).toBe(true);
    expect(smileRatio(face({ mouthWidth: 0.21 }))).toBeGreaterThan(
      THRESHOLD.smile,
    );
  });

  it("separates open and closed eyes across the thresholds", () => {
    expect(eyeAspectRatio(face({ eyeGap: 0.03 }))).toBeGreaterThan(
      THRESHOLD.eyeOpen,
    );
    expect(eyeAspectRatio(face({ eyeGap: 0.002 }))).toBeLessThan(
      THRESHOLD.eyeClosed,
    );
  });
});

describe("robustness", () => {
  it("returns zero rather than throwing on an empty mesh", () => {
    expect(yawRatio([])).toBe(0);
    expect(mouthAspectRatio([])).toBe(0);
    expect(eyeAspectRatio([])).toBe(0);
    expect(smileRatio([])).toBe(0);
  });

  it("treats an unknown challenge as unsatisfied, even with a blink observed", () => {
    // Guards against a future challenge name being added to the type but not
    // to the switch, which would otherwise silently pass.
    expect(satisfies("nod" as unknown as "blink", face(), true)).toBe(false);
    expect(satisfies("nod" as unknown as "blink", face(), false)).toBe(false);
  });
});

describe("challenge selection", () => {
  it("returns the requested number of distinct challenges", () => {
    const picked = pickChallenges(3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    for (const c of picked) expect(ALL_CHALLENGES).toContain(c);
  });

  it("varies between attempts, so a recording cannot be replayed", () => {
    const sequences = new Set(
      Array.from({ length: 40 }, () => pickChallenges(3).join(",")),
    );
    expect(sequences.size).toBeGreaterThan(1);
  });

  it("never asks for more challenges than exist", () => {
    expect(pickChallenges(99)).toHaveLength(ALL_CHALLENGES.length);
  });
});
