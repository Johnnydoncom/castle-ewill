import { describe, expect, it } from "vitest";

import {
  CHALLENGE_PROMPTS,
  LANDMARK,
  THRESHOLD,
  eyeAspectRatio,
  baselineFrom,
  mouthAspectRatio,
  satisfies,
  smileRatio,
  yawRatio,
  type ChallengeName,
  type Point,
} from "@/lib/verification/landmarks";

/**
 * The challenges the client can detect.
 *
 * Sequence *selection* moved to the backend with the rest of the domain — a
 * sequence the browser chose could be satisfied with a recording the attacker
 * already had. What is still tested here is the geometry: whether a given frame
 * satisfies a given challenge, which is the part that runs in the browser.
 */
const ALL_CHALLENGES = Object.keys(CHALLENGE_PROMPTS) as ChallengeName[];

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

  it("judges an open mouth against the person's own resting face", () => {
    /*
     * These were absolute, and the numbers were unreachable: a smile had to
     * make the mouth 0.95x the distance between the outer eye corners, which
     * no ordinary face manages, and "open wide" wanted a height:width ratio
     * over 0.5. Both challenges could be failed indefinitely by someone doing
     * exactly what was asked.
     */
    const resting = Array.from({ length: 5 }, () => face({ mouthGap: 0.02 }));
    const baseline = baselineFrom(resting);

    expect(baseline).not.toBeNull();
    expect(satisfies("open_mouth", face({ mouthGap: 0.05 }), false, baseline)).toBe(true);
    expect(satisfies("open_mouth", face({ mouthGap: 0.025 }), false, baseline)).toBe(false);
  });

  it("judges a smile against the person's own resting mouth", () => {
    const resting = Array.from({ length: 5 }, () => face({ mouthWidth: 0.1 }));
    const baseline = baselineFrom(resting);

    // A widening of roughly a tenth is a smile; a millimetre is not.
    expect(satisfies("smile", face({ mouthWidth: 0.115 }), false, baseline)).toBe(true);
    expect(satisfies("smile", face({ mouthWidth: 0.101 }), false, baseline)).toBe(false);
  });

  it("still answers when no baseline was captured", () => {
    // A face that arrived mid-expression, or a camera that started late. The
    // floors are generous on purpose: a challenge nobody can pass strands the
    // client, and this check is a first filter rather than anti-spoofing.
    expect(satisfies("smile", face({ mouthWidth: 0.2 }), false, null)).toBe(true);
    expect(satisfies("smile", face({ mouthWidth: 0.08 }), false, null)).toBe(false);
  });

  it("ignores a baseline built from too few frames", () => {
    // One frame caught mid-word must not become the resting measurement.
    expect(baselineFrom([face({}), face({})])).toBeNull();
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

/*
 * Challenge *selection* is no longer tested here.
 *
 * It moved to the backend — `App\Services\Verification\LivenessChallenge` and
 * its Pest test — because that is where it has to live: a sequence chosen by
 * the browser could be satisfied with a recording the attacker already had.
 * The property that matters (the sequence varies between attempts, so a
 * recording cannot be replayed) is asserted there.
 *
 * What this file still covers is the geometry, which genuinely runs in the
 * browser and is the piece a camera and a WebAssembly runtime would otherwise
 * be needed to exercise.
 */
describe("challenge prompts", () => {
  it("has a prompt for every challenge the detector understands", () => {
    for (const challenge of ALL_CHALLENGES) {
      expect(CHALLENGE_PROMPTS[challenge]).toBeTruthy();
      // Every prompt is read aloud to a nervous person in front of a camera.
      expect(CHALLENGE_PROMPTS[challenge].length).toBeGreaterThan(4);
    }
  });

  it("covers exactly the five the backend can issue", () => {
    expect(ALL_CHALLENGES.sort()).toEqual(
      ["blink", "open_mouth", "smile", "turn_left", "turn_right"].sort(),
    );
  });
});
