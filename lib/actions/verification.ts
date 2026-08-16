import { apiData } from "@/lib/api/client";

/**
 * Face verification's server-side reads.
 *
 * The important property is unchanged by the move and worth restating: the
 * challenge sequence is issued and stored **server-side**. If the browser chose
 * its own challenges, an attacker would simply pick the one they had already
 * recorded. `verification.client.ts` never generates a challenge — it asks for
 * one, directly from the browser now rather than through this server-only
 * module.
 *
 * Client-side liveness detection (MediaPipe, in `lib/verification/landmarks.ts`)
 * remains a user-experience layer and a first filter. It is not anti-spoofing,
 * and the gate on Will submission is enforced in the backend regardless of what
 * this tier reports.
 */

export type VerificationRecord = {
  id: string;
  status: "pending" | "passed" | "failed" | "expired";
  provider: string;
  /** `kyc` gates starting a Will; `will_submission` is the lighter per-submission recheck. */
  purpose: "kyc" | "will_submission";
  challenges: string[] | null;
  completed_challenges: string[] | null;
  failure_reason: string | null;
  /**
   * Whether the client actually sent a capture.
   *
   * `status` cannot answer it: an attempt is `pending` from the moment it is
   * issued, so one that was abandoned looks exactly like one awaiting a
   * decision.
   */
  is_submitted: boolean;
  expires_at: string | null;
  created_at: string | null;
};

export type VerificationStatus = {
  is_verified: boolean;
  verified_until: string | null;
  provider: string;
  is_automated: boolean;
  latest: VerificationRecord | null;
};

export async function getVerificationStatus(): Promise<VerificationStatus> {
  return apiData<VerificationStatus>("/verification", {
    is_verified: false,
    verified_until: null,
    provider: "manual_review",
    is_automated: false,
    latest: null,
  });
}
