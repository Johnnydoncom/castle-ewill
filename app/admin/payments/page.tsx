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
  paymentStatusTone,
} from "@/components/admin/DataTable";
import { listPayments } from "@/lib/actions/admin";
import { ConfirmTransfer } from "@/components/admin/ConfirmTransfer";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

const PER_PAGE = 25;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);

  const { rows, total, successKobo } = await listPayments({
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Section IV"
        title="Payments"
        blurb="Fees received, pending settlements and failed attempts."
      />

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          numeral="I"
          value={formatNaira(successKobo)}
          label="Collected"
        />
        <StatCard
          numeral="II"
          value={total.toLocaleString()}
          label="Transactions"
        />
        <StatCard
          numeral="III"
          value={
            total > 0
              ? `${Math.round((rows.filter((r) => r.payment.status === "success").length / rows.length) * 100)}%`
              : "—"
          }
          label="Success rate (page)"
        />
      </dl>

      <Table
        headers={["Reference", "Client", "Provider", "Amount", "Status", "Date", ""]}
        isEmpty={rows.length === 0}
        empty="No payments recorded yet. Payment providers are wired in phase 2."
      >
        {rows.map(({ payment, clientName, clientEmail }) => (
          <tr key={payment.id}>
            <Cell muted>{payment.reference}</Cell>
            <Cell>
              <span className="font-medium">{clientName ?? "—"}</span>
              <span className="block text-xs text-muted-foreground">
                {clientEmail}
              </span>
            </Cell>
            <Cell muted>{payment.provider.replace("_", " ")}</Cell>
            <Cell>{formatNaira(payment.amountKobo)}</Cell>
            <Cell>
              <StatusBadge
                label={payment.status}
                tone={paymentStatusTone(payment.status)}
              />
            </Cell>
            <Cell muted>{formatDate(payment.paidAt ?? payment.createdAt)}</Cell>
            <Cell>
              {payment.provider === "bank_transfer" &&
              payment.status === "pending" ? (
                <ConfirmTransfer reference={payment.reference} />
              ) : (
                <span className="text-xs text-muted-foreground/60">&mdash;</span>
              )}
            </Cell>
          </tr>
        ))}
      </Table>

      <Pagination
        page={page}
        perPage={PER_PAGE}
        total={total}
        basePath="/admin/payments"
      />
    </div>
  );
}
