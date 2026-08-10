import { api, apiData } from "@/lib/api/client";

/**
 * The nine-step wizard's server-side reads.
 *
 * Ownership, per-step validation, the beneficiary-share arithmetic, the
 * witness/beneficiary conflict rule and the submission gate all live in the
 * backend. This half is what a Server Component page needs before the browser
 * can run any client JS at all — the step-save mutations the wizard's forms
 * post live in `will.client.ts` instead, calling Laravel directly from the
 * browser rather than through this server-only module (which stays
 * `server-only` via `lib/api/client.ts` and so cannot be imported from a
 * Client Component).
 */

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type WillPerson = {
  id: string;
  sort_order: number;
  full_name?: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  children_covered?: string | null;
  notes?: string | null;
  item_description?: string;
  recipient_name?: string;
  recipient_relationship?: string | null;
  is_alternate?: boolean;
  is_contingent?: boolean;
  share_percent?: number;
};

export type WillProgress = {
  steps: Array<{ step: number; applicable: boolean; complete: boolean }>;
  percent: number;
  next_incomplete_step: number;
  can_submit: boolean;
  outstanding_steps: number[];
};

export type WillStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "executed"
  | "archived";

/**
 * The seven client-facing stages, in order. Mirrors `WillJourney::STAGES`.
 *
 * Distinct from `WillStatus`, and deliberately so: status is the review state
 * machine an administrator drives, while this is what the client is shown and
 * what they are allowed to do next.
 */
export const JOURNEY_STAGES = [
  "prepare",
  "legal_review",
  "print",
  "execute",
  "lodge",
  "protect",
  "update",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/** Why printing is refused, in the order the client must satisfy them. */
export type PrintBlocker =
  | "incomplete"
  | "unpaid"
  | "kyc_required"
  | "liveness_required";

export type WillJourney = {
  stage: JourneyStage;
  stages: JourneyStage[];
  is_paid: boolean;
  identity: {
    confirmed: boolean;
    /** `kyc` for a first-timer, `liveness` for someone already proofed. */
    requires: "kyc" | "liveness" | null;
    kyc_verified: boolean;
  };
  is_subscribed: boolean;
  review_choice: "undecided" | "requested" | "skipped" | null;
  can_request_review: boolean;
  can_skip_review: boolean;
  can_print: boolean;
  print_blocked_by: PrintBlocker | null;
  can_update: boolean;
  printed_at: string | null;
  executed_at: string | null;
  lodged_at: string | null;
};

export type ApiWill = {
  id: string;
  reference: string;
  title: string;
  status: WillStatus;
  version: number;
  current_step: number;
  completion_percent: number;
  is_editable: boolean;
  personal: Record<string, string | null>;
  declaration: Record<string, boolean>;
  has_minor_children: boolean | null;
  funeral_preference: string | null;
  funeral_instructions: string | null;
  residuary_estate: string | null;
  special_instructions: string | null;
  confirmed_accurate: boolean;
  executors: WillPerson[];
  beneficiaries: WillPerson[];
  guardians: WillPerson[];
  bequests: WillPerson[];
  assets: Array<Record<string, unknown>>;
  witnesses: WillPerson[];
  progress?: WillProgress;
  /**
   * Where this Will has got to and what may happen next.
   *
   * Present only for the account holder — it is derived from *their* payments,
   * identity checks and subscription, so it is absent when an administrator is
   * looking at somebody else's record.
   *
   * Never recomputed here. `can_print` in particular is the server's gate on
   * releasing an executable legal instrument; a page that worked it out for
   * itself could offer a button the server will refuse, which is worse than
   * offering no button at all.
   */
  journey?: WillJourney;
  /**
   * Summaries only. The API never ships the snapshots — they are a complete
   * copy of the Will at each version, and belong to the registry's evidence
   * trail rather than to a page.
   */
  revisions?: Array<{
    version: number;
    summary: string | null;
    created_at: string | null;
  }>;
  submitted_at: string | null;
  approved_at: string | null;
  updated_at: string | null;
};

/* -------------------------------------------------------------------------- */
/*  Reads                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The active draft, created on first visit.
 *
 * POST, not GET — it creates a record when none exists. Nothing here decides
 * whether a draft may be created; it only asks.
 */
export async function getOrCreateDraft(): Promise<ApiWill | null> {
  const result = await api<{ data: ApiWill }>("/wills/draft", { method: "POST" });

  if (!result.ok) {
    console.error(`[will] could not open a draft: ${result.message}`);
    return null;
  }

  return result.data.data;
}

export async function getWill(willId: string): Promise<ApiWill | null> {
  return apiData<ApiWill | null>(`/wills/${willId}`, null);
}

export async function listWills(): Promise<ApiWill[]> {
  return apiData<ApiWill[]>("/wills", []);
}
