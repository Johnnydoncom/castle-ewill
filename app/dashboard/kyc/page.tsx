import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

import { getProfile } from "@/lib/actions/guards";
import { getVerificationStatus } from "@/lib/actions/verification";
import { listUserDocuments } from "@/lib/actions/documents";
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

  const [verification, documents] = await Promise.all([
    getVerificationStatus(),
    listUserDocuments(),
  ]);

  const hasIdDocument = documents.some(
    (document) => document.kind === "identity_document",
  );

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
          A one-time check before you can start your Will. We compare a photo
          of your identity document against a short liveness check, and an
          administrator reviews the result.
        </p>
      </header>

      {verification.latest?.status === "pending" &&
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
        <KycOnboarding hasIdDocument={hasIdDocument} />
      )}
    </div>
  );
}
