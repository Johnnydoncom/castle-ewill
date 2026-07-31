/** Provider-agnostic contract for face verification. */

export type LivenessChallenge =
  | "turn_left"
  | "turn_right"
  | "open_mouth"
  | "blink"
  | "smile";

export const ALL_CHALLENGES: readonly LivenessChallenge[] = [
  "turn_left",
  "turn_right",
  "open_mouth",
  "blink",
  "smile",
] as const;

export const CHALLENGE_PROMPTS: Record<LivenessChallenge, string> = {
  turn_left: "Slowly turn your head to the left",
  turn_right: "Slowly turn your head to the right",
  open_mouth: "Open your mouth wide",
  blink: "Blink both eyes",
  smile: "Smile",
};

export type VerificationProviderName = "manual_review" | "dojah" | "smile_id";

export type VerificationInput = {
  userId: string;
  /** JPEG/PNG frame captured at the end of the challenge sequence. */
  capture: Buffer;
  captureMimeType: string;
  /** The identity document to match against, if one has been uploaded. */
  idDocument?: { buffer: Buffer; mimeType: string } | null;
  challenges: LivenessChallenge[];
  completedChallenges: LivenessChallenge[];
};

export type VerificationOutcome = {
  /**
   * `pending` means a human must decide. Providers that answer synchronously
   * return `passed` or `failed` directly.
   */
  status: "passed" | "failed" | "pending";
  matchScore?: number | null;
  livenessScore?: number | null;
  providerReference?: string | null;
  failureReason?: string | null;
};

export interface VerificationProvider {
  readonly name: VerificationProviderName;
  /** Whether this provider decides on its own, without human review. */
  readonly automated: boolean;
  verify(input: VerificationInput): Promise<VerificationOutcome>;
}
