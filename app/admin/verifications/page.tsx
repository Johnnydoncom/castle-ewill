import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/dashboard/PageHead";
import { Pagination, StatusBadge, formatDate } from "@/components/admin/DataTable";
import { VerificationDecision } from "@/components/admin/VerificationDecision";
import { listVerifications } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "Identity checks",
  robots: { index: false, follow: false },
};

/**
 * The manual verification queue.
 *
 * This screen is what makes `VERIFICATION_PROVIDER=manual_review` honest rather
 * than a euphemism for "not checked". With no KYC vendor configured, every
 * attempt lands here as pending and a person decides — and until somebody does,
 * the client cannot submit their Will.
 *
 * Oldest first: somebody is waiting.
 */
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

const FILTERS = [
  { value: "pending", label: "Awaiting review" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
] as const;

function statusTone(status: string): "success" | "warn" | "danger" | "neutral" {
  if (status === "passed") return "success";
  if (status === "pending") return "warn";
  if (status === "failed") return "danger";
  return "neutral";
}

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  const active = status ?? "pending";

  // `"all"` is sent explicitly. Omitting the parameter means "the queue" to the
  // API, which is the right default but the wrong answer for this filter.
  const { data: rows, total } = await listVerifications({
    status: active,
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Registry · Identity Verification"
        title="Identity checks"
        blurb="Liveness captures awaiting a human decision. A client cannot submit a Will until theirs is approved."
      />

      <nav className="flex flex-wrap gap-2" aria-label="Filter by outcome">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={
              filter.value === "pending"
                ? "/admin/verifications"
                : `/admin/verifications?status=${filter.value}`
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
          <p className="font-serif text-lg text-navy">Nothing waiting.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {active === "pending"
              ? "Every identity check has been decided."
              : "No checks match this filter."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border bg-background">
          {rows.map(({ verification, client }) => (
            <li key={verification.id} className="px-5 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy">
                    {client.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{client.email}</p>

                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>
                      <dt className="inline font-medium">Requested: </dt>
                      <dd className="inline">
                        {(verification.challenges ?? []).join(", ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Reported: </dt>
                      <dd className="inline">
                        {(verification.completed_challenges ?? []).join(", ") ||
                          "none"}
                      </dd>
                    </div>
                  </dl>

                  {/*
                    Scores appear only when an automated provider supplied them.
                    Under manual review there is nothing to show, and inventing a
                    number would be worse than showing none.
                  */}
                  {verification.match_score !== null && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Provider match score: {verification.match_score}
                    </p>
                  )}

                  {verification.failure_reason && (
                    <p className="mt-2 text-xs italic text-destructive">
                      {verification.failure_reason}
                    </p>
                  )}

                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {formatDate(verification.created_at)} · via{" "}
                    {verification.provider}
                  </p>
                </div>

                <StatusBadge
                  label={verification.status}
                  tone={statusTone(verification.status)}
                />
              </div>

              {verification.status === "pending" && (
                <div className="mt-5 border-t border-border pt-5">
                  <VerificationDecision
                    verificationId={verification.id}
                    captureDocumentId={verification.capture_document_id}
                    referenceDocumentId={verification.reference_document_id}
                    referenceKind={verification.reference_kind}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        perPage={PER_PAGE}
        total={total}
        basePath="/admin/verifications"
        extraParams={{ status }}
      />

      <section className="border-l-2 border-gold/40 bg-gold/5 px-6 py-5">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          What you are deciding
        </p>
        <p className="mt-3 text-sm leading-relaxed text-navy/80">
          Compare the capture against the reference image linked below it —
          the client&rsquo;s identity document when they have one on file, or
          their previously enrolled selfie if they don&rsquo;t. The
          browser-side liveness challenge raises the effort needed to hold up
          a photograph, but it is not anti-spoofing — a determined attacker
          bypasses it entirely. Your eyes are the control here.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          An approval is valid for one hour, after which the client must verify
          again. Every capture you open is recorded against your account.
        </p>
      </section>
    </div>
  );
}
