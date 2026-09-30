import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ReactivationCheckout } from "@/components/account/ReactivationCheckout";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireProfile } from "@/lib/actions/guards";
import { apiData } from "@/lib/api/client";
import type { PriceQuote } from "@/lib/pricing/types";

export const metadata: Metadata = {
  title: "Reactivate your account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Reactivation = {
  deactivated: boolean;
  deactivated_at: string | null;
  lapsed_since: string | null;
  lapse_years: number;
  /** Null when no fee is published. */
  quote: PriceQuote | null;
};

function readableDate(iso: string | null): string | null {
  return iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Lagos",
      })
    : null;
}

/**
 * The one page a deactivated account is shown.
 *
 * An account whose Wills' subscription lapsed for three years is deactivated
 * (2026-09-30). Nothing is deleted; the client signs in, pays the reactivation
 * fee here, and the account reopens the moment the payment is confirmed. The
 * API refuses a deactivated account everything but this and the payment
 * routes, and `requireCustomer()` sends it here from the dashboard.
 */
export default async function ReactivatePage() {
  const profile = await requireProfile();

  if (profile.status !== "deactivated") {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }

  const reactivation = await apiData<Reactivation | null>("/account/reactivation", null);
  const lapsedSince = readableDate(reactivation?.lapsed_since ?? null);
  const years = reactivation?.lapse_years ?? 3;

  return (
    <AuthShell
      eyebrow="Account deactivated"
      title={
        <>
          Reactivate your <span className="italic text-gold">account.</span>
        </>
      }
      intro={`The subscription on your Will has not been renewed for ${years} years${
        lapsedSince ? ` — it ended on ${lapsedSince}` : ""
      }, so your account was deactivated. Nothing has been deleted: your Will and your documents are held exactly as they were. Pay the one-off reactivation fee and your account reopens as soon as the payment is confirmed.`}
      plateImage="/images/signing-hands.jpg"
      plateCaption="Your Will is held exactly as you left it."
      footer={
        <>
          Questions about your account?{" "}
          <Link
            href="/contact"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Contact us &rarr;
          </Link>
        </>
      }
    >
      {reactivation?.quote ? (
        <ReactivationCheckout quote={reactivation.quote} />
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Reactivation is not available online just now. Please contact us and
          we will reactivate your account for you.
        </p>
      )}
    </AuthShell>
  );
}
