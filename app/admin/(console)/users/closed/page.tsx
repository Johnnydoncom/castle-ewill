import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/dashboard/PageHead";
import {
  Cell,
  Pagination,
  StatusBadge,
  Table,
  formatDate,
} from "@/components/admin/DataTable";
import { SendRestoreLink } from "@/components/admin/SendRestoreLink";
import { listClosedAccounts } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Closed accounts",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Accounts their holders closed, held until erasure, and the one thing staff
 * may do for one: send its holder a link to reopen it, when they ask.
 *
 * Under Clients rather than a section of its own — it is the same people, and
 * the console keeps to its seven sections.
 */
export default async function AdminClosedAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminPermission("manage_clients");
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);

  const { data: rows, total } = await listClosedAccounts({
    search: q,
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Clients"
        title="Closed accounts"
        blurb="Accounts their holders closed. Each is held until its erasure date, and can be reopened until then — only by its holder, from a link sent to the address on the account."
      />

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or email"
          aria-label="Search closed accounts"
          className="min-w-64 flex-1 border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="border border-border px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          Search
        </button>
        <Link
          href="/admin/users"
          className="self-center border border-border px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          All clients
        </Link>
      </form>

      <div className="border-l-2 border-gold/40 bg-gold/5 px-6 py-4 text-sm leading-relaxed text-navy/80">
        Send a link only when the client has asked for their account back. The
        link goes to the address shown here and nowhere else, works once, and
        expires after three days. Nothing reopens until the client follows it.
      </div>

      <Table
        headers={["Client", "Role", "Holds", "Closed", "Erased on", ""]}
        isEmpty={rows.length === 0}
        empty={q ? `No closed accounts match “${q}”.` : "No accounts are closed."}
      >
        {rows.map((account) => (
          <tr key={account.id}>
            <Cell>
              <span className="font-medium">{account.name ?? "—"}</span>
              <span className="block text-xs text-muted-foreground">
                {account.email}
              </span>
            </Cell>
            <Cell>
              <StatusBadge
                label={account.role}
                tone={account.role === "lawyer" ? "warn" : "neutral"}
              />
            </Cell>
            <Cell muted>
              {plural(account.wills_count, "Will", "Wills")},{" "}
              {plural(account.documents_count, "document", "documents")}
            </Cell>
            <Cell muted>{formatDate(account.closed_at)}</Cell>
            <Cell muted>{formatDate(account.erasure_due_at)}</Cell>
            <Cell>
              <SendRestoreLink
                userId={account.id}
                hasPendingLink={account.restore_link_expires_at !== null}
              />
              {account.restore_link_expires_at && (
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Link sent · valid until{" "}
                  {formatDate(account.restore_link_expires_at)}
                </span>
              )}
            </Cell>
          </tr>
        ))}
      </Table>

      <Pagination
        page={page}
        perPage={PER_PAGE}
        total={total}
        basePath="/admin/users/closed"
        extraParams={{ q }}
      />
    </div>
  );
}
