import type { Metadata } from "next";

import { PageHead } from "@/components/dashboard/PageHead";
import {
  Cell,
  Pagination,
  StatCard,
  StatusBadge,
  Table,
  formatDate,
  formatNaira,
} from "@/components/admin/DataTable";
import { listReferrals } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Referrals",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPermission("manage_payments");

  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);

  const { data: rows, total, summary } = await listReferrals({ page, perPage: PER_PAGE });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Referrals"
        title="Referrals"
        blurb={`Who brought whom, and the ${summary.commission_rate_bps / 100}% commission credited to clients' wallets when a referred client's first plan is paid for.`}
      />

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard numeral="I" value={summary.referrals.toLocaleString()} label="Referred sign-ups" />
        <StatCard numeral="II" value={summary.rewarded.toLocaleString()} label="Went on to pay" />
        <StatCard numeral="III" value={formatNaira(summary.commission_kobo)} label="Commission credited" />
        <StatCard numeral="IV" value={formatNaira(summary.wallet_balance_kobo)} label="Held in wallets" />
      </dl>

      <Table
        headers={["Referred by", "New client", "Code", "Status", "Plan price", "Commission", "Joined"]}
        isEmpty={rows.length === 0}
        empty="Nobody has signed up with a referral code yet."
      >
        {rows.map((referral) => (
          <tr key={referral.id}>
            <Cell>
              <span className="font-medium">{referral.referrer?.name ?? "—"}</span>
              <span className="block text-xs text-muted-foreground">
                {referral.referrer?.email ?? "—"}
              </span>
            </Cell>
            <Cell>
              <span className="font-medium">{referral.referred?.name ?? "—"}</span>
              <span className="block text-xs text-muted-foreground">
                {referral.referred?.email ?? "—"}
              </span>
            </Cell>
            <Cell muted>{referral.code}</Cell>
            <Cell>
              <StatusBadge
                label={referral.status === "rewarded" ? "paid" : "not paid yet"}
                tone={referral.status === "rewarded" ? "success" : "neutral"}
              />
            </Cell>
            <Cell muted>
              {referral.base_formatted ?? "—"}
              {referral.payment && (
                <span className="block text-xs">{referral.payment.invoice_number ?? referral.payment.reference}</span>
              )}
            </Cell>
            <Cell>{referral.commission_formatted ?? "—"}</Cell>
            <Cell muted>{formatDate(referral.created_at)}</Cell>
          </tr>
        ))}
      </Table>

      <Pagination page={page} perPage={PER_PAGE} total={total} basePath="/admin/referrals" />
    </div>
  );
}
