import "server-only";

import { apiData } from "@/lib/api/client";
import type { PaymentRecord } from "./payments";
import type { ApiWill } from "./will";

/**
 * The client dashboard.
 *
 * One request, not six. The dashboard is server-rendered, so each separate call
 * would be a serial round trip on the critical path of the first page a
 * signed-in user sees. The backend assembles it in a single handler.
 *
 * Degrades to an empty shape rather than throwing: a dashboard that renders
 * "nothing here yet" is a better failure than a 500 in front of someone trying
 * to reach their Will.
 */

export type NotificationRecord = {
  id: string;
  type: "system" | "will_review" | "payment" | "reminder" | "security";
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type DashboardData = {
  wills: ApiWill[];
  primary_will: {
    will: ApiWill;
    next_step: number;
    can_submit: boolean;
  } | null;
  verification: {
    is_verified: boolean;
    verified_until: string | null;
  };
  documents_count: number;
  payments: PaymentRecord[];
  notifications: NotificationRecord[];
  unread_notifications: number;
  account: {
    is_email_verified: boolean;
    is_phone_verified: boolean;
    is_kyc_verified: boolean;
    two_factor_enabled: boolean;
    /** 0–100, computed server-side from the same record described above. */
    profile_completion: number;
  };
};

const empty: DashboardData = {
  wills: [],
  primary_will: null,
  verification: { is_verified: false, verified_until: null },
  documents_count: 0,
  payments: [],
  notifications: [],
  unread_notifications: 0,
  account: {
    is_email_verified: false,
    is_phone_verified: false,
    is_kyc_verified: false,
    two_factor_enabled: false,
    profile_completion: 0,
  },
};

/**
 * One round trip for the dashboard overview.
 *
 * Takes no user id. The caller is identified by the bearer token the API client
 * attaches, and the backend scopes every query to it — passing an id would be
 * an argument somebody could eventually get wrong.
 */
export async function getDashboardData(): Promise<DashboardData> {
  return apiData<DashboardData>("/dashboard", empty);
}

/**
 * Profile completeness.
 *
 * Kept as a named export because components import it, but the value now comes
 * from the API — `data.account.profile_completion` — so the ring and the record
 * behind it cannot disagree. Prefer that field; this helper exists for the
 * places that still hold a bare user object.
 */
export function profileCompletion(user: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isEmailVerified?: boolean;
  image?: string | null;
}): number {
  const checks = [
    Boolean(user.name),
    Boolean(user.email),
    Boolean(user.isEmailVerified),
    Boolean(user.phone),
    Boolean(user.image),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
