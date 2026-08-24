import { api, apiData } from "@/lib/api/client";

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
  /**
   * Uploaded is not approved, and printing waits on approved.
   *
   * A screen that showed only "uploaded" would leave somebody staring at two
   * documents they had provided, wondering why they still cannot print.
   */
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  /**
   * As submitted, so the form can show it back.
   *
   * The parts as well as the whole: splitting the whole name apart in the
   * browser would re-introduce the guess this product spent a release
   * removing, and would lose a middle name on every reload.
   */
  full_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  id_type: string | null;
  /** Masked — the last four characters only. Never a value to submit. */
  id_number: string | null;
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

/** A witness as the Will already names them, for pre-filling the check. */
export type SuggestedWitness = {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  full_name: string | null;
};

/**
 * The witnesses the client already named in their Will.
 *
 * Asking for a name that has already been given is asking somebody to type it
 * a second time — and to type it slightly differently, which is exactly how a
 * verification that should have matched comes back "No Match".
 */
export async function suggestedWitnesses(): Promise<SuggestedWitness[]> {
  const result = await api<{ meta?: { suggested?: SuggestedWitness[] } }>(
    "/witness-identities",
  );

  // The suggestion is a convenience; a read that fails should cost an empty
  // form, not an error screen in front of a check somebody can still complete.
  return result.ok ? (result.data.meta?.suggested ?? []) : [];
}
