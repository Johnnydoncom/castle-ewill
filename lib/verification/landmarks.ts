/**
 * Geometry helpers for the browser-side liveness challenge.
 *
 * Kept free of MediaPipe imports so the thresholds can be reasoned about — and
 * unit tested — without a camera or a WebAssembly runtime.
 *
 * Indices refer to MediaPipe Face Landmarker's 468-point mesh.
 */

export type Point = { x: number; y: number; z?: number };

export const LANDMARK = {
  noseTip: 1,
  chin: 152,
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  leftEyeTop: 159,
  leftEyeBottom: 145,
  rightEyeTop: 386,
  rightEyeBottom: 374,
  mouthTop: 13,
  mouthBottom: 14,
  mouthLeft: 61,
  mouthRight: 291,
} as const;

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Head yaw as a ratio in roughly -1 … 1.
 *
 * Compares the nose's horizontal position against the eye corners, so it is
 * invariant to how close the face is to the camera.
 */
export function yawRatio(points: Point[]): number {
  const nose = points[LANDMARK.noseTip];
  const left = points[LANDMARK.leftEyeOuter];
  const right = points[LANDMARK.rightEyeOuter];
  if (!nose || !left || !right) return 0;

  const midpoint = (left.x + right.x) / 2;
  const halfWidth = Math.abs(right.x - left.x) / 2;
  if (halfWidth === 0) return 0;

  return (nose.x - midpoint) / halfWidth;
}

/** Mouth aspect ratio — height over width. Speaking sits well below 0.5. */
export function mouthAspectRatio(points: Point[]): number {
  const top = points[LANDMARK.mouthTop];
  const bottom = points[LANDMARK.mouthBottom];
  const left = points[LANDMARK.mouthLeft];
  const right = points[LANDMARK.mouthRight];
  if (!top || !bottom || !left || !right) return 0;

  const width = distance(left, right);
  if (width === 0) return 0;
  return distance(top, bottom) / width;
}

/** Eye aspect ratio, averaged across both eyes. Drops sharply on a blink. */
export function eyeAspectRatio(points: Point[]): number {
  const pairs: Array<[number, number, number, number]> = [
    [
      LANDMARK.leftEyeTop,
      LANDMARK.leftEyeBottom,
      LANDMARK.leftEyeOuter,
      LANDMARK.noseTip,
    ],
    [
      LANDMARK.rightEyeTop,
      LANDMARK.rightEyeBottom,
      LANDMARK.rightEyeOuter,
      LANDMARK.noseTip,
    ],
  ];

  const ratios = pairs
    .map(([topIdx, bottomIdx, outerIdx]) => {
      const top = points[topIdx];
      const bottom = points[bottomIdx];
      const outer = points[outerIdx];
      const nose = points[LANDMARK.noseTip];
      if (!top || !bottom || !outer || !nose) return null;

      const width = distance(outer, nose);
      if (width === 0) return null;
      return distance(top, bottom) / width;
    })
    .filter((v): v is number => v !== null);

  if (ratios.length === 0) return 0;
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

/** Smile widens the mouth relative to the distance between the eyes. */
export function smileRatio(points: Point[]): number {
  const left = points[LANDMARK.mouthLeft];
  const right = points[LANDMARK.mouthRight];
  const eyeLeft = points[LANDMARK.leftEyeOuter];
  const eyeRight = points[LANDMARK.rightEyeOuter];
  if (!left || !right || !eyeLeft || !eyeRight) return 0;

  const eyeWidth = distance(eyeLeft, eyeRight);
  if (eyeWidth === 0) return 0;
  return distance(left, right) / eyeWidth;
}

/**
 * Thresholds, tuned to be achievable by an ordinary user in one attempt while
 * still requiring a deliberate movement. A neutral face sits well inside all of
 * them.
 */
/**
 * Prompts for the challenge names the API issues.
 *
 * A local copy so the UI can render immediately and stays legible if a prompt
 * is missing from a response. The API sends its own prompt with each challenge
 * and that is the one to prefer — the *sequence* is the server's to choose, and
 * this file must never be the thing that decides what is asked.
 */
export const CHALLENGE_PROMPTS: Record<ChallengeName, string> = {
  turn_left: "Slowly turn your head to the left",
  turn_right: "Slowly turn your head to the right",
  open_mouth: "Open your mouth wide",
  blink: "Blink both eyes",
  smile: "Smile",
};

/**
 * Thresholds.
 *
 * `yaw` and the eye ratios are absolute, because they measure a *shape* that
 * barely varies between faces: an eye is either open or shut, and a head is
 * either turned or it is not.
 *
 * Smiling and opening the mouth are different. Both were absolute too — a
 * smile had to make the mouth 0.95× the distance between the outer eye
 * corners, and an open mouth needed a height:width ratio above 0.5. Neither is
 * reachable by an ordinary face: mouth width sits around 0.55–0.65 of eye
 * width even on a broad smile, so "Smile" could not be passed by anyone, and
 * "Open your mouth wide" demanded a full yawn.
 *
 * They are now measured against the person's **own neutral face**, captured
 * while the prompt is being read. Faces differ far too much for one number to
 * fit them all; what does not differ is that a smile is wider than your own
 * resting mouth.
 */
export const THRESHOLD = {
  yaw: 0.35,
  eyeOpen: 0.19,
  eyeClosed: 0.11,

  /** A smile must widen the mouth by this fraction of its resting width. */
  smileGain: 0.08,
  /** An open mouth must add this much to the resting height:width ratio. */
  mouthOpenGain: 0.12,

  /*
   * Floors, for the case where no baseline was captured — a face that arrived
   * mid-expression, or a camera that started late. Deliberately generous: a
   * challenge that cannot be passed is worse than one that is easy, because
   * the client is stuck rather than merely unchallenged, and this check is a
   * first filter rather than the anti-spoofing control.
   */
  smileFloor: 0.62,
  mouthOpenFloor: 0.28,
} as const;

/**
 * A person's resting face, used to judge their own expressions against.
 *
 * Captured over several frames rather than one, so a blink or a twitch at the
 * wrong instant cannot set a baseline nobody can then beat.
 */
export type FaceBaseline = {
  smile: number;
  mouthOpen: number;
};

export function baselineFrom(samples: Point[][]): FaceBaseline | null {
  const smiles: number[] = [];
  const mouths: number[] = [];

  for (const points of samples) {
    const smile = smileRatio(points);
    const mouth = mouthAspectRatio(points);

    if (smile > 0) smiles.push(smile);
    if (mouth > 0) mouths.push(mouth);
  }

  if (smiles.length < 3 || mouths.length < 3) return null;

  // Median, not mean: one frame caught mid-word should not drag the resting
  // measurement with it.
  const median = (xs: number[]) => {
    const sorted = [...xs].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  return { smile: median(smiles), mouthOpen: median(mouths) };
}

export type ChallengeName =
  | "turn_left"
  | "turn_right"
  | "open_mouth"
  | "blink"
  | "smile";

/**
 * Whether the current frame satisfies a challenge.
 *
 * `blink` needs history rather than a single frame — the eye must have been
 * open, closed, then open again — so it is tracked by the caller and reported
 * here through `blinkObserved`.
 */
export function satisfies(
  challenge: ChallengeName,
  points: Point[],
  blinkObserved = false,
  baseline: FaceBaseline | null = null,
): boolean {
  switch (challenge) {
    case "turn_left":
      // Mirrored preview: the user's left is negative yaw on screen.
      return yawRatio(points) < -THRESHOLD.yaw;
    case "turn_right":
      return yawRatio(points) > THRESHOLD.yaw;
    case "open_mouth":
      return baseline
        ? mouthAspectRatio(points) >= baseline.mouthOpen + THRESHOLD.mouthOpenGain
        : mouthAspectRatio(points) >= THRESHOLD.mouthOpenFloor;
    case "smile":
      return baseline
        ? smileRatio(points) >= baseline.smile * (1 + THRESHOLD.smileGain)
        : smileRatio(points) >= THRESHOLD.smileFloor;
    case "blink":
      return blinkObserved;
    default:
      return false;
  }
}
