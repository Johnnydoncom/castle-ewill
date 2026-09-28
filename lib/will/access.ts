/**
 * Castle staff's access to a client's Will — the shapes and the wording.
 *
 * Pure and client-safe, so the client's panel and the console share one
 * vocabulary. The rules are the backend's (`App\Services\Will\WillAccess`):
 * staff see a Will's metadata only, unless its owner grants more with a
 * support code or by asking for a review.
 */

export type WillAccessPurpose = "support" | "legal_review";

export type WillAccessScope = "view" | "view_download";

export type WillAccessGrant = {
  id: string;
  purpose: WillAccessPurpose;
  scope: WillAccessScope;
  /** Served, not derived here — one word for where it stands. */
  state: "awaiting_code" | "active" | "expired" | "ended" | "code_expired";
  created_at: string | null;
  claim_expires_at: string | null;
  claimed_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
};

export type WillAccessEvent = {
  id: string;
  action: string;
  at: string | null;
  /** Staff are named by role, never by person. */
  by: "you" | "staff" | "system";
  purpose: WillAccessPurpose | null;
};

export type WillAccessOverview = {
  grants: WillAccessGrant[];
  history: WillAccessEvent[];
};

/** The console's own access to the Will it is showing. */
export type AdminWillAccess = {
  granted: boolean;
  purpose: WillAccessPurpose | null;
  can_download: boolean;
  expires_at: string | null;
  review_access_ended: boolean;
};

export const ACCESS_DURATIONS = [
  { hours: 24, label: "One day" },
  { hours: 72, label: "Three days" },
  { hours: 168, label: "One week" },
] as const;

export const ACCESS_SCOPES: ReadonlyArray<{ value: WillAccessScope; label: string; hint: string }> = [
  {
    value: "view",
    label: "Read only",
    hint: "They can read your Will on screen, but not download it.",
  },
  {
    value: "view_download",
    label: "Read and download",
    hint: "They can also download a copy. You are emailed each time they do.",
  },
];

export function staffLabel(purpose: WillAccessPurpose | null): string {
  return purpose === "legal_review" ? "A Castle reviewer" : "Castle support";
}

/** One sentence per trail entry, in the client's terms. */
export function describeAccessEvent(event: WillAccessEvent): string {
  const staff = staffLabel(event.purpose);

  switch (event.action) {
    case "will.access_granted":
      return "You issued a support access code.";
    case "will.access_claimed":
      return `${staff} used your access code.`;
    case "will.access_claim_failed":
      return "Someone at Castle entered a wrong access code.";
    case "will.access_revoked":
      return event.by === "you" ? "You withdrew access." : "Access was withdrawn.";
    case "will.review_access_opened":
      return "You allowed a Castle reviewer to read your Will.";
    case "will.review_access_closed":
      return "The reviewer's access ended.";
    case "will.viewed_by_admin":
      return `${event.purpose ? staff : "Castle staff"} read your Will.`;
    case "will.pdf_read_by_admin":
      return `${event.purpose ? staff : "Castle staff"} downloaded a copy of your Will.`;
    default:
      return "Access was recorded.";
  }
}

export const GRANT_STATE_LABELS: Record<WillAccessGrant["state"], string> = {
  awaiting_code: "Waiting for the code",
  active: "Active",
  expired: "Expired",
  ended: "Withdrawn",
  code_expired: "Code not used",
};
