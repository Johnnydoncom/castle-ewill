import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/dashboard/PageHead";
import {
  AttentionPanel,
  Funnel,
  MonthlyChart,
  TrendCard,
} from "@/components/admin/Analytics";
import {
  Cell,
  StatusBadge,
  Table,
  formatDate,
  formatNaira,
  willStatusTone,
} from "@/components/admin/DataTable";
import { getAdminStats, getReviewQueue } from "@/lib/actions/admin";
import { activityLabel, activityTone } from "@/lib/admin-activity";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";

export const metadata: Metadata = {
  title: "Registry overview",
  robots: { index: false, follow: false },
};

/** Counts change constantly; this is never a cached view. */
export const dynamic = "force-dynamic";

/**
 * The console's front page.
 *
 * Ordered by what somebody opening it needs, in that order:
 *
 *  1. **What is waiting on me** — previously spread across four screens, so
 *     the only way to know whether anything needed doing was to visit them all.
 *  2. **Is the business growing** — four headline figures, each with its own
 *     six-month shape. A lifetime total answers "how much" and never "and is
 *     that getting better".
 *  3. **Where do people stop** — the funnel, which a table of status counts
 *     cannot show.
 *  4. **The queue, and what has been happening.**
 */
export default async function AdminOverviewPage() {
  const [stats, queue] = await Promise.all([getAdminStats(), getReviewQueue(6)]);

  const naira = (kobo: number) => formatNaira(kobo);

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Overview"
        title="Overview"
        blurb="What needs a decision, how the practice is trending, and where clients stop."
      />

      <AttentionPanel
        items={[
          {
            label: "Wills awaiting review",
            count: stats.attention.wills_awaiting_review,
            href: "/admin/wills?status=submitted",
          },
          {
            label: "Identities to decide",
            count: stats.attention.verifications_pending,
            href: "/admin/verifications",
          },
          {
            label: "Transfers to confirm",
            count: stats.attention.transfers_pending,
            href: "/admin/payments",
          },
          {
            label: "Unread messages",
            count: stats.attention.open_messages,
            href: "/admin/messages",
          },
          {
            label: "Draft articles",
            count: stats.attention.draft_articles,
            href: "/admin/posts",
          },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TrendCard
          label="Fees collected"
          value={stats.revenue_formatted}
          points={stats.revenue_trend}
          format={naira}
        />
        <TrendCard
          label="Registered clients"
          value={stats.total_clients.toLocaleString()}
          points={stats.client_trend}
          href="/admin/users"
        />
        <TrendCard
          label="Wills created"
          value={stats.total_wills.toLocaleString()}
          points={stats.will_trend}
          href="/admin/wills"
        />
        <TrendCard
          label="Wills executed"
          value={stats.wills_executed.toLocaleString()}
          points={[]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyChart
          title="Fees collected"
          subtitle="Last six months"
          points={stats.revenue_trend}
          format={naira}
        />

        <Funnel
          steps={[
            {
              label: "Started a Will",
              value: stats.funnel.drafted,
              hint: "Opened the wizard and saved something.",
            },
            {
              label: "Confirmed their answers",
              value: stats.funnel.confirmed,
              hint: "Finished all nine steps and confirmed.",
            },
            {
              label: "Paid",
              value: stats.funnel.paid,
              hint: "A settled payment against that Will.",
            },
            {
              label: "Printed",
              value: stats.funnel.printed,
              hint: "Identity and witnesses cleared, document released.",
            },
          ]}
        />
      </div>

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
          empty="No client has asked for a solicitor's read. The queue is clear."
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
          headers={["What happened", "Who", "When"]}
          isEmpty={stats.recent_audit.length === 0}
          empty="No activity recorded yet."
        >
          {stats.recent_audit.slice(0, 12).map((entry) => {
            const tone = activityTone(entry.action);

            return (
              <tr key={entry.id}>
                <Cell>
                  {/*
                    The action in English, not the raw key. The entity id used
                    to sit beside it as the first eight characters of a UUID,
                    which identified nothing to a person and cost a column.
                  */}
                  <span
                    className={
                      tone === "danger"
                        ? "text-destructive"
                        : tone === "warn"
                          ? "text-navy"
                          : "text-navy/80"
                    }
                  >
                    {activityLabel(entry.action)}
                  </span>
                  {entry.entity_type && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {entry.entity_type.replace(/_/g, " ")}
                    </span>
                  )}
                </Cell>

                <Cell muted>
                  {entry.actor ? (
                    <>
                      {entry.actor.name}
                      <span className="block text-xs text-muted-foreground/70">
                        {entry.actor.email}
                      </span>
                    </>
                  ) : (
                    // A signed-out action — a failed sign-in, a webhook.
                    <span className="italic">Not signed in</span>
                  )}
                </Cell>

                <Cell muted>{formatDate(entry.created_at)}</Cell>
              </tr>
            );
          })}
        </Table>
      </section>
    </div>
  );
}
