import { apiData } from "@/lib/api/client";

/**
 * Identity verification's server-side reads.
 *
 * Capture belongs to the Smile ID Web SDK and the verdict belongs to Smile ID;
 * this tier renders where a client stands, and never decides it. The gate on
 * printing a Will is enforced in the backend regardless of what is shown here.
 */

export type VerificationRecord = {
  id: string;
  status: "pending" | "passed" | "failed" | "expired";
  provider: string;
  /** `kyc` gates starting a Will; `will_submission` is the lighter per-submission recheck. */
  purpose: "kyc" | "will_submission";
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

/** One witness's identification, as the client's own screen sees it. */
export type WitnessIdentityRecord = {
  id: string;
  file_name: string;
  size_bytes: number;
  created_at: string | null;
};

/**
 * The caller's uploaded witness identification.
 *
 * Separate from the document vault: these belong to third parties, are read
 * once by a reviewer, and are deleted when the client's verification completes.
 */
export async function listWitnessIdentities(): Promise<WitnessIdentityRecord[]> {
  return apiData<WitnessIdentityRecord[]>("/witness-identities", []);
}
