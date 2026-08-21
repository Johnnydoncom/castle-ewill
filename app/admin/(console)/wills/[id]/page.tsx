import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { requireAdminPermission } from "@/lib/actions/guards";
import { getWillForReview } from "@/lib/actions/admin";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
import { PageHead } from "@/components/dashboard/PageHead";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { ReviewSummary } from "@/components/will/ReviewSummary";
import {
  StatusBadge,
  formatDate,
  willStatusTone,
} from "@/components/admin/DataTable";

export const metadata: Metadata = {
  title: "Will detail",
  robots: { index: false, follow: false },
};

export default async function AdminWillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("manage_wills");
  const { id } = await params;

  /*
   * `/admin/wills/{id}` is the deliberate unscoped read — a separate endpoint
   * from the client-facing one, so stepping outside the owner scope is visible
   * rather than something a forgotten argument allows. It answers 404 both for
   * a Will that does not exist and for a caller who may not review it.
   */
  const detail = await getWillForReview(id);
  if (!detail) notFound();

  const { will, client: owner, revisions } = detail;

  const percent = will.progress?.percent ?? will.completion_percent;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/admin/wills"
          className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
        >
          &larr; All Wills
        </Link>
        <div className="mt-4">
          <PageHead
            kicker={`Registry · ${will.reference}`}
            title={will.title}
            blurb={`Submitted by ${owner.name ?? "unknown"} (${owner.email}).`}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:gap-10">
        <div className="space-y-8">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Status",
                value: (
                  <StatusBadge
                    label={WILL_STATUS_LABELS[will.status] ?? will.status}
                    tone={willStatusTone(will.status)}
                  />
                ),
              },
              { label: "Completion", value: `${percent}%` },
              { label: "Revision", value: String(will.version) },
              { label: "Submitted", value: formatDate(will.submitted_at) },
            ].map((item) => (
              <div key={item.label} className="border border-border p-4">
                <dt className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-2 font-serif text-lg text-navy">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <ReviewSummary will={will} />
        </div>

        <div className="space-y-8">
          <ReviewActions
            willId={will.id}
            status={will.status}
            lodgedAt={will.lodged_at}
            lodgingReference={will.lodging_reference}
          />

          <div className="border border-border bg-background p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Document
            </p>
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/wills/${will.id}/pdf`}
              className="mt-4 inline-flex items-center gap-2 border border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Link>
          </div>

          <div className="border border-border bg-background p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              Revision history
            </p>
            {revisions.length === 0 ? (
              <p className="mt-3 text-xs italic text-muted-foreground">
                No revisions recorded yet.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {revisions.map((revision) => (
                  <li
                    key={revision.version}
                    className="border-l-2 border-border pl-4"
                  >
                    <p className="text-sm text-navy">
                      Revision {revision.version}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {revision.summary ?? "—"}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      {formatDate(revision.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
