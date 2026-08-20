import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

import { getProfile } from "@/lib/actions/guards";
import { getVerificationStatus } from "@/lib/actions/verification";
import { KycOnboarding } from "@/components/kyc/KycOnboarding";

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
        "Awaiting review" needs a capture to review.
        
        This tested `status === "pending"` alone, but an attempt is created
        pending the moment a challenge is issued — so a client whose liveness
        check failed, or who simply closed the tab, came back to "recorded and
        awaiting review" with the retry hidden behind it. Nothing had been
        recorded, and no review was coming.
      */}
      {verification.latest?.status === "pending" &&
      verification.latest.is_submitted &&
      verification.latest.purpose === "kyc" ? (
        <div className="flex items-start gap-3 border-l-2 border-gold bg-gold/5 px-5 py-4 text-sm text-navy">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="leading-relaxed">
            Your identity check has been recorded and is awaiting review.
            We&apos;ll email you as soon as it&apos;s approved, and you can
            start your Will then.
          </p>
        </div>
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
