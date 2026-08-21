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
  const profile = await getProfile();

  // Nothing left to do here — sent back to the dashboard rather than shown a
  // page whose only purpose has already been served.
  if (profile?.is_kyc_verified) {
    redirect("/dashboard");
  }

  const verification = await getVerificationStatus();

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
      verification.latest.is_submitted &&
      verification.latest.purpose === "kyc" ? (
        <VerificationPending
          provider={verification.latest.provider}
          next="/dashboard"
        />
      ) : (
        <KycOnboarding
          rejectionReason={
            verification.latest?.status === "failed" &&
            verification.latest.purpose === "kyc"
              ? verification.latest.failure_reason
              : null
          }
        />
      )}
    </div>
  );
}
