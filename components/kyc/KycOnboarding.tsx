"use client";

import { AlertCircle } from "lucide-react";

import { SmileIdCapture } from "@/components/verification/SmileIdCapture";

/**
 * The KYC flow: one Smile ID session that photographs the client's face and
 * their identity document together.
 *
 * There are no uploads to the vault here, and no questions either. Smile ID's
 * capture photographs the face and the document under their own guidance, the
 * images are passed to Smile ID for checking, and none of them is stored by
 * us.
 *
 * No document-type picker: the job omits `id_type` so Smile ID classifies
 * whatever document it is actually given, which is more forgiving than holding
 * somebody to a choice made a screen earlier.
 */
function RejectionNotice({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-5 py-4 text-sm text-navy">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="leading-relaxed">
        <p className="font-medium">Your last check could not be approved.</p>
        <p className="mt-1 text-muted-foreground">{reason}</p>
      </div>
    </div>
  );
}

export function KycOnboarding({
  recheckOnly = false,
  rejectionReason,
}: {
  /**
   * Whether this client has already proved who they are.
   *
   * Identity is proved once. A returning client is asked for a selfie and
   * nothing else — no document, and none of the wording that makes a short
   * camera check read as a second identity check.
   */
  recheckOnly?: boolean;
  /** Set when the most recent attempt was rejected — surfaced so the client knows what to fix. */
  rejectionReason?: string | null;
}) {
  return (
    <div className="space-y-6">
      {rejectionReason && <RejectionNotice reason={rejectionReason} />}

      <SmileIdCapture
        title={recheckOnly ? "One last check that it is you" : "Verify your identity"}
        description={
          recheckOnly
            ? "You are already verified — this is a short selfie to confirm it is you collecting the Will. No documents, and it takes a few seconds."
            : "You'll take a selfie — smiling when asked, so we can tell a live person from a photograph — and then photograph your identity document. It takes about a minute."
        }
        footerNote={
          recheckOnly
            ? "This is used only to confirm it is you. Nothing is kept."
            : "Your photographs are passed to our identity provider for checking. We do not store them."
        }
        withDocument={!recheckOnly}
        onVerified={() => {
          // A full reload rather than a client-side refresh: this is the
          // moment `is_kyc_verified` flips, and every server component down
          // the tree (the dashboard banner, the Will gate) should see it.
          window.location.href = "/dashboard/kyc";
        }}
      />
    </div>
  );
}
