import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { JourneyActions } from "@/components/will/JourneyActions";
import { JourneyBar } from "@/components/will/JourneyBar";
import { ReviewSummary } from "@/components/will/ReviewSummary";
import { WitnessVerification } from "@/components/will/WitnessVerification";
import { readWill } from "@/lib/actions/will";
import { getPriceList } from "@/lib/pricing";
import { getProfile } from "@/lib/actions/guards";
import { WillCheckout } from "@/components/payments/WillCheckout";
import {
  listWitnessIdentities,
} from "@/lib/actions/verification";
import { requireUser } from "@/lib/actions/guards";
import { conflictingWitnesses } from "@/lib/will/conflicts";
import { WILL_STATUS_LABELS } from "@/lib/will/reference";

export const metadata: Metadata = {
  title: "Will",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One Will, and everything that belongs to it.
 *
 * The dashboard used to spread a single Will's concerns across separate
 * top-level pages — Witnesses, Advisors, Billing — each of which quietly
 * assumed the client had exactly one. With several, "whose witnesses?" has no
 * answer. Those concerns live here now, against the Will they actually belong
 * to: where it stands, what it is waiting on, its witnesses, and its summary.
 */
export default async function WillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();

  const { id } = await params;
  const read = await readWill(id);

  // The API scopes reads to the caller, so somebody else's id is a 404 too —
  // never a 403, which would confirm it exists.
  if (read.status === "not_found") notFound();

  /*
   * A failed read is not a missing Will, and must not be shown as one. This
   * page used to render "Page not found" whenever the API was unreachable or
   * refused — so a client whose Will was sitting safely in the database was
   * told it did not exist, with nothing to act on and no way to tell the two
   * apart.
   */
  if (read.status === "unavailable") {
    return (
      <div className="space-y-8">
        <Link
          href="/dashboard/wills"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Wills
        </Link>

        <div className="border-l-2 border-destructive bg-destructive/5 p-6">
          <h1 className="font-serif text-xl text-navy">
            We could not open this Will just now.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Your Will is safe — this is a problem reading it, not a problem with
            the document. Please try again in a moment, and tell us if it keeps
            happening.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{read.message}</p>
        </div>
      </div>
    );
  }

  const will = read.will;

  const [prices, profile] = await Promise.all([getPriceList(), getProfile()]);
  /*
   * Always, now — not only when a person is doing the checking.
   *
   * Witness identification used to be collected on the manual-review path
   * alone. It gates printing whoever verifies the testator: the attestation is
   * the part of a Will most likely to be challenged, and two approved
   * documents are what the record rests on.
   */
  const witnessIds = await listWitnessIdentities();

  // Surfaced here as well as in the wizard: this is the rule people most often
  // fall foul of, and it voids the gift rather than the Will.
  const clashes = conflictingWitnesses(
    will.beneficiaries.map((b) => b.full_name ?? ""),
    will.witnesses.map((w) => w.full_name ?? ""),
  );

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard/wills"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Wills
        </Link>
      </div>

      <PageHead
        kicker={will.reference}
        title={will.title}
        blurb={`${WILL_STATUS_LABELS[will.status] ?? will.status} · ${will.completion_percent}% complete`}
      />

      {will.journey && (
        <div className="space-y-6">
          <JourneyBar journey={will.journey} />
          <JourneyActions
            willId={will.id}
            journey={will.journey}
            pdfUrl={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/wills/${will.id}/pdf`}
          />
        </div>
      )}

      {/*
        Paying happens on the Will it pays for — not on a global billing page
        that had to guess which Will a client meant. Shown only while payment
        is what stands in the way, so a paid Will is not still offering to
        take money.
      */}
      {will.journey?.print_blocked_by === "unpaid" && (
        <section className="border border-border bg-background p-6 sm:p-8">
          <h2 className="font-serif text-xl text-navy">Pay for this Will</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Charged once. Everything payable is itemised before you are sent to
            the gateway.
          </p>

          <div className="mt-6">
            <WillCheckout
              willId={will.id}
              plans={prices.will}
              review={prices.review}
              subscription={prices.subscription}
              lodging={prices.lodging}
              initialQuotes={prices.quotes}
              flutterwaveEnabled={prices.providers.flutterwave}
              paystackEnabled={prices.providers.paystack}
              hasActiveSubscription={Boolean(profile?.has_active_subscription)}
            />
          </div>
        </section>
      )}

      {/* This Will's own editor, not "whichever is in flight". */}
      {will.status === "draft" && (
        <Link
          href={`/dashboard/wills/${will.id}/edit?step=${will.current_step}`}
          className="inline-flex items-center gap-2 border border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          Continue writing this Will
        </Link>
      )}

      {clashes.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-5 py-4 text-sm text-navy"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="leading-relaxed">
            <span className="font-medium">{clashes.join(" and ")}</span> is named
            both as a witness and as a beneficiary. A gift to an attesting
            witness is void — choose an independent witness before signing.
          </p>
        </div>
      )}

      <WitnessVerification records={witnessIds} />

      <ReviewSummary will={will} editBasePath={`/dashboard/wills/${will.id}/edit`} />
    </div>
  );
}
