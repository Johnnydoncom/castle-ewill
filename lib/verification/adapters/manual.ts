import "server-only";

import type {
  VerificationInput,
  VerificationOutcome,
  VerificationProvider,
} from "../types";

/**
 * Default provider: the capture is stored and an administrator compares it
 * against the uploaded identity document.
 *
 * This is honest about what it is. The browser-side liveness challenge raises
 * the effort required to present a static photograph, but it is not
 * anti-spoofing — a determined attacker can bypass client JavaScript entirely.
 * A human looking at the frame alongside the ID is the actual control here,
 * until an automated provider is configured.
 */
export class ManualReviewProvider implements VerificationProvider {
  readonly name = "manual_review" as const;
  readonly automated = false;

  async verify(input: VerificationInput): Promise<VerificationOutcome> {
    const missed = input.challenges.filter(
      (c) => !input.completedChallenges.includes(c),
    );

    // The client reports which challenges it observed. That report is not
    // trustworthy on its own, but an incomplete one is still a clear signal.
    if (missed.length > 0) {
      return {
        status: "failed",
        failureReason: `Liveness challenge incomplete: ${missed.join(", ")}`,
      };
    }

    return {
      status: "pending",
      failureReason: null,
    };
  }
}
