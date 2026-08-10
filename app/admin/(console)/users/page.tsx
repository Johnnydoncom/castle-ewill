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
import { listClients } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";
import { ClientStatusToggle } from "@/components/admin/ClientStatusToggle";
import { LawyerVerification } from "@/components/admin/LawyerVerification";

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false },
};

const PER_PAGE = 25;

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const admin = await requireAdminPermission("manage_clients");
  const { q, page: pageParam, filter } = await searchParams;
  const lawyersOnly = filter === "lawyers_pending";
  const page = Math.max(Number(pageParam) || 1, 1);

  const { data: rows, total } = await listClients({
    search: q,
    page,
    perPage: PER_PAGE,
    filter: lawyersOnly ? "lawyers_pending" : undefined,
  });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Clients"
        title="Clients"
        blurb="Everyone who has opened an account, and the state of their record."
      />

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email or enrolment number"
          aria-label="Search clients"
          className="min-w-64 flex-1 border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="border border-border px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          Search
        </button>
        {/*
          A lawyer waiting on verification is charged the individual rate and
          cannot be told why, so this queue going unwatched is a billing
          problem as well as a support one.
        */}
        <Link
          href={
            lawyersOnly ? "/admin/users" : "/admin/users?filter=lawyers_pending"
          }
          className={`self-center border px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors ${
            lawyersOnly
              ? "border-gold text-gold"
              : "border-border text-navy hover:border-gold hover:text-gold"
          }`}
        >
          {lawyersOnly ? "All clients" : "Lawyers awaiting checks"}
        </Link>
      </form>

      <Table
        headers={["Client", "Role", "Enrolment", "Status", "Wills", "Joined", ""]}
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
                tone={
                  client.role === "admin"
                    ? "info"
                    : client.role === "lawyer"
                      ? "warn"
                      : "neutral"
                }
              />
            </Cell>
            <Cell>
              {client.is_lawyer ? (
                <LawyerVerification
                  userId={client.id}
                  enrolmentNumber={client.enrolment_number ?? null}
                  isVerified={Boolean(client.is_verified_lawyer)}
                  rejectedReason={client.lawyer_rejected_reason ?? null}
                />
              ) : (
                <span className="text-xs text-muted-foreground">&mdash;</span>
              )}
            </Cell>
            <Cell>
              <StatusBadge
                label={
                  client.status !== "active"
                    ? client.status
                    : client.is_email_verified
                      ? "verified"
                      : "unverified"
                }
                tone={
                  client.status !== "active"
                    ? "danger"
                    : client.is_email_verified
                      ? "success"
                      : "warn"
                }
              />
            </Cell>
            <Cell muted>{client.wills_count}</Cell>
            <Cell muted>{formatDate(client.created_at)}</Cell>
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
        extraParams={{ q, filter }}
      />
    </div>
  );
}
