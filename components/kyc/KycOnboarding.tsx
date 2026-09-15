"use client";

import { AlertCircle } from "lucide-react";

import { SmileIdCapture } from "@/components/verification/SmileIdCapture";

/**
 * The KYC flow: the client chooses their identity document, then one Smile ID
 * capture of their face and that document — photographed or uploaded.
 *
 * Nothing goes to the vault. The images are passed to Smile ID for checking
 * and none of them is stored by us. The documents offered are Smile ID's list
 * for Nigeria, read by the server. A returning client is asked for a face and
 * nothing else.
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
            : "You'll choose your own ID and take a selfie — smiling when asked, so we can tell a live person from a photograph. Your National ID is checked by its NIN; a passport, driver's licence or voter's card is photographed or uploaded. It takes about a minute."
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
