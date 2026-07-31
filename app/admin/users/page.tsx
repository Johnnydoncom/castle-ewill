import type { Metadata } from "next";

import { PageHead } from "@/components/dashboard/PageHead";
import {
  Cell,
  Pagination,
  StatusBadge,
  Table,
  formatDate,
} from "@/components/admin/DataTable";
import { listClients } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/actions/guards";
import { ClientStatusToggle } from "@/components/admin/ClientStatusToggle";

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false },
};

const PER_PAGE = 25;

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);

  const { rows, total } = await listClients({
    search: q,
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Section II"
        title="Clients"
        blurb="Everyone who has opened an account, and the state of their record."
      />

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or email"
          aria-label="Search clients"
          className="min-w-64 flex-1 border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="border border-border px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          Search
        </button>
      </form>

      <Table
        headers={["Client", "Role", "Status", "Wills", "Joined", ""]}
        isEmpty={rows.length === 0}
        empty={q ? `No clients match “${q}”.` : "No clients registered yet."}
      >
        {rows.map((client) => (
          <tr key={client.id}>
            <Cell>
              <span className="font-medium">{client.name ?? "—"}</span>
              <span className="block text-xs text-muted-foreground">
                {client.email}
              </span>
            </Cell>
            <Cell>
              <StatusBadge
                label={client.role}
                tone={client.role === "admin" ? "info" : "neutral"}
              />
            </Cell>
            <Cell>
              <StatusBadge
                label={
                  client.status !== "active"
                    ? client.status
                    : client.emailVerifiedAt
                      ? "verified"
                      : "unverified"
                }
                tone={
                  client.status !== "active"
                    ? "danger"
                    : client.emailVerifiedAt
                      ? "success"
                      : "warn"
                }
              />
            </Cell>
            <Cell muted>{client.willCount}</Cell>
            <Cell muted>{formatDate(client.createdAt)}</Cell>
            <Cell>
              <ClientStatusToggle
                userId={client.id}
                status={client.status}
                isSelf={client.id === admin.id}
                isAdmin={client.role === "admin"}
              />
            </Cell>
          </tr>
        ))}
      </Table>

      <Pagination
        page={page}
        perPage={PER_PAGE}
        total={total}
        basePath="/admin/users"
        extraParams={{ q }}
      />
    </div>
  );
}
