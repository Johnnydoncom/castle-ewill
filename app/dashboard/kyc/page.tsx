import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getProfile } from "@/lib/actions/guards";
import { getVerificationStatus } from "@/lib/actions/verification";
import { KycOnboarding } from "@/components/kyc/KycOnboarding";
import { VerificationPending } from "@/components/kyc/VerificationPending";

export const metadata: Metadata = {
  title: "Verify your identity",
  robots: { index: false, follow: false },
};

export default async function KycPage() {
  const [profile, verification] = await Promise.all([
    getProfile(),
    getVerificationStatus(),
  ]);

  /*
   * Identity is proved once. A camera check is not that.
   *
   * `is_kyc_verified` means the document check has been passed — it never
   * expires and is never asked for twice. `verification.is_verified` is the
   * narrower, hour-long fact that this session is that person, which the print
   * gate wants fresh.
   *
   * This page used to redirect anybody KYC-verified straight back to the
   * dashboard, which made the live check unreachable: the journey card sends
   * them here, and here sent them away again. Reported as being asked to do
   * KYC twice — what the second visit actually needed was the short check,
   * shown with the same words and the same document flow as the first.
   */
  const kycDone = Boolean(profile?.is_kyc_verified);

  if (kycDone && verification.is_verified) {
    redirect("/dashboard");
  }

  return (
    /*
      Deliberately bare.
      
      This page used to carry a full editorial header — eyebrow, headline,
      standfirst — above the check. All of it said what the card underneath
      already says, and it pushed a camera flow that people work through on a
      phone below the fold. The card is the page; the only other thing anyone
      needs here is a way out.
    */
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      {/*
        A submitted check with no verdict yet.
        
        Two things had to be separated here. "Awaiting review" needs a capture
        to review — an attempt is `pending` from the moment it is opened, so an
        abandoned one used to come back as "recorded and awaiting review" with
        the retry hidden behind it.
        
        And "review" itself was wrong for the automated path: under Smile ID
        nobody is waiting on a person, the verdict is already on its way to our
        webhook, and telling a client to wait for an email describes a review
        that will never happen. That component knows the difference, and polls
        so the page moves on by itself.
      */}
      {verification.latest?.status === "pending" &&
      verification.latest.is_submitted ? (
        <VerificationPending
          provider={verification.latest.provider}
          next="/dashboard"
        />
      ) : (
        <KycOnboarding
          /*
           * Which of the two checks this visit is for. A client who has
           * already proved who they are is asked for a face and nothing else —
           * no document, no second identity check.
           */
          recheckOnly={kycDone}
          rejectionReason={
            verification.latest?.status === "failed"
              ? verification.latest.failure_reason
              : null
          }
        />
      )}
    </div>
  );
}
