import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { Pagination, StatusBadge, formatDate } from "@/components/admin/DataTable";
import { ContactStatus } from "@/components/admin/ContactStatus";
import { listContactMessages } from "@/lib/actions/admin";
import { requireAdminPermission } from "@/lib/actions/guards";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

const FILTERS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
] as const;

function statusTone(status: string): "success" | "warn" | "info" | "neutral" {
  if (status === "new") return "warn";
  if (status === "in_progress") return "info";
  return "neutral";
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdminPermission("manage_messages");

  const { status, page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  const active = status ?? "new";

  const { data: rows, total } = await listContactMessages({
    status: active === "all" ? undefined : active,
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Messages"
        title="Messages"
        blurb="Enquiries from the public contact form."
      />

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={
              filter.value === "new"
                ? "/admin/messages"
                : `/admin/messages?status=${filter.value}`
            }
            className={`border px-4 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
              active === filter.value
                ? "border-navy bg-navy text-navy-foreground"
                : "border-border text-muted-foreground hover:border-gold hover:text-gold"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-16 text-center">
          <p className="font-serif text-lg text-navy">Nothing here.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {active === "new"
              ? "Every enquiry has been picked up."
              : "No messages match this filter."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border bg-background">
          {rows.map((message) => (
            <li key={message.id} className="px-5 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-base text-navy">
                    {message.subject}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {message.name}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {/*
                      `mailto:` and `tel:` are safe here — they open the
                      operator's own client rather than navigating anywhere.
                      The message body below is rendered as text, never as
                      markup: it arrived from an anonymous form.
                    */}
                    <a
                      href={`mailto:${message.email}`}
                      className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-navy"
                    >
                      <Mail className="h-3 w-3" />
                      {message.email}
                    </a>
                    {message.phone && (
                      <a
                        href={`tel:${message.phone}`}
                        className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-navy"
                      >
                        <Phone className="h-3 w-3" />
                        {message.phone}
                      </a>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-navy/85">
                    {message.message}
                  </p>

                  <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {formatDate(message.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <StatusBadge
                    label={message.status.replace("_", " ")}
                    tone={statusTone(message.status)}
                  />
                  <ContactStatus
                    messageId={message.id}
                    status={message.status}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        perPage={PER_PAGE}
        total={total}
        basePath="/admin/messages"
        extraParams={{ status }}
      />
    </div>
  );
}
