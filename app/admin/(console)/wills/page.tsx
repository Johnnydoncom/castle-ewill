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
import { requireAdminPermission } from "@/lib/actions/guards";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";

export const metadata: Metadata = {
  title: "Wills",
  robots: { index: false, follow: false },
};

const PER_PAGE = 25;

/*
 * `"all"` rather than an empty string.
 *
 * The API's default — no `status` at all — is the outstanding *queue*, which is
 * what the review screen should open on. This page is the archive, so it asks
 * for everything explicitly.
 */
const FILTERS = [
  { value: "all", label: "All" },
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
  await requireAdminPermission("manage_wills");

  const { status, page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);

  const { data: rows, total } = await listWills({
    status: (status as Parameters<typeof listWills>[0]["status"]) ?? "all",
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Wills"
        title="Wills"
        blurb="Every document on the platform, from first draft to executed instrument."
      />

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {FILTERS.map((filter) => {
          const active = (status ?? "all") === filter.value;
          return (
            <Link
              key={filter.label}
              href={
                filter.value === "all"
                  ? "/admin/wills"
                  : `/admin/wills?status=${filter.value}`
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
        {rows.map(({ will, client }) => (
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
              <span className="font-medium">{client.name ?? "—"}</span>
              <span className="block text-xs text-muted-foreground">
                {client.email}
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
                    style={{ width: `${will.completion_percent}%` }}
                  />
                </span>
                {will.completion_percent}%
              </span>
            </Cell>
            <Cell muted>{formatDate(will.updated_at)}</Cell>
            <Cell>
              <Link
                href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/wills/${will.id}/pdf`}
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
