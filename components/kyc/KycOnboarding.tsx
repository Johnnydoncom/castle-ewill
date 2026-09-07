"use client";

import { AlertCircle } from "lucide-react";

import { SmileIdCapture } from "@/components/verification/SmileIdCapture";

/**
 * The KYC flow: one Smile ID session that photographs the client's identity
 * document and their face together.
 *
 * There are no uploads here, and no questions either. The client used to be
 * asked for a valid ID and a passport photograph, both of which went into the
 * vault and stayed there; Smile ID's components photograph the document under
 * their own guidance, check it against the face in the same session, and the
 * images never touch a disk of ours.
 *
 * A document-type picker used to stand in front of all this. It asked which ID
 * the client would show and then did nothing with the answer — the job omits
 * `id_type` so Smile ID auto-classifies whatever document it is actually
 * given, which is more forgiving than holding somebody to a choice made a
 * screen earlier. Their own capture screens ask for what they need.
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
   * Identity is proved once. A returning client is asked for a face and
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
            ? "You are already verified — this is a short camera check to confirm it is you collecting the Will. No documents: just follow the prompts to turn your head, and it takes a few seconds."
            : "You'll photograph your identity document, then your face — following a couple of on-screen prompts to turn your head, so we can tell a live person from a photograph. It takes about a minute."
        }
        footerNote={
          recheckOnly
            ? "We compare this against the identity you have already proved. Nothing is kept."
            : "Your photographs go straight to our identity provider for checking. We never hold them."
        }
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
