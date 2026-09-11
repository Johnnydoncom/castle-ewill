import { api, apiData } from "@/lib/api/client";

/**
 * The Will wizard's server-side reads.
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
  /**
   * The three parts, and the whole composed from them.
   *
   * The parts are what a form repopulates and what a verification is built
   * from; the whole is what a summary line prints. They are reconciled on save
   * server-side, so they cannot disagree.
   */
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  /** Free text naming a guardian's ward, from before guardians were tied to a beneficiary. */
  children_covered?: string | null;
  /** A guardian's ward: the beneficiary they are appointed for. */
  beneficiary_id?: string | null;
  notes?: string | null;
  item_description?: string;
  recipient_name?: string;
  recipient_relationship?: string | null;
  is_alternate?: boolean;
  is_contingent?: boolean;
  /** Under eighteen, with a guardian appointed for them. */
  is_minor?: boolean;
  /**
   * Their share of the residuary estate. Null until the client has set it —
   * shares are asked a step after the people, so a beneficiary added on the
   * way back through has none yet, which is not the same as 0%.
   */
  share_percent?: number | null;
};

export type WillProgress = {
  /** Each step, complete when every section on it is. */
  steps: Array<{
    step: number;
    slug: string;
    complete: boolean;
    sections: Array<{ slug: string; complete: boolean }>;
  }>;
  percent: number;
  next_incomplete_step: number;
  can_submit: boolean;
  outstanding_steps: number[];
  outstanding_sections: string[];
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

/**
 * Why printing is refused, in the order the client must satisfy them.
 *
 * No `liveness_required`. Printing is collecting a document already paid for
 * by somebody already proved, and asks for no camera — see `UpdateBlocker`
 * for the one place in the journey that does.
 */
export type PrintBlocker =
  | "incomplete"
  | "unpaid"
  | "kyc_required"
  | "passport_photograph_required"
  | "witnesses_required";

/**
 * Why an *amendment* may not be committed.
 *
 * Only ever set for a Will that has been produced once. A first draft, a first
 * submission and every print return null.
 */
export type UpdateBlocker = "subscription_required" | "liveness_required";

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
  /** What the final step of an amendment still owes; null otherwise. */
  update_blocked_by: UpdateBlocker | null;
  can_update: boolean;
  /**
   * Whether the witnesses' identity is checked before printing — a console
   * switch, off by default. The Will's page shows its witness panel only when
   * this is true.
   */
  witness_verification_required?: boolean;
  /** Which Smile ID integration the amendment's camera check loads. */
  smile_id_version?: "v3" | "legacy";
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
  /** Journey milestones — timestamps, not statuses; the stages are computed from these. */
  printed_at: string | null;
  executed_at: string | null;
  lodged_at: string | null;
  lodging_reference: string | null;
  /**
   * This Will's storage-and-amendments subscription.
   *
   * Per Will, not per account: a lawyer subscribes for each client's document
   * separately, so an account-level answer would tell one client's Will it was
   * covered by another's.
   */
  subscription_expires_at: string | null;
  has_active_subscription: boolean;
  personal: Record<string, string | null>;
  declaration: Record<string, boolean>;
  has_minor_children: boolean | null;
  funeral_preference: string | null;
  funeral_instructions: string | null;
  residuary_estate: string | null;
  bequests_declared_none: boolean;

  /**
   * The trust arrangement.
   *
   * `estate_in_trust` is the answer to "who gets what" when the testator does
   * not want to name gifts item by item: the trustees hold everything and
   * manage it for the beneficiaries on the shares already recorded.
   */
  estate_in_trust: boolean;
  executors_are_trustees: boolean | null;
  trust_bank_account: boolean;
  distribution_frequency: string | null;
  assets_declared_none: boolean;
  trustees: WillPerson[];
  special_instructions: string | null;
  confirmed_accurate: boolean;
  executors: WillPerson[];
  beneficiaries: WillPerson[];
  guardians: WillPerson[];
  bequests: WillPerson[];
  /** The register, listed before anything is given away. */
  assets: Array<{
    id: string;
    sort_order: number;
    type?: string;
    description?: string;
    institution?: string | null;
    identifier?: string | null;
  }>;
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

/**
 * One Will, or why it could not be read.
 *
 * `apiData` collapses every failure into its fallback, which meant a Will that
 * exists but whose read was refused looked exactly like a Will that does not
 * exist — and the page turned both into "Page not found". A client was told
 * their own Will was missing while it sat in the database.
 *
 * The distinction matters because the remedies are opposite: "not found" is
 * final, while a failed read is worth retrying and worth reporting.
 */
export type WillRead =
  | { status: "found"; will: ApiWill }
  | { status: "not_found" }
  | { status: "unavailable"; message: string };

export async function readWill(willId: string): Promise<WillRead> {
  const result = await api<{ data: ApiWill }>(`/wills/${willId}`);

  if (result.ok) {
    return result.data?.data
      ? { status: "found", will: result.data.data }
      : { status: "unavailable", message: "The Will came back empty." };
  }

  // Only a 404 means the Will is genuinely not there for this client — the
  // API scopes reads to the caller, so somebody else's Will is a 404 too.
  if (result.status === 404) return { status: "not_found" };

  console.error(`[will] could not read ${willId} — ${result.status} ${result.message}`);

  return { status: "unavailable", message: result.message };
}

export async function getWill(willId: string): Promise<ApiWill | null> {
  const read = await readWill(willId);

  return read.status === "found" ? read.will : null;
}

export async function listWills(): Promise<ApiWill[]> {
  return apiData<ApiWill[]>("/wills", []);
}
