import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Lock } from "lucide-react";

import { requireAdminPermission } from "@/lib/actions/guards";
import { getWillForReview } from "@/lib/actions/admin";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";
import { PageHead } from "@/components/dashboard/PageHead";
import { RevisionHistory } from "@/components/admin/RevisionHistory";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { ClaimAccessForm } from "@/components/admin/ClaimAccessForm";
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
   *
   * It serves the Will's metadata always and its contents only under a grant
   * the client made — `contents` is null otherwise, and `access` says why.
   */
  const detail = await getWillForReview(id);
  if (!detail) notFound();

  const { will, contents, access, client: owner, revisions } = detail;

  const reviewRequested = will.review_choice === "requested";
  const percent = will.completion_percent;

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

          {contents ? (
            <ReviewSummary will={contents} />
          ) : (
            <div className="border border-dashed border-border p-8">
              <Lock className="h-5 w-5 text-gold" />
              <h2 className="mt-3 font-serif text-xl text-navy">
                The contents of this Will are private
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {access.review_access_ended
                  ? "The client asked for a review, but the reviewer's access has ended — the review concluded, or the client withdrew it."
                  : "Staff read a Will only with its owner's permission. If the client has asked for help with it, ask them to give you an access code from their Will's page."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <ReviewActions
            willId={will.id}
            status={will.status}
            canRead={access.granted}
            reviewRequested={reviewRequested}
            lodgedAt={will.lodged_at}
            lodgingReference={will.lodging_reference}
          />

          <div className="border border-border bg-background p-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {access.granted ? "Your access" : "Access"}
            </p>
            {access.granted ? (
              <>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {access.purpose === "legal_review"
                    ? "Granted for the legal review the client asked for. It ends when the review concludes."
                    : `Granted to you by the client until ${formatDate(access.expires_at)}.`}{" "}
                  Every read is logged and shown to the client.
                </p>
                {/*
                  The *admin* endpoint, not the client's — the client's refuses
                  anything its owner has not paid for. A plain `<a>`, not a
                  `Link`: this is a download from another origin, and Next's
                  client router has no business intercepting it. The client is
                  emailed each time.
                */}
                {access.can_download ? (
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/admin/wills/${will.id}/pdf`}
                    className="mt-4 inline-flex items-center gap-2 border border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Read only — the client did not allow a download.
                  </p>
                )}
              </>
            ) : (
              <ClaimAccessForm willId={will.id} />
            )}
          </div>

          <RevisionHistory revisions={revisions} />
        </div>
      </div>
    </div>
  );
}
