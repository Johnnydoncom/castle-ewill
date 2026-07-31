import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/dashboard/PageHead";
import {
  Cell,
  Pagination,
  StatusBadge,
  Table,
  formatDate,
  willStatusTone,
} from "@/components/admin/DataTable";
import { listWills } from "@/lib/actions/admin";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";

export const metadata: Metadata = {
  title: "Wills",
  robots: { index: false, follow: false },
};

const PER_PAGE = 25;

const FILTERS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "executed", label: "Executed" },
] as const;

export default async function AdminWillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);

  const { rows, total } = await listWills({ status, page, perPage: PER_PAGE });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Section III"
        title="Wills"
        blurb="Every document on the platform, from first draft to executed instrument."
      />

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {FILTERS.map((filter) => {
          const active = (status ?? "") === filter.value;
          return (
            <Link
              key={filter.label}
              href={
                filter.value ? `/admin/wills?status=${filter.value}` : "/admin/wills"
              }
              className={`border px-4 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                active
                  ? "border-navy bg-navy text-navy-foreground"
                  : "border-border text-muted-foreground hover:border-gold hover:text-gold"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <Table
        headers={["Reference", "Client", "Status", "Completion", "Updated", ""]}
        isEmpty={rows.length === 0}
        empty="No Wills match this filter."
      >
        {rows.map(({ will, clientName, clientEmail }) => (
          <tr key={will.id}>
            <Cell>
              <Link
                href={`/admin/wills/${will.id}`}
                className="text-navy underline underline-offset-4 hover:text-gold"
              >
                {will.reference}
              </Link>
            </Cell>
            <Cell>
              <span className="font-medium">{clientName ?? "—"}</span>
              <span className="block text-xs text-muted-foreground">
                {clientEmail}
              </span>
            </Cell>
            <Cell>
              <StatusBadge
                label={WILL_STATUS_LABELS[will.status] ?? will.status}
                tone={willStatusTone(will.status)}
              />
            </Cell>
            <Cell muted>
              <span className="flex items-center gap-2">
                <span className="h-1 w-16 bg-border">
                  <span
                    className="block h-full bg-gold"
                    style={{ width: `${will.completionPercent}%` }}
                  />
                </span>
                {will.completionPercent}%
              </span>
            </Cell>
            <Cell muted>{formatDate(will.updatedAt)}</Cell>
            <Cell>
              <Link
                href={`/api/wills/${will.id}/pdf`}
                className="text-xs uppercase tracking-wider text-navy underline underline-offset-4 hover:text-gold"
              >
                PDF
              </Link>
            </Cell>
          </tr>
        ))}
      </Table>

      <Pagination
        page={page}
        perPage={PER_PAGE}
        total={total}
        basePath="/admin/wills"
        extraParams={{ status }}
      />
    </div>
  );
}
