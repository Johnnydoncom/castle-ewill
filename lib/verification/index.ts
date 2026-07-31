import "server-only";

import { getEnv } from "@/lib/env";
import { ManualReviewProvider } from "./adapters/manual";
import { DojahProvider } from "./adapters/dojah";
import {
  ALL_CHALLENGES,
  type LivenessChallenge,
  type VerificationProvider,
} from "./types";

export * from "./types";

let provider: VerificationProvider | undefined;

export function getVerificationProvider(): VerificationProvider {
  if (provider) return provider;
  provider =
    getEnv().VERIFICATION_PROVIDER === "dojah"
      ? new DojahProvider()
      : new ManualReviewProvider();
  return provider;
}

/** Test seam. */
export function setVerificationProvider(
  next: VerificationProvider | undefined,
): void {
  provider = next;
}

/**
 * Picks a random challenge sequence.
 *
 * Randomising both the choice and the order is the point: a fixed sequence
 * could be satisfied with a pre-recorded video. Three challenges balances
 * assurance against how long a nervous user is asked to hold still.
 */
export function pickChallenges(count = 3): LivenessChallenge[] {
  const pool = [...ALL_CHALLENGES];

  // Fisher–Yates, so every ordering is equally likely.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}
