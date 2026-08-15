"use server";

import { api, apiData } from "@/lib/api/client";
import type { PaymentRecord } from "./payments";
import type { Plan } from "@/lib/pricing/types";
import type { ApiWill, WillStatus } from "./will";

/**
 * Admin read models, delegated to the API.
 *
 * Every endpoint behind these lives under `/admin/*`, which answers **404**
 * rather than 403 to a non-administrator. That has a consequence worth naming:
 * a failure here is indistinguishable from an empty result, by design. These
 * functions therefore degrade to empty rather than throwing — a console page
 * that renders "no clients" for someone who should not be looking at it is the
 * intended outcome, not a bug to work around.
 *
 * Aggregates are computed in SQL on the backend, so the console stays
 * responsive as the tables grow.
 */

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const emptyPage = <T>(): Paginated<T> => ({
  data: [],
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0,
});

/* -------------------------------------------------------------------------- */
/*  Overview                                                                   */
/* -------------------------------------------------------------------------- */

export type AuditEntry = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  actor: { id: string; name: string | null; email: string } | null;
  created_at: string | null;
};

export type AdminStats = {
  total_clients: number;
  new_clients_this_month: number;
  total_wills: number;
  wills_awaiting_review: number;
  wills_executed: number;
  wills_by_status: Record<string, number>;
  revenue_kobo: number;
  revenue_formatted: string;
  open_messages: number;
  will_trend: Array<{ month: string; total: number }>;
  recent_audit: AuditEntry[];
};

const emptyStats: AdminStats = {
  total_clients: 0,
  new_clients_this_month: 0,
  total_wills: 0,
  wills_awaiting_review: 0,
  wills_executed: 0,
  wills_by_status: {},
  revenue_kobo: 0,
  revenue_formatted: "₦0.00",
  open_messages: 0,
  will_trend: [],
  recent_audit: [],
};

export async function getAdminStats(): Promise<AdminStats> {
  return apiData<AdminStats>("/admin/overview", emptyStats);
}

/** Recent audit entries. Carried on the overview, so no second round trip. */
export async function listRecentAudit(limit = 20): Promise<AuditEntry[]> {
  const stats = await getAdminStats();

  return stats.recent_audit.slice(0, limit);
}

export async function getWillTrend(): Promise<
  Array<{ month: string; total: number }>
> {
  return (await getAdminStats()).will_trend;
}

/* -------------------------------------------------------------------------- */
/*  Health                                                                     */
/* -------------------------------------------------------------------------- */

export type HealthCheck = { name: string; ok: boolean; detail: string };

export type AdminHealth = {
  checks: HealthCheck[];
  bank_account: {
    bank_name: string;
    account_name: string;
    account_number: string;
    instructions: string | null;
    configured: boolean;
  };
};

/**
 * Live dependency checks, performed by the backend.
 *
 * They have to run there: the frontend no longer holds a database connection,
 * an SMTP account, a vault key or a payment secret, and a check it could
 * perform from here would be checking nothing.
 *
 * The fallback is deliberately a *failure*, not an empty list — a settings page
 * that renders blank when it cannot reach the backend would read as "nothing to
 * report".
 */
export async function getAdminHealth(): Promise<AdminHealth> {
  return apiData<AdminHealth>("/admin/health", {
    checks: [
      {
        name: "Backend API",
        ok: false,
        detail: "Could not reach the API. No dependency could be checked.",
      },
    ],
    bank_account: {
      bank_name: "Unknown",
      account_name: "Unknown",
      account_number: "—",
      instructions: null,
      configured: false,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every plan, published or not.
 *
 * The console needs the withdrawn ones too — that is the whole difference
 * from the public `/plans` read, which only ever returns what is on sale.
 */
export async function listAllPlans(): Promise<Plan[]> {
  return apiData<Plan[]>("/admin/plans", []);
}

export type VerificationProviderName = "smile_id" | "manual_review";

export type VerificationRequirements = { email: boolean; phone: boolean };

export type VerificationSettings = {
  provider: VerificationProviderName;
  requirements: VerificationRequirements;
};

/**
 * Both verification settings, in one read.
 *
 * They are edited on the same screen and stored by the same controller, so
 * fetching them together keeps the Settings page to one round trip rather
 * than two that could disagree.
 *
 * The fallback mirrors the backend's own defaults — manual review, email
 * required, phone not — so an unreachable API renders the safe position
 * rather than implying verification has been switched off.
 */
export async function getVerificationSettings(): Promise<VerificationSettings> {
  return apiData<VerificationSettings>("/admin/settings/verification-provider", {
    provider: "manual_review",
    requirements: { email: true, phone: false },
  });
}

/* -------------------------------------------------------------------------- */
/*  Wills                                                                      */
/* -------------------------------------------------------------------------- */

export type AdminWillRow = {
  will: ApiWill;
  client: { id: string; name: string | null; email: string };
};

/**
 * The review queue: submitted and in-review Wills, oldest first.
 *
 * FIFO because somebody is waiting. Sorting the newest to the top would let an
 * old submission sink out of sight.
 */
export async function getReviewQueue(limit = 10): Promise<AdminWillRow[]> {
  const page = await apiData<Paginated<AdminWillRow>>(
    "/admin/wills",
    emptyPage<AdminWillRow>(),
    { query: { per_page: limit } },
  );

  return page.data;
}

export async function listWills(options: {
  /** Omit for the outstanding queue; `"all"` for the full archive. */
  status?: WillStatus | "all";
  page?: number;
  perPage?: number;
}): Promise<Paginated<AdminWillRow>> {
  return apiData<Paginated<AdminWillRow>>(
    "/admin/wills",
    emptyPage<AdminWillRow>(),
    {
      query: {
        status: options.status,
        page: options.page,
        per_page: options.perPage,
      },
    },
  );
}

export type AdminWillDetail = {
  will: ApiWill;
  client: { id: string; name: string | null; email: string; status: string };
  revisions: Array<{
    version: number;
    summary: string | null;
    created_at: string | null;
  }>;
};

export async function getWillForReview(
  willId: string,
): Promise<AdminWillDetail | null> {
  return apiData<AdminWillDetail | null>(`/admin/wills/${willId}`, null);
}

/* -------------------------------------------------------------------------- */
/*  Clients                                                                    */
/* -------------------------------------------------------------------------- */

export type ClientRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "user" | "lawyer" | "admin";
  status: "active" | "suspended" | "deleted";
  is_email_verified: boolean;
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  wills_count: number;
  created_at: string | null;
  last_login_at?: string | null;
  /*
   * Two separate facts. `is_lawyer` is what the account asked to be;
   * `is_verified_lawyer` is whether this console has confirmed the enrolment
   * number. The professional rate hangs off the second one only.
   */
  is_lawyer?: boolean;
  is_verified_lawyer?: boolean;
  enrolment_number?: string | null;
  lawyer_rejected_reason?: string | null;
};

export async function listClients(options: {
  search?: string;
  page?: number;
  perPage?: number;
  /** `lawyers_pending` narrows to applicants nobody has checked yet. */
  filter?: "lawyers_pending";
}): Promise<Paginated<ClientRow>> {
  return apiData<Paginated<ClientRow>>("/admin/clients", emptyPage<ClientRow>(), {
    query: {
      search: options.search,
      page: options.page,
      per_page: options.perPage,
      filter: options.filter,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Payments                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminPaymentRow = PaymentRecord & {
  client?: { id: string; name: string | null; email: string };
  metadata?: Record<string, unknown> | null;
};

/**
 * Every payment on the platform.
 *
 * `success_kobo` is the settled total across the filter, not the sum of the
 * current page — it is the figure an operator reconciles against the bank, and
 * a page-local subtotal would be meaningless there.
 */
export async function listPayments(options: {
  status?: string;
  provider?: string;
  page?: number;
  perPage?: number;
}): Promise<Paginated<AdminPaymentRow> & { success_kobo: number }> {
  const result = await api<{ data: Paginated<AdminPaymentRow>; success_kobo?: number }>(
    "/admin/payments",
    {
      query: {
        status: options.status,
        provider: options.provider,
        page: options.page,
        per_page: options.perPage,
      },
    },
  );

  if (!result.ok) {
    return { ...emptyPage<AdminPaymentRow>(), success_kobo: 0 };
  }

  return {
    ...result.data.data,
    success_kobo: result.data.success_kobo ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Verification queue                                                         */
/* -------------------------------------------------------------------------- */

export type AdminVerificationRow = {
  verification: {
    id: string;
    status: "pending" | "passed" | "failed" | "expired";
    provider: string;
    /** `kyc` gates starting a Will; `will_submission` is the lighter per-submission recheck. */
    purpose: "kyc" | "will_submission";
    challenges: string[] | null;
    completed_challenges: string[] | null;
    failure_reason: string | null;
    match_score: number | null;
    liveness_score: number | null;
    /** The captured frame lives in the vault; this is its document id. */
    capture_document_id: string | null;
    /**
     * What this attempt was actually compared against, snapshotted at
     * submit time — the client's identity document, or their enrolled
     * selfie if they had no usable ID on file yet.
     */
    reference_document_id: string | null;
    reference_kind: "id_document" | "enrolled_selfie" | null;
    /** Which kind of ID the client said the reference is — null for an enrolled-selfie reference. */
    reference_document_type: string | null;
    created_at: string | null;
  };
  client: { id: string; name: string | null; email: string };
};

export async function listVerifications(options: {
  status?: string;
  purpose?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<Paginated<AdminVerificationRow>> {
  return apiData<Paginated<AdminVerificationRow>>(
    "/admin/verifications",
    emptyPage<AdminVerificationRow>(),
    {
      query: {
        status: options.status,
        purpose: options.purpose,
        page: options.page,
        per_page: options.perPage,
      },
    },
  );
}

/* -------------------------------------------------------------------------- */
/*  Contact messages                                                           */
/* -------------------------------------------------------------------------- */

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "closed";
  created_at: string;
};

export async function listContactMessages(options: {
  status?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<Paginated<ContactMessageRow>> {
  return apiData<Paginated<ContactMessageRow>>(
    "/admin/contact-messages",
    emptyPage<ContactMessageRow>(),
    {
      query: {
        status: options.status,
        page: options.page,
        per_page: options.perPage,
      },
    },
  );
}

/* -------------------------------------------------------------------------- */
/*  Admin accounts — superadmin only                                          */
/* -------------------------------------------------------------------------- */

export type AdminAccountRow = {
  admin: {
    id: string;
    name: string | null;
    email: string;
    status: "active" | "suspended" | "deleted";
    created_at: string | null;
  };
  is_superadmin: boolean;
  permissions: string[];
};

/**
 * Every admin account. Not paginated — the client-facing `/admin/clients`
 * list can grow without bound, but the number of staff with console access
 * is small by nature, so a flat array matches what `AdminAccountController::index()`
 * actually returns.
 */
export async function listAdmins(): Promise<AdminAccountRow[]> {
  return apiData<AdminAccountRow[]>("/admin/admins", []);
}

/* -------------------------------------------------------------------------- */
/*  Operator-editable configuration                                            */
/* -------------------------------------------------------------------------- */

export type SettingField = {
  key: string;
  label: string;
  secret: boolean;
  hint: string | null;
  is_set: boolean;
  /** Where the value in force came from — the question an operator has. */
  source: "console" | "environment" | "unset";
  /** Present for non-secret fields only. A secret never leaves the server. */
  value: string | null;
};

export type SettingGroup = {
  key: string;
  label: string;
  description: string;
  fields: SettingField[];
  option?: {
    key: string;
    label: string;
    choices: Record<string, string>;
    selected: string;
  };
};

export async function getSettingGroups(): Promise<SettingGroup[]> {
  const data = await apiData<{ groups: SettingGroup[] }>("/admin/settings", {
    groups: [],
  });

  return data.groups;
}
