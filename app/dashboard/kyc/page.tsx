import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

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
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="border-b border-border pb-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-10 bg-gold" />
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Identity verification
          </p>
        </div>
        <h1 className="font-serif text-3xl text-navy sm:text-4xl">
          Let&apos;s confirm it&apos;s you.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A one-time check before you can print your Will. You photograph your
          identity document and your face, and our identity provider confirms
          they match. We do not keep the photographs.
        </p>
      </header>

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
