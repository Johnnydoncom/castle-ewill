import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { COMPANY } from "@/lib/company";

/**
 * Bank transfer details.
 *
 * Held in the `settings` table rather than in code or environment variables so
 * an administrator can correct an account number without a redeploy — the sort
 * of change that is occasionally urgent.
 */

export const BANK_SETTINGS_KEY = "payments.bank_account";

export type BankAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string;
};

export const DEFAULT_BANK_ACCOUNT: BankAccount = {
  bankName: "Not yet configured",
  accountName: COMPANY.legalName,
  accountNumber: "—",
  instructions:
    "Bank transfer details have not been set up yet. Please call us and we will confirm where to send payment.",
};

export async function getBankAccount(): Promise<{
  account: BankAccount;
  configured: boolean;
}> {
  try {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, BANK_SETTINGS_KEY))
      .limit(1);

    const value = row?.value as Partial<BankAccount> | undefined;

    if (!value?.accountNumber || !value.bankName) {
      return { account: DEFAULT_BANK_ACCOUNT, configured: false };
    }

    return {
      account: {
        bankName: value.bankName,
        accountName: value.accountName ?? COMPANY.legalName,
        accountNumber: value.accountNumber,
        instructions: value.instructions,
      },
      configured: true,
    };
  } catch (error) {
    console.error("[payments] failed to read bank details", error);
    return { account: DEFAULT_BANK_ACCOUNT, configured: false };
  }
}
