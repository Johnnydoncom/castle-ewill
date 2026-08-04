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

export const THRESHOLD = {
  yaw: 0.35,
  mouthOpen: 0.5,
  eyeOpen: 0.19,
  eyeClosed: 0.11,
  smile: 0.95,
} as const;

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
): boolean {
  switch (challenge) {
    case "turn_left":
      // Mirrored preview: the user's left is negative yaw on screen.
      return yawRatio(points) < -THRESHOLD.yaw;
    case "turn_right":
      return yawRatio(points) > THRESHOLD.yaw;
    case "open_mouth":
      return mouthAspectRatio(points) > THRESHOLD.mouthOpen;
    case "smile":
      return smileRatio(points) > THRESHOLD.smile;
    case "blink":
      return blinkObserved;
    default:
      return false;
  }
}
