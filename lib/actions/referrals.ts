import "server-only";

import { apiData } from "@/lib/api/client";

/**
 * The referral programme and the wallet, read from the API.
 *
 * Reads only. A referral is attached when an account is opened, and a
 * commission is credited by the backend when a referred client's payment is
 * confirmed — neither is anything this tier can post.
 */

export type ReferralRow = {
  id: string;
  /** First name and an initial; the referred account's details are not shown. */
  name: string;
  status: "pending" | "rewarded";
  commission_kobo: number | null;
  commission_formatted: string | null;
  joined_at: string | null;
  rewarded_at: string | null;
};

export type ReferralSummary = {
  code: string;
  link: string;
  enabled: boolean;
  commission_rate_bps: number;
  stats: {
    signed_up: number;
    rewarded: number;
    earned_kobo: number;
    earned_formatted: string;
  };
  referrals: ReferralRow[];
};

export type WalletTransaction = {
  id: string;
  type: "credit" | "debit";
  source: string;
  amount_kobo: number;
  amount_formatted: string;
  balance_after_kobo: number;
  balance_after_formatted: string;
  description: string;
  created_at: string | null;
};

export type WalletSummary = {
  balance_kobo: number;
  balance_formatted: string;
  currency: string;
  transactions: WalletTransaction[];
};

export async function getReferrals(): Promise<ReferralSummary | null> {
  return apiData<ReferralSummary | null>("/referrals", null);
}

export async function getWallet(): Promise<WalletSummary | null> {
  return apiData<WalletSummary | null>("/wallet", null);
}
