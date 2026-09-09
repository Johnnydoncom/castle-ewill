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
  will_trend: TrendPoint[];
  /** Settled money per month, in kobo. Empty months are present and zero. */
  revenue_trend: TrendPoint[];
  client_trend: TrendPoint[];
  /**
   * Where Wills stop. Each step is a subset of the one before, so the drop
   * between two numbers is a real attrition rate.
   */
  funnel: {
    drafted: number;
    confirmed: number;
    paid: number;
    printed: number;
  };
  /** Everything waiting on a person, gathered from four different screens. */
  attention: {
    wills_awaiting_review: number;
    verifications_pending: number;
    transfers_pending: number;
    open_messages: number;
    draft_articles: number;
  };
  recent_audit: AuditEntry[];
};

export type TrendPoint = { month: string; total: number };

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
  revenue_trend: [],
  client_trend: [],
  funnel: { drafted: 0, confirmed: 0, paid: 0, printed: 0 },
  attention: {
    wills_awaiting_review: 0,
    verifications_pending: 0,
    transfers_pending: 0,
    open_messages: 0,
    draft_articles: 0,
  },
  recent_audit: [],
};

/**
 * The overview, filled in against what this build expects.
 *
 * **The two apps deploy independently**, so the frontend regularly runs for a
 * few minutes against a backend that predates it. `apiData` only substitutes
 * its fallback when the *request* fails; a successful response in an older
 * shape is passed through whole — and a page that reads
 * `stats.attention.wills_awaiting_review` off it throws, taking the entire
 * console to an error boundary. That is exactly what happened when `attention`,
 * `funnel` and the two new trends shipped here before the API had them.
 *
 * So the response is merged over the empty shape rather than trusted: a field
 * this build knows about and the server has not got yet reads as zero, which
 * is wrong for a few minutes and right forever after. The nested objects are
 * spread individually because a shallow merge would leave a half-populated
 * `attention` from an intermediate deploy looking complete.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const stats = await apiData<Partial<AdminStats>>("/admin/overview", emptyStats);

  return {
    ...emptyStats,
    ...stats,
    funnel: { ...emptyStats.funnel, ...(stats.funnel ?? {}) },
    attention: { ...emptyStats.attention, ...(stats.attention ?? {}) },
    wills_by_status: stats.wills_by_status ?? {},
    will_trend: stats.will_trend ?? [],
    revenue_trend: stats.revenue_trend ?? [],
    client_trend: stats.client_trend ?? [],
    recent_audit: stats.recent_audit ?? [],
  };
}

/*
 * `listRecentAudit()` and `getWillTrend()` used to live here. Both re-fetched
 * the whole overview to slice one field out of it, and the page now reads
 * those fields off the single `getAdminStats()` call it already makes.
 */

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
 * The review queue: Wills whose owner asked for a solicitor's read.
 *
 * FIFO because somebody is waiting. Sorting the newest to the top would let an
 * old submission sink out of sight.
 *
 * `review=requested`, because a review is an optional product with its own
 * price and most submitted Wills have not bought one. Those are not work
 * waiting on a reviewer — they are in the Wills section, where they belong —
 * and queueing them made this list look permanently behind while burying the
 * Wills somebody is actually owed a read of.
 */
export async function getReviewQueue(limit = 10): Promise<AdminWillRow[]> {
  const page = await apiData<Paginated<AdminWillRow>>(
    "/admin/wills",
    emptyPage<AdminWillRow>(),
    { query: { per_page: limit, review: "requested" } },
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

    failure_reason: string | null;
    /** The captured frame lives in the vault; this is its document id. */
    created_at: string | null;
  };
  client: {
    id: string;
    name: string | null;
    email: string;
    /** The two witnesses' ID, held only until this client's KYC completes. */
    witness_identities?: { id: string; file_name: string }[] | null;
  };
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

/* -------------------------------------------------------------------------- */
/*  The blog                                                                   */
/* -------------------------------------------------------------------------- */

/** An article as the console lists it — everything but the body. */
export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  reading_minutes: number;
  is_published: boolean;
  published_at: string | null;
  updated_at: string | null;
};

/** The same, opened for editing. */
export type AdminPostDetail = AdminPost & { body: string };

/**
 * Every article, drafts included.
 *
 * The public `/posts` filters on `is_published`; this deliberately does not.
 * A console that hides half the articles is how two people write the same
 * piece.
 */
export async function listAdminPosts(options: {
  search?: string;
  status?: "published" | "draft";
} = {}): Promise<AdminPost[]> {
  return apiData<AdminPost[]>("/admin/posts", [], {
    query: { search: options.search, status: options.status },
  });
}

/** One article in full. Null when it is gone, or the caller is not an admin. */
export async function getAdminPost(slug: string): Promise<AdminPostDetail | null> {
  const result = await api<{ data: AdminPostDetail }>(
    `/admin/posts/${encodeURIComponent(slug)}`,
  );

  return result.ok ? result.data.data : null;
}
