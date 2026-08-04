import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/dashboard/PageHead";
import {
  Cell,
  StatCard,
  StatusBadge,
  Table,
  formatDate,
  formatNaira,
  willStatusTone,
} from "@/components/admin/DataTable";
import {
  getAdminStats,
  getReviewQueue,
  getWillTrend,
  listRecentAudit,
} from "@/lib/actions/admin";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";

export const metadata: Metadata = {
  title: "Registry overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const [stats, queue, trend, audit] = await Promise.all([
    getAdminStats(),
    getReviewQueue(8),
    getWillTrend(),
    listRecentAudit(12),
  ]);

  const peak = Math.max(...trend.map((t) => t.total), 1);

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Registry · Overview"
        title="Overview"
        blurb="The state of the house — clients, drafts in flight, and matters awaiting counsel."
      />

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          numeral="I"
          value={stats.total_clients.toLocaleString()}
          label="Registered clients"
          hint={
            stats.new_clients_this_month > 0
              ? `+${stats.new_clients_this_month} this month`
              : "No new clients this month"
          }
        />
        <StatCard
          numeral="II"
          value={stats.total_wills.toLocaleString()}
          label="Wills created"
          hint={`${stats.wills_executed.toLocaleString()} executed`}
        />
        <StatCard
          numeral="III"
          value={formatNaira(stats.revenue_kobo)}
          label="Fees collected"
        />
        <StatCard
          numeral="IV"
          value={stats.wills_awaiting_review.toLocaleString()}
          label="Awaiting review"
          hint={
            stats.open_messages > 0
              ? `${stats.open_messages} unread message(s)`
              : undefined
          }
        />
      </dl>

      {/* Six-month trend, drawn as a plain bar chart so the page ships no
          charting library for four dozen data points. */}
      <section className="border border-border bg-background p-8">
        <h2 className="font-serif text-lg text-navy">Wills created</h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          Last six months
        </p>
        <div className="mt-8 flex items-end gap-3" style={{ height: 140 }}>
          {trend.map((point) => (
            <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="font-serif text-xs text-navy">{point.total}</span>
              <div
                className="w-full bg-gold/70 transition-all"
                style={{ height: `${Math.max((point.total / peak) * 100, 2)}%` }}
                role="img"
                aria-label={`${point.total} Wills in ${point.month}`}
              />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {point.month.slice(5)}/{point.month.slice(2, 4)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-xl text-navy">Review queue</h2>
          <Link
            href="/admin/wills?status=submitted"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
          >
            All submissions &rarr;
          </Link>
        </div>

        <Table
          headers={["Client", "Reference", "Status", "Submitted", ""]}
          isEmpty={queue.length === 0}
          empty="Nothing is awaiting review. The queue is clear."
        >
          {queue.map(({ will, client }) => (
            <tr key={will.id}>
              <Cell>
                <span className="font-medium">{client.name ?? "—"}</span>
                <span className="block text-xs text-muted-foreground">
                  {client.email}
                </span>
              </Cell>
              <Cell>
                <Link
                  href={`/admin/wills/${will.id}`}
                  className="text-navy underline underline-offset-4 hover:text-gold"
                >
                  {will.reference}
                </Link>
              </Cell>
              <Cell>
                <StatusBadge
                  label={WILL_STATUS_LABELS[will.status] ?? will.status}
                  tone={willStatusTone(will.status)}
                />
              </Cell>
              <Cell muted>{formatDate(will.submitted_at)}</Cell>
              <Cell>
                <Link
                  href={`/admin/wills/${will.id}`}
                  className="text-xs uppercase tracking-wider text-navy underline underline-offset-4 hover:text-gold"
                >
                  Review
                </Link>
              </Cell>
            </tr>
          ))}
        </Table>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Recent activity</h2>
        <Table
          headers={["Action", "Entity", "When"]}
          isEmpty={audit.length === 0}
          empty="No activity recorded yet."
        >
          {audit.map((entry) => (
            <tr key={entry.id}>
              <Cell>{entry.action}</Cell>
              <Cell muted>
                {entry.entity_type ?? "—"}
                {entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ""}
              </Cell>
              <Cell muted>{formatDate(entry.created_at)}</Cell>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
